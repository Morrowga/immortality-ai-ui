import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { voiceAPI } from "@/lib/api"
import { toast } from "sonner"

export type Slot        = "native" | "en"
export type RecordState = "idle" | "recording" | "recorded" | "cloning" | "done"

export interface SlotStatus {
  trained:          boolean
  voice_id:         string | null
  duration_seconds: number | null
  created_at:       string | null
}

export interface VoiceStatus {
  enabled:            boolean
  native:             SlotStatus
  english:            SlotStatus
  english_applicable: boolean
}

export interface TemplateSection {
  language:            string
  language_name:       string
  language_name_local: string
  title:               string
  instruction:         string
  text:                string
  word_count:          number
  optional?:           boolean
}

export interface VoiceTemplate {
  native:  TemplateSection
  english: TemplateSection | null
}

export function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, "0")}`
}

export function useVoice() {
  const queryClient = useQueryClient()

  const [activeSlot,  setActiveSlot]  = useState<Slot | null>(null)
  const [recordState, setRecordState] = useState<RecordState>("idle")
  const [duration,    setDuration]    = useState(0)
  const [audioBlob,   setAudioBlob]   = useState<Blob | null>(null)
  const [audioUrl,    setAudioUrl]    = useState<string | null>(null)
  const [removeBg,    setRemoveBg]    = useState(false)

  const mediaRef  = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef  = useRef<NodeJS.Timeout | null>(null)
  const panelRef  = useRef<HTMLDivElement>(null)

  const { data: status, isLoading: statusLoading } = useQuery<VoiceStatus>({
    queryKey: ["voice-status"],
    queryFn:  () => voiceAPI.status().then(r => r.data),
  })

  const { data: template } = useQuery<VoiceTemplate>({
    queryKey: ["voice-template"],
    queryFn:  () => voiceAPI.getTemplate().then(r => r.data),
    enabled:  status?.enabled === true,
  })

  useEffect(() => {
    if (activeSlot) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80)
    }
  }, [activeSlot])

  useEffect(() => {
    if (recordState === "recording") {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [recordState])

  const cloneMutation = useMutation({
    mutationFn: ({ blob, slot }: { blob: Blob; slot: Slot }) =>
      voiceAPI.record(blob, false, slot).then(r => r.data),
    onSuccess: () => {
      setRecordState("done")
      queryClient.invalidateQueries({ queryKey: ["voice-status"] })
      toast.success("Voice cloned. Your agent will now speak in your voice.")
    },
    onError: (err: any) => {
      setRecordState("recorded")
      toast.error(err.response?.data?.detail || "Cloning failed. Please try again.")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (slot: Slot) => voiceAPI.deleteSlot(slot).then(r => r.data),
    onSuccess: (_, slot) => {
      queryClient.invalidateQueries({ queryKey: ["voice-status"] })
      toast.success(`${slot === "native" ? "Native" : "English"} voice deleted.`)
      if (activeSlot === slot) closePanel()
    },
    onError: () => toast.error("Failed to delete voice."),
  })

  const startRecording = async () => {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setRecordState("recorded")
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRef.current = recorder
      recorder.start()
      setDuration(0)
      setRecordState("recording")
    } catch {
      toast.error("Microphone access denied.")
    }
  }

  const stopRecording  = () => { if (mediaRef.current?.state === "recording") mediaRef.current.stop() }
  const resetRecording = () => { setRecordState("idle"); setAudioBlob(null); setAudioUrl(null); setDuration(0) }
  const openPanel      = (slot: Slot) => { setActiveSlot(slot); resetRecording() }
  const closePanel     = () => { setActiveSlot(null); resetRecording() }

  const submitRecording = () => {
    if (!audioBlob || !activeSlot) return
    if (duration < 30) { toast.error("Recording too short. Please record at least 30 seconds."); return }
    setRecordState("cloning")
    cloneMutation.mutate({ blob: audioBlob, slot: activeSlot })
  }

  const nativeStatus  = status?.native  ?? { trained: false, voice_id: null, duration_seconds: null, created_at: null }
  const englishStatus = status?.english ?? { trained: false, voice_id: null, duration_seconds: null, created_at: null }
  const showEnglish   = status?.english_applicable ?? true
  const activeTemplate = activeSlot === "en" ? template?.english : template?.native

  return {
    // state
    activeSlot, recordState, duration, audioUrl, removeBg, setRemoveBg,
    panelRef, statusLoading,
    // data
    status, template, nativeStatus, englishStatus, showEnglish, activeTemplate,
    // actions
    openPanel, closePanel, startRecording, stopRecording,
    resetRecording, submitRecording,
    // mutations
    cloneMutation, deleteMutation,
  }
}