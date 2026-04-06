/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { surveyAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useTranslation } from "@/locales"
import { toast } from "sonner"

// ── Constants (non-translatable) ───────────────────────────────────────────

export const STEP_COUNT   = 7   // used by SurveyProgressDots
export const BLOOD_TYPES  = ["A", "B", "AB", "O", "I don't know"]
export const ZODIAC_SIGNS = [
  "Aries","Taurus","Gemini","Cancer",
  "Leo","Virgo","Libra","Scorpio",
  "Sagittarius","Capricorn","Aquarius","Pisces",
]

export interface Step {
  id:           string
  question:     string
  subtext?:     string
  type:         "text" | "number" | "select" | "multi_text"
  options?:     string[]
  placeholder?: string
  required?:    boolean
}

export function buildSteps(t: (k: string) => string): Step[] {
  return [
    {
      id:          "full_name",
      type:        "text",
      question:    t("survey.q_full_name"),
      subtext:     t("survey.q_full_name_sub"),
      placeholder: t("survey.q_full_name_ph"),
      required:    true,
    },
    {
      id:          "age",
      type:        "number",
      question:    t("survey.q_age"),
      subtext:     t("survey.q_age_sub"),
      placeholder: t("survey.q_age_ph"),
    },
    {
      id:          "birthdate",
      type:        "text",
      question:    t("survey.q_birthdate"),
      subtext:     t("survey.q_birthdate_sub"),
      placeholder: t("survey.q_birthdate_ph"),
    },
    {
      id:       "blood_type",
      type:     "select",
      question: t("survey.q_blood_type"),
      subtext:  t("survey.q_blood_type_sub"),
      options:  [
        t("survey.q_blood_type_opt_a"),
        t("survey.q_blood_type_opt_b"),
        t("survey.q_blood_type_opt_ab"),
        t("survey.q_blood_type_opt_o"),
        t("survey.q_blood_type_opt_dk"),
      ],
    },
    {
      id:       "zodiac_sign",
      type:     "select",
      question: t("survey.q_zodiac"),
      subtext:  t("survey.q_zodiac_sub"),
      options:  [
        t("survey.q_zodiac_aries"),
        t("survey.q_zodiac_taurus"),
        t("survey.q_zodiac_gemini"),
        t("survey.q_zodiac_cancer"),
        t("survey.q_zodiac_leo"),
        t("survey.q_zodiac_virgo"),
        t("survey.q_zodiac_libra"),
        t("survey.q_zodiac_scorpio"),
        t("survey.q_zodiac_sagittarius"),
        t("survey.q_zodiac_capricorn"),
        t("survey.q_zodiac_aquarius"),
        t("survey.q_zodiac_pisces"),
      ],
    },
    {
      id:          "current_location",
      type:        "text",
      question:    t("survey.q_location"),
      subtext:     t("survey.q_location_sub"),
      placeholder: t("survey.q_location_ph"),
    },
    {
      id:          "past_locations",
      type:        "multi_text",
      question:    t("survey.q_past_locations"),
      subtext:     t("survey.q_past_locations_sub"),
      placeholder: t("survey.q_past_locations_ph"),
    },
  ]
}

export type PageState = "wizard" | "submitting" | "done"

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSurveyWizard() {
  const router      = useRouter()
  const queryClient = useQueryClient()

  const user            = useAuthStore(s => s.user)
  const displayLanguage = useAuthStore(s => s.displayLanguage)
  const loadFromStorage = useAuthStore(s => s.loadFromStorage)

  const lang = (displayLanguage !== "en" ? displayLanguage : null)
            ?? user?.language
            ?? "en"

  const { t } = useTranslation(lang)

  const [mounted,   setMounted]   = useState(false)
  const [pageState, setPageState] = useState<PageState>("wizard")
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [answers,   setAnswers]   = useState<Record<string, any>>({
    past_locations: [""],
  })

  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null)

  useEffect(() => { loadFromStorage(); setMounted(true) }, [])

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 320)
    return () => clearTimeout(timer)
  }, [stepIndex])

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["survey-status"],
    queryFn:  () => surveyAPI.me().then(r => r.data),
    enabled:  !!user,
  })

  useEffect(() => {
    if (!status) return
    if (status.is_completed && status.onboarding_step === "pronoun_setup") router.push("/setup/pronouns")
    if (status.is_completed && status.onboarding_step === "ready")         router.push("/dashboard")
  }, [status])

  const mutation = useMutation({
    mutationFn: surveyAPI.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-status"] })
      queryClient.invalidateQueries({ queryKey: ["agent"] })
      setPageState("done")
      setTimeout(() => router.push("/setup/pronouns"), 1400)
    },
    onError: (err: any) => {
      setPageState("wizard")
      toast.error(err.response?.data?.detail || t("survey.saveError"))
    },
  })

  // ── Derived ──────────────────────────────────────────────────────────────

  const steps      = buildSteps(t)
  const current    = steps[stepIndex]
  const isRequired = current?.required === true
  const isLast     = stepIndex === steps.length - 1
  const progress   = (stepIndex / steps.length) * 100

  const getValue = (id: string) => answers[id] ?? ""
  const setValue = (id: string, val: any) =>
    setAnswers(prev => ({ ...prev, [id]: val }))

  const canAdvance = (): boolean => {
    if (!isRequired) return true
    const val = getValue(current.id)
    if (current.type === "text" || current.type === "number") {
      return String(val).trim().length > 0
    }
    return true
  }

  const goNext = () => {
    if (!canAdvance()) { toast.error(t("survey.required")); return }
    if (isLast) { handleSubmit(); return }
    setDirection(1)
    setStepIndex(i => i + 1)
  }

  const goBack = () => {
    if (stepIndex === 0) return
    setDirection(-1)
    setStepIndex(i => i - 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && current.type !== "multi_text") {
      e.preventDefault()
      goNext()
    }
  }

  const handleSubmit = () => {
    const a    = answers
    const past = (a.past_locations as string[] || []).map((s: string) => s.trim()).filter(Boolean)
    setPageState("submitting")
    mutation.mutate({
      full_name:        String(a.full_name || "").trim(),
      age:              a.age ? parseInt(String(a.age), 10) : undefined,
      birthdate:        String(a.birthdate || "").trim() || undefined,
      blood_type:       a.blood_type || undefined,
      zodiac_sign:      a.zodiac_sign || undefined,
      current_location: String(a.current_location || "").trim() || undefined,
      past_locations:   past,
    })
  }

  // ── Multi-text helpers ────────────────────────────────────────────────────

  const getList = (): string[] => {
    const v = answers[current.id]
    return Array.isArray(v) ? v : [""]
  }

  const updateListItem = (idx: number, val: string) => {
    const list = [...getList()]
    list[idx]  = val
    setValue(current.id, list)
  }

  const addListItem    = () => setValue(current.id, [...getList(), ""])
  const removeListItem = (idx: number) => {
    const list = getList().filter((_, i) => i !== idx)
    setValue(current.id, list.length ? list : [""])
  }

  return {
    // state
    mounted, pageState, stepIndex, direction, answers,
    inputRef, statusLoading, user,
    // derived
    steps, current, isRequired, isLast, progress,
    // value helpers
    getValue, setValue,
    canAdvance, goNext, goBack, handleKeyDown,
    // multi-text
    getList, updateListItem, addListItem, removeListItem,
  }
}