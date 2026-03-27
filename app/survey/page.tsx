"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { surveyAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Send, ChevronRight, SkipForward, Check, Loader2 } from "lucide-react"
import { translations } from "@/locales"
import "@/styles/survey.css"

const TEST_ANSWERS: Record<string, string> = {
  // Personal identity
  gender: "Male",
  birthdate: "15 March 1990",
  blood_type: "O",
  zodiac_sign: "Pisces",
  special_features: "I have a small scar on my left chin from a childhood fall.",

  // Basic info
  full_name: "Ko Aung Kyaw. Friends call me Aung.",
  birth_and_origin: "Born in 1990 in Yangon. Grew up in Mandalay until 18 then moved to Yangon for university.",
  family: "My parents and one younger sister. My mother is the most important person in my life.",
  work_or_study: "Software developer at a startup. I enjoy building things but sometimes feel the work lacks deeper meaning.",
  current_life: "Living in Yangon now. Life is busy. I feel okay — searching for more purpose.",
  self_description: "Quiet around strangers but very talkative with close friends. Loyal but slow to trust.",
  hardest_thing: "Losing my father when I was 22. I got through it by focusing on work and taking care of my mother.",
  future_goals: "Build something meaningful. Family stability matters most.",

  // Talking style
  stranger_formality: "Polite but casual — friendly without being too open",
  disagreement_style: "Say it carefully — I make sure not to offend",
  response_length: "Medium — I explain enough to be understood",
  close_friends_talking_style: "Very open, lots of dark humor, we roast each other constantly.",

  // Emotions
  anger_expression: "I go quiet — silence is my anger",
  conflict_handling: "I think first, then address it directly but calmly.",
  stress_behaviour: "Go quiet — I need space to think",

  // Social
  stranger_first_instinct: "Friendly but watching — I'm nice but I'm observing",
  trust_speed: "Long — trust is earned, not given",
  misunderstood_trait: "People think I am cold. I am actually very warm — I just don't show it to everyone.",

  // Language habits (no mixing)
  slang_frequency: "Often — it's natural in my speech",
  humor_style: "Dry/deadpan — I say funny things with a straight face",
  swearing_frequency: "Sometimes — casually, not aggressively",

  // Thinking
  decision_style: "Think it through logically — I need to analyze",
  advice_style: "Direct — I tell them exactly what I think even if it's hard",
  worldview: "Realist — I see things as they are",
  core_thinking_trait: "I always play out the worst case scenario first. Not pessimistic — just prepared.",

  // Language (no mix frequency)
  daily_language_style: "Mostly my native language — some English words mixed in naturally",
  other_languages: "Thai — basic conversational",

  // Pronouns by relationship
  pronoun_lover: "They call me by my name or just 'em' in Burmese",
  pronoun_family: "My mother calls me Aung, my sister calls me Ko Aung",
  pronoun_close_friend: "Just Aung, or sometimes Ko depending on age",
  pronoun_friend: "Ko Aung or Aung",
  pronoun_coworker: "Ko Aung",
  pronoun_stranger: "Ko Aung or U Aung if they are much younger",
  pronoun_older: "They call me Aung or Ko Aung",
  pronoun_younger: "They call me Ko Aung or Ko",
}

interface Question {
  id: string
  text: string
  type: "choice" | "free_text"
  options?: string[]
  placeholder?: string
}

interface Section {
  id: string
  title: string
  questions: Question[]
}

interface ChatEntry {
  type: "question" | "answer"
  questionId?: string
  text: string
  options?: string[]
  sectionTitle?: string
  isNew?: boolean
}

type PageState = "survey" | "submitting" | "done"

