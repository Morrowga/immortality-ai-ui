/* eslint-disable react/no-unescaped-entities */
"use client"
import { useState, useEffect } from "react"
import { Loader2, Sun, Moon } from "lucide-react"
import { usePublicChat } from "@/hooks/usePublicChat"
import { PublicChatPassphrase } from "@/components/public-chat/PublicChatPassphrase"
import { PublicChatIdentity }   from "@/components/public-chat/PublicChatIdentity"
import { PublicChatMessages }   from "@/components/public-chat/PublicChatMessages"
import { PublicChatInputBar }   from "@/components/public-chat/PublicChatInputBar"
import { AgentAvatar }          from "@/components/public-chat/AgentAvatar"
import "@/styles/public-chat.css"

function usePublicTheme() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("pub_theme")
    if (saved !== null) setDark(saved === "dark")
  }, [])

  const toggle = () => {
    setDark(prev => {
      const next = !prev
      localStorage.setItem("pub_theme", next ? "dark" : "light")
      return next
    })
  }

  return { dark, toggle }
}

export default function PublicChatPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const p = usePublicChat(slug)
  const { dark, toggle } = usePublicTheme()

  const themeClass = dark ? "dark-panel" : "dashboard"

  // ── Error ──────────────────────────────────────────────────────────────
  if (p.agentError) return (
    <div className={`pc-root ${themeClass}`}>
      <div className="pc-center">
        <div className="pc-card">
          <p className="pc-error-big">Agent not found</p>
          <p className="pc-hint">Check the link and try again.</p>
        </div>
      </div>
    </div>
  )

  // ── Loading ────────────────────────────────────────────────────────────
  if (!p.agentInfo) return (
    <div className={`pc-root ${themeClass}`}>
      <div className="pc-center">
        <Loader2 className="animate-spin pc-spinner" />
      </div>
    </div>
  )

  // ── Step 1: Passphrase ─────────────────────────────────────────────────
  if (p.step === "passphrase") return (
    <div className={`pc-root ${themeClass}`}>
      <PublicChatPassphrase
        agentInfo={p.agentInfo}
        passphrase={p.passphrase}
        setPassphrase={p.setPassphrase}
        showPass={p.showPass}
        setShowPass={p.setShowPass}
        passphraseErr={p.passphraseErr}
        isPending={p.verifyMutation.isPending}
        onSubmit={() => p.verifyMutation.mutate()}
      />
    </div>
  )

  // ── Step 2: Identity ───────────────────────────────────────────────────
  if (p.step === "identity" && p.session) return (
    <div className={`pc-root ${themeClass}`}>
      <PublicChatIdentity
        session={p.session}
        nameInput={p.nameInput}       setNameInput={p.setNameInput}
        gender={p.gender}             setGender={p.setGender}
        ageInput={p.ageInput}         setAgeInput={p.setAgeInput}
        identityErr={p.identityErr}   setIdentityErr={p.setIdentityErr}
        onSubmit={p.handleIdentitySubmit}
      />
    </div>
  )

  // ── Step 3: Chat ───────────────────────────────────────────────────────
  return (
    <div className={`pc-root pc-chat-root ${themeClass}`}>

      {/* Header */}
      <div className="pc-chat-header">
        <div className="pc-chat-header-left">
          <AgentAvatar slug={p.agentInfo.slug} name={p.agentInfo.agent_name} size={38} />
          <div>
            <div className="pc-eyebrow">Agent</div>
            <h1 className="pc-chat-title py-2"><em>{p.agentInfo.agent_name}</em></h1>
            <p className="pc-chat-sub">{p.agentInfo.owner_first_name}'s personal agent</p>
          </div>
        </div>
        <div className="pc-chat-header-right">
          {p.session && p.identity && (
            <div className="pc-speaker-pill">
              <span className="pc-speaker-name">{p.identity.name}</span>
              <span className="pc-speaker-rel">· {p.session.role_name_local || p.session.role_name}</span>
              <span className="pc-speaker-verified" title="Verified">✓</span>
            </div>
          )}
          <button className="pc-change-btn" onClick={p.handleReset}>Sign out</button>
          <button className="pc-theme-btn" onClick={toggle} title="Toggle theme">
            {dark ? <Sun /> : <Moon />}
          </button>
        </div>
      </div>

    {p.session && !p.session.can_chat ? (
      <div className="pc-blocked">
        <p>This agent is currently unavailable. Please try again later.</p>
      </div>
    ) : (
      <>
        <PublicChatMessages
          agentName={p.agentInfo.agent_name}
          agentInfo={p.agentInfo}
          messages={p.messages}
          correcting={p.correcting}
          correctionTxt={p.correctionTxt}
          isPending={p.chatMutation.isPending}
          feedbackPending={p.feedbackMutation.isPending}
          bottomRef={p.bottomRef}
          setCorrecting={p.setCorrecting}
          setCorrectionTxt={p.setCorrectionTxt}
          onLike={id => p.feedbackMutation.mutate({ response_id: id, feedback: "like" })}
          onCorrect={(id, text) => p.feedbackMutation.mutate({
            response_id: id, feedback: "corrected", correction_text: text,
          })}
        />

        <PublicChatInputBar
          input={p.input}
          setInput={p.setInput}
          isPending={p.chatMutation.isPending}
          onSend={p.handleSend}
          onKeyDown={p.handleKeyDown}
          neoMode={p.neoMode}
          setNeoMode={p.setNeoMode}
        />
      </>
    )}
    </div>
  )
}