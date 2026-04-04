import { useState, useRef, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import Cookies from "js-cookie"
import { publicAPI, feedbackAPI } from "@/lib/api"

export type Step   = "passphrase" | "identity" | "chat"
export type Gender = "male" | "female" | "other"

export interface AgentInfo {
  agent_name:       string
  owner_first_name: string
  slug:             string
  is_ready:         boolean
  total_memories:   number
}

export interface SessionData {
  session_token:   string
  person_name:     string
  role_name:       string
  role_name_local: string | null
  zone:            number
  person_gender:   string | null
  person_age:      number | null
}

export interface IdentityData {
  name:   string
  gender: Gender
  age:    number
}

export interface PublicChatMessage {
  id:             string
  role:           "user" | "agent"
  content:        string
  memories_used?: number
  response_id?:   string
  timestamp:      Date
}

// ── Storage keys ───────────────────────────────────────────────────────────
const sessionCookieKey     = (slug: string) => `pub_session_${slug}`
const identityCookieKey    = (slug: string) => `pub_identity_${slug}`
const sessionKeyStorageKey = (slug: string) => `pub_conv_key_${slug}`
const neoModeStorageKey    = (slug: string) => `pub_neo_${slug}`

const COOKIE_OPTS = { expires: 7 }

// ── Persistent session key helpers ─────────────────────────────────────────
function getOrCreateSessionKey(slug: string): string {
  const existing = localStorage.getItem(sessionKeyStorageKey(slug))
  if (existing) return existing
  const fresh = crypto.randomUUID()
  localStorage.setItem(sessionKeyStorageKey(slug), fresh)
  return fresh
}

function clearSessionKey(slug: string) {
  localStorage.removeItem(sessionKeyStorageKey(slug))
}

// ── Map API history response → PublicChatMessage[] ────────────────────────
function mapHistoryToMessages(
  apiMessages: Array<{
    id:            string
    role:          "user" | "assistant"
    content:       string
    speaker_name?: string
    created_at?:   string
    response_id?:  string
  }>
): PublicChatMessage[] {
  return apiMessages.map(m => ({
    id:          m.id,
    role:        m.role === "assistant" ? "agent" : "user",
    content:     m.content,
    response_id: m.response_id,
    timestamp:   m.created_at ? new Date(m.created_at) : new Date(),
  }))
}


export function usePublicChat(slug: string) {
  const [agentInfo,      setAgentInfo]      = useState<AgentInfo | null>(null)
  const [agentError,     setAgentError]     = useState<string | null>(null)
  const [step,           setStep]           = useState<Step>("passphrase")
  const [session,        setSession]        = useState<SessionData | null>(null)
  const [identity,       setIdentity]       = useState<IdentityData | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Passphrase
  const [passphrase,    setPassphrase]    = useState("")
  const [showPass,      setShowPass]      = useState(false)
  const [passphraseErr, setPassphraseErr] = useState<string | null>(null)

  // Identity
  const [nameInput,   setNameInput]   = useState("")
  const [gender,      setGender]      = useState<Gender | null>(null)
  const [ageInput,    setAgeInput]    = useState("")
  const [identityErr, setIdentityErr] = useState<string | null>(null)

  // Chat
  const [messages,       setMessages]       = useState<PublicChatMessage[]>([])
  const [input,          setInput]          = useState("")
  const [correcting,     setCorrecting]     = useState<string | null>(null)
  const [correctionTxt,  setCorrectionTxt]  = useState("")
  const [convSessionKey, setConvSessionKey] = useState<string>("")

  // Neo Mode — persisted per slug in localStorage
  const [neoMode, setNeoModeState] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Initialize session key + neo mode on mount ─────────────────────────
  useEffect(() => {
    const key = getOrCreateSessionKey(slug)
    setConvSessionKey(key)
    // Restore neo mode preference
    const savedNeo = localStorage.getItem(neoModeStorageKey(slug))
    if (savedNeo === "true") setNeoModeState(true)
  }, [slug])

  // ── Persist neo mode toggle ────────────────────────────────────────────
  function setNeoMode(val: boolean) {
    setNeoModeState(val)
    localStorage.setItem(neoModeStorageKey(slug), String(val))
  }

  // ── Load agent info ────────────────────────────────────────────────────
  useEffect(() => {
    publicAPI.agent(slug)
      .then(res => setAgentInfo(res.data))
      .catch((e: Error) => setAgentError(e.message))
  }, [slug])

  // ── Restore session from cookies ───────────────────────────────────────
  useEffect(() => {
    const rawSession  = Cookies.get(sessionCookieKey(slug))
    const rawIdentity = Cookies.get(identityCookieKey(slug))
    if (rawSession && rawIdentity) {
      try {
        setSession(JSON.parse(rawSession))
        setIdentity(JSON.parse(rawIdentity))
        setStep("chat")
      } catch {
        Cookies.remove(sessionCookieKey(slug))
        Cookies.remove(identityCookieKey(slug))
      }
    }
  }, [slug])

  // ── Rehydrate history when step becomes "chat" ─────────────────────────
  useEffect(() => {
    if (step !== "chat") return
    if (!convSessionKey) return
    if (messages.length > 0) return

    setHistoryLoading(true)
    publicAPI.history(slug, convSessionKey, 50)
      .then(res => {
        if (res.data.messages?.length > 0) {
          setMessages(mapHistoryToMessages(res.data.messages))
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [step, convSessionKey, slug])

  // ── Scroll to bottom on new messages ──────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Verify passphrase ──────────────────────────────────────────────────
  const verifyMutation = useMutation({
    mutationFn: () =>
      publicAPI.verify(slug, passphrase.trim()).then(res => res.data),
    onSuccess: (data: SessionData) => {
      setSession(data)
      if (data.person_name)   setNameInput(data.person_name)
      if (data.person_gender) setGender(data.person_gender as Gender)
      if (data.person_age)    setAgeInput(String(data.person_age))
      setPassphraseErr(null)
      setStep("identity")
    },
    onError: (e: Error) => setPassphraseErr(e.message),
  })

  // ── Identity submit ────────────────────────────────────────────────────
  const handleIdentitySubmit = () => {
    if (!nameInput.trim()) { setIdentityErr("Name is required"); return }
    if (!gender)            { setIdentityErr("Please select your gender"); return }
    const age = parseInt(ageInput, 10)
    if (!ageInput || isNaN(age) || age < 1 || age > 120) {
      if (!session?.person_age) { setIdentityErr("Please enter a valid age (1–120)"); return }
    }
    setIdentityErr(null)
    const id: IdentityData = {
      name:   nameInput.trim(),
      gender: gender,
      age:    isNaN(age) ? session!.person_age! : age,
    }
    setIdentity(id)
    Cookies.set(sessionCookieKey(slug),  JSON.stringify(session), COOKIE_OPTS)
    Cookies.set(identityCookieKey(slug), JSON.stringify(id),      COOKIE_OPTS)
    setStep("chat")
  }

  // ── Send message ───────────────────────────────────────────────────────
  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      publicAPI.chat(slug, {
        message,
        session_token:  session!.session_token,
        speaker_name:   identity!.name,
        speaker_gender: identity!.gender,
        speaker_age:    identity!.age,
        session_key:    convSessionKey,
        neo_mode:       neoMode,        
      }).then(res => res.data),
    onSuccess: (data) => {
      setMessages(m => [...m, {
        id:            crypto.randomUUID(),
        role:          "agent",
        content:       data.response,
        memories_used: data.memories_used,
        response_id:   data.response_id,
        timestamp:     new Date(),
      }])
    },
    onError: (e: Error) => {
      if (e.message.includes("revoked") || e.message.includes("expired")) {
        Cookies.remove(sessionCookieKey(slug))
        Cookies.remove(identityCookieKey(slug))
        setStep("passphrase"); setSession(null); setMessages([])
      }
    },
  })

  // ── Feedback ───────────────────────────────────────────────────────────
  const feedbackMutation = useMutation({
    mutationFn: (vars: { response_id: string; feedback: string; correction_text?: string }) =>
      feedbackAPI.submit(vars).then(res => res.data),
    onSuccess: (_, vars) => {
      if (vars.feedback === "corrected") { setCorrecting(null); setCorrectionTxt("") }
    },
  })

  // ── Send handler ───────────────────────────────────────────────────────
  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending || !convSessionKey) return
    setMessages(m => [...m, {
      id: crypto.randomUUID(), role: "user", content: input, timestamp: new Date(),
    }])
    chatMutation.mutate(input)
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleReset = () => {
    Cookies.remove(sessionCookieKey(slug))
    Cookies.remove(identityCookieKey(slug))
    clearSessionKey(slug)
    localStorage.removeItem(neoModeStorageKey(slug))
    setConvSessionKey(crypto.randomUUID())
    setSession(null); setIdentity(null); setMessages([])
    setPassphrase(""); setNameInput(""); setGender(null); setAgeInput("")
    setPassphraseErr(null); setIdentityErr(null)
    setNeoModeState(false)
    setStep("passphrase")
  }

  return {
    // agent
    agentInfo, agentError,
    // step
    step,
    // session
    session, identity,
    // passphrase
    passphrase, setPassphrase,
    showPass, setShowPass,
    passphraseErr,
    verifyMutation,
    // identity
    nameInput, setNameInput,
    gender, setGender,
    ageInput, setAgeInput,
    identityErr, setIdentityErr,
    handleIdentitySubmit,
    // chat
    messages, input, setInput,
    historyLoading,
    correcting, setCorrecting,
    correctionTxt, setCorrectionTxt,
    bottomRef,
    chatMutation, feedbackMutation,
    handleSend, handleKeyDown, handleReset,
    // neo mode
    neoMode, setNeoMode,
  }
}