export default function SurveyPage() {
  const router = useRouter()
  const { user, loadFromStorage } = useAuthStore()
  const queryClient = useQueryClient()

  const [mounted, setMounted]           = useState(false)
  const [pageState, setPageState]       = useState<PageState>("survey")
  const [answers, setAnswers]           = useState<Record<string, string>>({})
  const [questionIndex, setQuestionIndex] = useState(0)
  const [inputValue, setInputValue]     = useState("")
  const [chatHistory, setChatHistory]   = useState<ChatEntry[]>([])
  const [displayLanguage, setDisplayLanguage] = useState("en")

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadFromStorage(); setMounted(true) }, [])
  useEffect(() => { if (user?.language) setDisplayLanguage(user.language) }, [user?.language])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [chatHistory])

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["survey-status"],
    queryFn: () => surveyAPI.getStatus().then(r => r.data),
    enabled: !!user,
  })

  useEffect(() => {
    if (status?.completed) router.push("/dashboard")
  }, [status])

  const { data: questionsData } = useQuery({
    queryKey: ["survey-questions"],
    queryFn: () => surveyAPI.getQuestions().then(r => r.data),
    enabled: !!user,
  })

  const allQuestions: (Question & { sectionTitle: string; sectionIndex: number })[] = []
  const sections: Section[] = questionsData?.sections || []
  sections.forEach((section, sIdx) => {
    section.questions.forEach(q => {
      allQuestions.push({ ...q, sectionTitle: section.title, sectionIndex: sIdx })
    })
  })

  useEffect(() => {
    if (allQuestions.length === 0 || chatHistory.length > 0) return
    addQuestion(allQuestions[0], true)
  }, [allQuestions.length])

  const addQuestion = (q: Question & { sectionTitle: string }, isNew: boolean) => {
    setChatHistory(prev => {
      const last = prev[prev.length - 1]
      if (last?.type === "question" && last?.questionId === q.id) return prev
      return [...prev, {
        type: "question",
        questionId: q.id,
        text: q.text,
        options: q.options,
        sectionTitle: q.sectionTitle,
        isNew,
      }]
    })
  }

  const mutation = useMutation({
    mutationFn: surveyAPI.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent"] })
      queryClient.invalidateQueries({ queryKey: ["survey-status"] })
      setPageState("done")
      setTimeout(() => router.push("/dashboard"), 2000)
    },
    onError: (err: any) => {
      setPageState("survey")
      toast.error(err.response?.data?.detail || "Failed to save survey. Please try again.")
    },
  })

  const submitAnswer = (answer: string) => {
    const currentQ = allQuestions[questionIndex]
    const isOptionalQ = ["other_languages", "blood_type", "zodiac_sign", "special_features", "pronoun_lover", "pronoun_family", "pronoun_close_friend", "pronoun_friend", "pronoun_coworker", "pronoun_stranger", "pronoun_older", "pronoun_younger"].includes(currentQ?.id)
    if (!answer.trim() && !isOptionalQ) return

    const finalAnswer = answer.trim()
    setChatHistory(prev => [...prev, { type: "answer", text: finalAnswer || "—" }])

    const newAnswers = { ...answers, [currentQ.id]: finalAnswer }
    setAnswers(newAnswers)
    setInputValue("")

    const nextIndex = questionIndex + 1
    if (nextIndex >= allQuestions.length) {
      setPageState("submitting")
      const submitData = { ...newAnswers }
      if (!submitData["other_languages"]) submitData["other_languages"] = ""
      if (!submitData["blood_type"]) submitData["blood_type"] = ""
      if (!submitData["zodiac_sign"]) submitData["zodiac_sign"] = ""
      if (!submitData["special_features"]) submitData["special_features"] = ""
      if (!submitData["pronoun_lover"]) submitData["pronoun_lover"] = ""
      if (!submitData["pronoun_family"]) submitData["pronoun_family"] = ""
      if (!submitData["pronoun_close_friend"]) submitData["pronoun_close_friend"] = ""
      if (!submitData["pronoun_friend"]) submitData["pronoun_friend"] = ""
      if (!submitData["pronoun_coworker"]) submitData["pronoun_coworker"] = ""
      if (!submitData["pronoun_stranger"]) submitData["pronoun_stranger"] = ""
      if (!submitData["pronoun_older"]) submitData["pronoun_older"] = ""
      if (!submitData["pronoun_younger"]) submitData["pronoun_younger"] = ""
      mutation.mutate(submitData)
    } else {
      setQuestionIndex(nextIndex)
      setTimeout(() => addQuestion(allQuestions[nextIndex], true), 400)
    }
  }

  const handleSend = () => {
    if (currentQuestion?.type === "choice") return
    submitAnswer(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handlePrefill = () => {
    const newAnswers = { ...answers, ...TEST_ANSWERS }
    setAnswers(newAnswers)
    const history: ChatEntry[] = []
    const stopAt = allQuestions.length - 1
    allQuestions.slice(0, stopAt).forEach(q => {
      history.push({ type: "question", questionId: q.id, text: q.text, sectionTitle: q.sectionTitle })
      history.push({ type: "answer", text: TEST_ANSWERS[q.id] || "—" })
    })
    const lastQ = allQuestions[stopAt]
    history.push({ type: "question", questionId: lastQ.id, text: lastQ.text, options: lastQ.options, sectionTitle: lastQ.sectionTitle, isNew: true })
    setChatHistory(history)
    setQuestionIndex(stopAt)
  }

  const currentQuestion = allQuestions[questionIndex]
  const progress = allQuestions.length > 0 ? (questionIndex / allQuestions.length) * 100 : 0
  const OPTIONAL_IDS = ["other_languages", "blood_type", "zodiac_sign", "special_features", "pronoun_lover", "pronoun_family", "pronoun_close_friend", "pronoun_friend", "pronoun_coworker", "pronoun_stranger", "pronoun_older", "pronoun_younger"]
  const isOptional = OPTIONAL_IDS.includes(currentQuestion?.id)

  const allAnswered = questionIndex >= allQuestions.length - 1 && Object.keys(answers).length >= allQuestions.filter(q => !OPTIONAL_IDS.includes(q.id)).length

  const getOptionEnglishValue = (questionId: string, optionIndex: number, fallback: string): string => {
    const enT = (translations as any)["en"]
    return enT?.questions?.options?.[questionId]?.[optionIndex] ?? fallback
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!mounted || !user || statusLoading || allQuestions.length === 0) {
    return (
      <div className="sv-fullpage">
        <div className="sv-fullpage-icon loading">
          <Loader2 className="animate-spin" />
        </div>
        <div>
          <p className="sv-fullpage-title">Loading survey</p>
          <p className="sv-fullpage-sub">Just a moment…</p>
        </div>
      </div>
    )
  }

  // ── Submitting ────────────────────────────────────────────────────────────
  if (pageState === "submitting") {
    return (
      <div className="sv-fullpage">
        <div className="sv-fullpage-icon loading">
          <Loader2 className="animate-spin" />
        </div>
        <div>
          <p className="sv-fullpage-title">Building your agent</p>
          <p className="sv-fullpage-sub">Processing your survey. Please wait.</p>
        </div>
      </div>
    )
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (pageState === "done") {
    return (
      <div className="sv-fullpage">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="sv-fullpage-icon success"
        >
          <Check />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="sv-fullpage-title">Survey complete</p>
          <p className="sv-fullpage-sub">Your agent foundation is set. Redirecting…</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="sv-bounce-dots"
        >
          {[0, 150, 300].map(delay => (
            <div
              key={delay}
              className="sv-bounce-dot animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </motion.div>
      </div>
    )
  }

  // ── Survey ────────────────────────────────────────────────────────────────
  return (
    <main className="sv-shell">

      {/* Header */}
      <div className="sv-header">
        <div className="sv-header-left">
          <span className="sv-brand">imm<span>or</span>tality</span>
          <div className="sv-header-sep" />
          <span className="sv-header-label">Foundation Survey</span>
        </div>
        <div className="sv-header-right">
          <button className="sv-prefill-btn" onClick={handlePrefill}>
            <SkipForward />
            Test Fill
          </button>
          {user.language !== "en" && (
            <div className="sv-lang-toggle">
              <button
                className={`sv-lang-btn ${displayLanguage === "en" ? "active" : ""}`}
                onClick={() => setDisplayLanguage("en")}
              >
                EN
              </button>
              <button
                className={`sv-lang-btn ${displayLanguage === user.language ? "active" : ""}`}
                onClick={() => setDisplayLanguage(user.language)}
              >
                {user.language.toUpperCase()}
              </button>
            </div>
          )}
          <span className="sv-counter">
            {Math.min(questionIndex + 1, allQuestions.length)} / {allQuestions.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="sv-progress-track">
        <motion.div
          className="sv-progress-fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Messages */}
      <div className="sv-messages">
        <div className="sv-messages-inner">

          {/* Intro message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sv-agent-row"
          >
            <div className="sv-agent-avatar">✦</div>
            <div className="sv-agent-body">
              <div className="sv-agent-bubble">
                Hi {user.name?.split(" ")[0]}. I'm going to ask you some questions to understand who you are.
                Take your time. Answer naturally.
              </div>
            </div>
          </motion.div>

          {/* Chat history */}
          <AnimatePresence initial={false}>
            {chatHistory.map((entry, idx) => (
              <motion.div
                key={idx}
                initial={entry.isNew ? { opacity: 0, y: 14 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className={entry.type === "answer" ? "sv-user-row" : "sv-agent-row"}
              >
                {entry.type === "question" && (
                  <>
                    <div className="sv-agent-avatar">✦</div>
                    <div className="sv-agent-body">
                      {(idx === 0 || chatHistory[idx - 2]?.sectionTitle !== entry.sectionTitle) && (
                        <p className="sv-section-label">{entry.sectionTitle}</p>
                      )}
                      <div className="sv-agent-bubble">{entry.text}</div>

                      {/* Choice options — only for active unanswered question */}
                      {entry.options && entry.questionId === currentQuestion?.id && !answers[entry.questionId!] && (
                        <div className="sv-options">
                          {entry.options.map((option, optIdx) => {
                            const englishValue = getOptionEnglishValue(entry.questionId!, optIdx, option)
                            return (
                              <motion.button
                                key={option}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: optIdx * 0.05 }}
                                className="sv-option-btn"
                                onClick={() => submitAnswer(englishValue)}
                              >
                                {option}
                              </motion.button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {entry.type === "answer" && (
                  <div className="sv-user-bubble">{entry.text}</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar — only for free_text, or retry button if all answered */}
      {pageState === "survey" && (
        allAnswered ? (
          <div className="sv-input-bar">
            <div className="sv-input-inner">
              <div className="sv-skip-row" style={{ justifyContent: "center" }}>
                <p style={{ fontSize: 13, color: "var(--imm-txt3)", marginBottom: 10 }}>
                  Something went wrong. Your answers are saved — tap below to try again.
                </p>
              </div>
              <button
                className="sv-send-btn"
                style={{ width: "100%", borderRadius: 12, height: 46, fontSize: 14 }}
                onClick={() => {
                  setPageState("submitting")
                  const submitData = { ...answers }
                  OPTIONAL_IDS.forEach(id => { if (!submitData[id]) submitData[id] = "" })
                  mutation.mutate(submitData)
                }}
              >
                <Send /> Resend survey
              </button>
            </div>
          </div>
        ) : currentQuestion?.type === "free_text" ? (
          <div className="sv-input-bar">
            <div className="sv-input-inner">
              {isOptional && (
                <div className="sv-skip-row">
                  <button className="sv-skip-btn" onClick={() => submitAnswer("")}>
                    Skip — optional <ChevronRight />
                  </button>
                </div>
              )}
              <div className="sv-input-row">
                <textarea
                  className="sv-textarea"
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value)
                    e.target.style.height = "auto"
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={currentQuestion?.placeholder || "Type your answer…"}
                  rows={1}
                  autoFocus
                />
                <button
                  className="sv-send-btn"
                  onClick={handleSend}
                  disabled={!inputValue.trim() && !isOptional}
                >
                  <Send />
                </button>
              </div>
              <p className="sv-input-hint">Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        ) : null
      )}

    </main>
  )
}