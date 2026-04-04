import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { surveyAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"

// ── Constants ──────────────────────────────────────────────────────────────

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

export const STEPS: Step[] = [
  {
    id:          "full_name",
    question:    "What is your full name?",
    subtext:     "This is how your agent will know you.",
    type:        "text",
    placeholder: "e.g. Ko Aung Kyaw",
    required:    true,
  },
  {
    id:          "age",
    question:    "How old are you?",
    subtext:     "Used to understand age gaps with the people in your life.",
    type:        "number",
    placeholder: "e.g. 28",
  },
  {
    id:          "birthdate",
    question:    "When were you born?",
    subtext:     "Day, month, year — however you prefer to write it.",
    type:        "text",
    placeholder: "e.g. 15 March 1995",
  },
  {
    id:          "blood_type",
    question:    "What is your blood type?",
    subtext:     "Optional — your agent can answer questions about this.",
    type:        "select",
    options:     BLOOD_TYPES,
  },
  {
    id:          "zodiac_sign",
    question:    "What is your zodiac sign?",
    subtext:     "Optional.",
    type:        "select",
    options:     ZODIAC_SIGNS,
  },
  {
    id:          "current_location",
    question:    "Where do you live now?",
    subtext:     "City and country is enough.",
    type:        "text",
    placeholder: "e.g. Yangon, Myanmar",
  },
  {
    id:          "past_locations",
    question:    "Where have you lived before?",
    subtext:     "Add as many places as you want. One per line.",
    type:        "multi_text",
    placeholder: "e.g. Mandalay 2000–2015",
  },
]

export type PageState = "wizard" | "submitting" | "done"

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSurveyWizard() {
  const router      = useRouter()
  const { user, loadFromStorage } = useAuthStore()
  const queryClient = useQueryClient()

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
    const t = setTimeout(() => inputRef.current?.focus(), 320)
    return () => clearTimeout(t)
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
      toast.error(err.response?.data?.detail || "Failed to save. Please try again.")
    },
  })

  // ── Derived ──────────────────────────────────────────────────────────────

  const current    = STEPS[stepIndex]
  const isRequired = current?.required === true
  const isLast     = stepIndex === STEPS.length - 1
  const progress   = (stepIndex / STEPS.length) * 100

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
    if (!canAdvance()) { toast.error("This field is required."); return }
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
    current, isRequired, isLast, progress,
    // value helpers
    getValue, setValue,
    canAdvance, goNext, goBack, handleKeyDown,
    // multi-text
    getList, updateListItem, addListItem, removeListItem,
  }
}