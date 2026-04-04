import { useState, useRef, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { chatAPI, feedbackAPI, relationshipsAPI, agentAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { ChatMessage } from "@/types"

export type GateStep = "type" | "role" | "name" | "stranger_info" | "ready"
export type Gender   = "male" | "female" | "other" | "prefer_not"

export interface TypeOption {
  type_id:         string
  type_name:       string
  type_name_local: string
  access_mode:     "closed" | "open_role" | "open"
  roles:           RoleOption[]
  default_role_id: string | null
}

export interface RoleOption {
  id:         string
  name:       string
  name_local: string
}

export interface ResolvedSpeaker {
  display_name:        string
  role_id:             string
  role_name:           string
  role_name_local:     string
  person_id:           string | null
  found_person:        boolean
  effective_address:   string
  effective_self:      string
  forbidden_particles: string[]
  voice_summary:       string | null
  zone:                number
  speaker_gender:      string | null
  speaker_age:         number | null
}

export function zoneFromAccessMode(mode: string): number {
  if (mode === "closed")    return 2
  if (mode === "open_role") return 4
  return 5
}

export function useChat() {
  const { user } = useAuthStore()

  // ── Gate state ────────────────────────────────────────────────────────
  const [gateStep,        setGateStep]        = useState<GateStep>("type")
  const [selectedType,    setSelectedType]    = useState<TypeOption | null>(null)
  const [selectedRole,    setSelectedRole]    = useState<RoleOption | null>(null)
  const [nameInput,       setNameInput]       = useState("")
  const [gender,          setGender]          = useState<Gender | null>(null)
  const [speakerAgeInput, setSpeakerAgeInput] = useState<string>("")
  const [fieldErr,        setFieldErr]        = useState<string | null>(null)
  const [speaker,         setSpeaker]         = useState<ResolvedSpeaker | null>(null)

  // ── Chat state ────────────────────────────────────────────────────────
  const [messages,       setMessages]       = useState<ChatMessage[]>([])
  const [input,          setInput]          = useState("")
  const [correcting,     setCorrecting]     = useState<string | null>(null)
  const [correctionText, setCorrectionText] = useState("")
  const [sessionKey]                        = useState(() => crypto.randomUUID())

  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // ── Queries ───────────────────────────────────────────────────────────
  const { data: agentData } = useQuery({
    queryKey: ["agent"],
    queryFn:  () => agentAPI.me().then(r => r.data),
    enabled:  !!user,
  })

  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ["types-for-chat", agentData?.agent_id],
    queryFn:  () => relationshipsAPI.getTypesForChat(agentData!.agent_id).then(r => r.data.types as TypeOption[]),
    enabled:  !!agentData?.agent_id,
  })

  // ── Validate ──────────────────────────────────────────────────────────
  const validateIdentity = (): boolean => {
    if (!nameInput.trim()) { setFieldErr("Please enter your name."); return false }
    if (!gender)            { setFieldErr("Please select your gender."); return false }
    const age = parseInt(speakerAgeInput, 10)
    if (!speakerAgeInput.trim() || isNaN(age) || age < 1 || age > 120) {
      setFieldErr("Please enter a valid age (1–120).")
      return false
    }
    setFieldErr(null)
    return true
  }

  // ── Identify mutation ─────────────────────────────────────────────────
  const identifyMutation = useMutation({
    mutationFn: (p: { speaker_name: string; role_id: string; agent_id: string }) =>
      relationshipsAPI.identify(p).then(r => r.data),
    onSuccess: (data, vars) => {
      if (!selectedType) return
      const roleName      = selectedRole?.name      || data.role?.name      || "Stranger"
      const roleNameLocal = selectedRole?.name_local || data.role?.name_local || ""
      const roleId        = selectedRole?.id         || vars.role_id
      const age           = parseInt(speakerAgeInput, 10)
      setSpeaker({
        display_name:        data.display_name || nameInput.trim() || roleName,
        role_id:             roleId,
        role_name:           roleName,
        role_name_local:     roleNameLocal,
        person_id:           data.person?.id || null,
        found_person:        data.found_person || false,
        effective_address:   data.effective_address_form || "",
        effective_self:      data.effective_self_address || "",
        forbidden_particles: data.forbidden_particles || [],
        voice_summary:       data.voice_summary || null,
        zone:                zoneFromAccessMode(selectedType.access_mode),
        speaker_gender:      gender,
        speaker_age:         isNaN(age) ? null : age,
      })
      setGateStep("ready")
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  })

  // ── Gate handlers ─────────────────────────────────────────────────────
  const handleTypeSelect = (type: TypeOption) => {
    setSelectedType(type); setFieldErr(null)
    if (type.access_mode === "open") setGateStep("stranger_info")
    else setGateStep("role")
  }

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role); setFieldErr(null); setGateStep("name")
  }

  const handleNameContinue = () => {
    if (!validateIdentity()) return
    if (!selectedRole || !agentData?.agent_id) return
    identifyMutation.mutate({
      speaker_name: nameInput.trim(),
      role_id:      selectedRole.id,
      agent_id:     agentData.agent_id,
    })
  }

  const handleStrangerContinue = () => {
    if (!validateIdentity()) return
    if (!selectedType?.default_role_id || !agentData?.agent_id) return
    identifyMutation.mutate({
      speaker_name: nameInput.trim(),
      role_id:      selectedType.default_role_id,
      agent_id:     agentData.agent_id,
    })
  }

  const handleReset = () => {
    setSpeaker(null); setMessages([]); setNameInput("")
    setSelectedType(null); setSelectedRole(null)
    setGender(null); setSpeakerAgeInput("")
    setFieldErr(null); setGateStep("type")
  }

  // ── Chat mutations ────────────────────────────────────────────────────
  const chatMutation = useMutation({
    mutationFn: chatAPI.send,
    onSuccess: (res) => {
      setMessages(m => [...m, {
        id:            crypto.randomUUID(),
        role:          "agent",
        content:       res.data.response,
        memories_used: res.data.memories_used,
        response_id:   res.data.response_id,
        timestamp:     new Date(),
      }])
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed"),
  })

  const feedbackMutation = useMutation({
    mutationFn: feedbackAPI.submit,
    onSuccess: (_, vars) => {
      if (vars.feedback === "like") toast.success("Noted")
      if (vars.feedback === "corrected") {
        toast.success("Correction saved.")
        setCorrecting(null); setCorrectionText("")
      }
    },
    onError: () => toast.error("Failed to save feedback"),
  })

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending || !speaker) return
    setMessages(m => [...m, { id: crypto.randomUUID(), role: "user", content: input, timestamp: new Date() }])
    chatMutation.mutate({
      message:        input,
      language:       user?.language || "en",
      speaker_name:   speaker.display_name,
      role_id:        speaker.role_id,
      person_id:      speaker.person_id || undefined,
      session_key:    sessionKey,
      speaker_gender: speaker.speaker_gender || undefined,
      speaker_age:    speaker.speaker_age ?? undefined,
    })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

    return {
        user,
        // gate
        gateStep, selectedType, selectedRole,
        setSelectedType,   
        setSelectedRole,   
        setGateStep,     
        nameInput, setNameInput,
        gender, setGender,
        speakerAgeInput, setSpeakerAgeInput,
        fieldErr, setFieldErr,
        speaker, typesData, typesLoading, agentData,
        identifyMutation,
        handleTypeSelect, handleRoleSelect,
        handleNameContinue, handleStrangerContinue, handleReset,
        // chat
        messages, input, setInput,
        correcting, setCorrecting,
        correctionText, setCorrectionText,
        bottomRef, sessionKey,
        chatMutation, feedbackMutation,
        handleSend, handleKeyDown,
    }
}