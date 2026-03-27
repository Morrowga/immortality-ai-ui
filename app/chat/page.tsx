"use client"
import { useState, useRef, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useMutation } from "@tanstack/react-query"
import { chatAPI, feedbackAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useTranslation } from "@/locales"
import { toast } from "sonner"
import { ChatMessage } from "@/types"
import { Send, ThumbsUp, ThumbsDown, Loader2, X, Check, MessageSquareText, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import "@/styles/chat.css"

// Must match backend RELATIONSHIP_TYPES keys
const RELATIONSHIPS = [
  {
    key: "owner",
    label: "This is me",
    sub: "I am the person this agent was built from",
    icon: "✦",
  },
  {
    key: "close_friend",
    label: "Close friend",
    sub: "We trust each other deeply",
    icon: "★",
  },
  {
    key: "partner",
    label: "Partner",
    sub: "Romantic partner",
    icon: "♥",
  },
  {
    key: "family",
    label: "Family",
    sub: "Family member",
    icon: "⌂",
  },
  {
    key: "friend",
    label: "Friend",
    sub: "Friend, not super close",
    icon: "◎",
  },
  {
    key: "coworker",
    label: "Coworker",
    sub: "Work colleague",
    icon: "◈",
  },
  {
    key: "stranger",
    label: "Stranger",
    sub: "Just met or don't know well",
    icon: "○",
  },
]

interface Speaker {
  name: string
  relationship: string
}

export default function ChatPage() {
  const { user } = useAuthStore()
  const { t } = useTranslation(user?.language || "en")

  // Identity gate state
  const [speaker, setSpeaker] = useState<Speaker | null>(null)
  const [nameInput, setNameInput] = useState("")
  const [selectedRel, setSelectedRel] = useState("")

  // Chat state
  const [messages, setMessages]             = useState<ChatMessage[]>([])
  const [input, setInput]                   = useState("")
  const [correcting, setCorrecting]         = useState<string | null>(null)
  const [correctionText, setCorrectionText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const chatMutation = useMutation({
    mutationFn: chatAPI.send,
    onSuccess: (res) => {
      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: res.data.response,
        memories_used: res.data.memories_used,
        response_id: res.data.response_id,
        timestamp: new Date(),
      }
      setMessages(m => [...m, agentMessage])
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to get response")
    },
  })

  const feedbackMutation = useMutation({
    mutationFn: feedbackAPI.submit,
    onSuccess: (_, vars) => {
      if (vars.feedback === "like") toast.success("👍 Noted")
      if (vars.feedback === "corrected") {
        toast.success("Correction saved. Agent will learn from this.")
        setCorrecting(null)
        setCorrectionText("")
      }
    },
    onError: () => toast.error("Failed to save feedback"),
  })

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending || !speaker) return
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }
    setMessages(m => [...m, userMessage])
    chatMutation.mutate({
      message: input,
      language: user?.language || "en",
      speaker_name: speaker.name,
      relationship: speaker.relationship,
    })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleLike = (responseId: string) => {
    feedbackMutation.mutate({ response_id: responseId, feedback: "like" })
  }

  const handleDislike = (responseId: string) => {
    setCorrecting(responseId)
  }

  const handleSubmitCorrection = (responseId: string) => {
    if (!correctionText.trim()) return
    feedbackMutation.mutate({
      response_id: responseId,
      feedback: "corrected",
      correction_text: correctionText,
    })
  }

  const handleStartChat = () => {
    const name = nameInput.trim()
    if (!name || !selectedRel) return
    setSpeaker({ name, relationship: selectedRel })
  }

  const selectedRelInfo = RELATIONSHIPS.find(r => r.key === selectedRel)

  // ── Identity gate ─────────────────────────────────────────────────────────
  if (!speaker) {
    return (
      <DashboardLayout>
        <div className="c-root">
          <div className="c-header">
            <div className="c-header-left">
              <div className="c-eyebrow">Agent</div>
              <h1 className="c-title"><em>{t("chat.title")}</em></h1>
              <p className="c-subtitle">Before we begin — who are you?</p>
            </div>
          </div>

          <div className="c-identity-wrap">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="c-identity-card"
            >
              {/* Name input */}
              <div className="c-id-section">
                <div className="c-id-label">Your name</div>
                <input
                  className="c-id-input"
                  type="text"
                  placeholder="Enter your name…"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && selectedRel) handleStartChat() }}
                  autoFocus
                />
              </div>

              {/* Relationship selector */}
              <div className="c-id-section">
                <div className="c-id-label">Your relationship to this person</div>
                <div className="c-rel-grid">
                  {RELATIONSHIPS.map(rel => (
                    <button
                      key={rel.key}
                      className={`c-rel-btn ${selectedRel === rel.key ? "selected" : ""}`}
                      onClick={() => setSelectedRel(rel.key)}
                    >
                      <span className="c-rel-icon">{rel.icon}</span>
                      <div>
                        <div className="c-rel-label">{rel.label}</div>
                        <div className="c-rel-sub">{rel.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <button
                className="c-id-start"
                onClick={handleStartChat}
                disabled={!nameInput.trim() || !selectedRel}
              >
                Start conversation
                <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ── Chat UI ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="c-root">

        {/* Header */}
        <div className="c-header">
          <div className="c-header-left">
            <div className="c-eyebrow">Agent</div>
            <h1 className="c-title"><em>{t("chat.title")}</em></h1>
            <p className="c-subtitle">{t("chat.subtitle")}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Speaker pill */}
            <div className="c-speaker-pill">
              <span className="c-speaker-icon">{selectedRelInfo?.icon}</span>
              <span>{speaker.name}</span>
              <span className="c-speaker-rel">· {selectedRelInfo?.label}</span>
            </div>
            {/* Change identity */}
            <button className="c-change-btn" onClick={() => {
              setSpeaker(null)
              setMessages([])
              setNameInput("")
              setSelectedRel("")
            }}>
              Change
            </button>
            <div className="c-agent-pill">
              <div className="c-agent-dot" />
              Listening
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="c-messages">
          {messages.length === 0 && (
            <div className="c-empty">
              <div className="c-empty-icon">
                <MessageSquareText />
              </div>
              <div>
                <p className="c-empty-title">Start talking</p>
                <p className="c-empty-sub">{t("chat.subtitle")}</p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`c-msg-row ${msg.role}`}
              >
                <div className={`c-bubble ${msg.role}`}>{msg.content}</div>

                {msg.role === "agent" && (
                  <div className="c-meta">
                    {msg.memories_used !== undefined && (
                      <p className="c-memories-used">
                        {msg.memories_used} {t("chat.memoriesUsed")}
                      </p>
                    )}
                    {msg.response_id && correcting !== msg.response_id && (
                      <div className="c-feedback">
                        <button className="c-fb-btn like" onClick={() => handleLike(msg.response_id!)}>
                          <ThumbsUp /> {t("chat.thumbsUp")}
                        </button>
                        <button className="c-fb-btn dislike" onClick={() => handleDislike(msg.response_id!)}>
                          <ThumbsDown /> {t("chat.thumbsDown")}
                        </button>
                      </div>
                    )}
                    {correcting === msg.response_id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="c-correction"
                      >
                        <textarea
                          autoFocus
                          className="c-correction-textarea"
                          value={correctionText}
                          onChange={e => setCorrectionText(e.target.value)}
                          placeholder={t("chat.correctionPlaceholder")}
                          rows={2}
                        />
                        <div className="c-correction-actions">
                          <button
                            className="c-correction-submit"
                            onClick={() => handleSubmitCorrection(msg.response_id!)}
                            disabled={!correctionText.trim() || feedbackMutation.isPending}
                          >
                            <Check /> {t("chat.submitCorrection")}
                          </button>
                          <button
                            className="c-correction-cancel"
                            onClick={() => { setCorrecting(null); setCorrectionText("") }}
                          >
                            <X /> {t("chat.cancel")}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {chatMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="c-typing">
              <div className="c-typing-bubble">
                <div className="c-typing-dot" />
                <div className="c-typing-dot" />
                <div className="c-typing-dot" />
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="c-input-bar">
          <div className="c-input-row">
            <textarea
              className="c-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder")}
              rows={1}
            />
            <button
              className="c-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
            >
              {chatMutation.isPending
                ? <Loader2 style={{ width: 18, height: 18, color: "#fff" }} className="animate-spin" />
                : <Send />
              }
            </button>
          </div>
          <p className="c-input-hint">Enter to send · Shift+Enter for new line</p>
        </div>

      </div>
    </DashboardLayout>
  )
}