"use client"
import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useChat }     from "@/hooks/useChat"
import { useAuthStore } from "@/store/auth"
import { useTranslation } from "@/locales"
import { ChatGate }    from "@/components/chat/ChatGate"
import { ChatMessages } from "@/components/chat/ChatMessages"
import { ChatInputBar } from "@/components/chat/ChatInputBar"
import "@/styles/chat.css"
import "@/styles/settings.css"

// ── Skeleton ──────────────────────────────────────────────────────────────

function ChatGateSkeleton() {
  return (
    <div className="c-root">
      <style>{`
        .c-sk {
          background-color: var(--imm-brown-dark);
          background-image: linear-gradient(90deg, transparent 25%, var(--imm-brown-dark) 50%, transparent 75%);
          background-size: 200% 100%;
          animation: c-shimmer 1.4s ease-in-out infinite;
          opacity: 0.18;
          border-radius: 6px;
          flex-shrink: 0;
        }
        @keyframes c-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header — eyebrow / title / subtitle */}
      <div className="c-header">
        <div className="c-header-left">
          <div className="c-sk" style={{ width: 48, height: 10, marginBottom: 14 }} />
          <div className="c-sk" style={{ width: 80, height: 28, marginBottom: 10 }} />
          <div className="c-sk" style={{ width: 200, height: 13 }} />
        </div>
      </div>

      {/* Gate card */}
      <div className="c-identity-wrap">
        <div className="c-gate-card">

          {/* Card label */}
          <div className="c-sk" style={{ width: 160, height: 13, marginBottom: 20 }} />

          {/* 5 type rows */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid var(--imm-bdr)",
              background: "var(--imm-sand2)",
              marginBottom: i < 5 ? 10 : 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="c-sk" style={{ width: 60, height: 13 }} />
                <div className="c-sk" style={{ width: 44, height: 11, opacity: 0.12 }} />
              </div>
              <div className="c-sk" style={{ width: 14, height: 14, borderRadius: 3 }} />
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const c = useChat()
  const { displayLanguage } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const lang = mounted ? displayLanguage : "en"
  const { t } = useTranslation(lang)

  // ── Loading ──────────────────────────────────────────────────────────
  if (!mounted || c.typesLoading || !c.typesData) return (
    <DashboardLayout>
      <ChatGateSkeleton />
    </DashboardLayout>
  )

  const header = (eyebrow: string, subtitle: string) => (
    <div className="c-header">
      <div className="c-header-left">
        <div className="c-eyebrow">{eyebrow}</div>
        <h1 className="c-title">{t("chat.eyebrow")}</h1>
        <p className="c-subtitle">{subtitle}</p>
      </div>
    </div>
  )

  // ── Gate steps ───────────────────────────────────────────────────────
  if (c.gateStep !== "ready") {
    const eyebrow = c.gateStep === "type"
      ? t("chat.eyebrow")
      : c.gateStep === "role" || c.gateStep === "stranger_info"
        ? `${t("chat.eyebrow")} · ${c.selectedType?.type_name}`
        : `${t("chat.eyebrow")} · ${c.selectedType?.type_name} · ${c.selectedRole?.name}`

    const subtitle = c.gateStep === "type"
      ? t("chat.gateWhoAreYou")
      : c.gateStep === "stranger_info"
        ? t("chat.gateAboutYourself")
        : c.gateStep === "role"
          ? t("chat.gateYourRole")
          : t("chat.gateAlmostThere")

    return (
      <DashboardLayout>
        <div className="c-root">
          {header(eyebrow, subtitle)}
          <ChatGate
            gateStep={c.gateStep}
            selectedType={c.selectedType}
            selectedRole={c.selectedRole}
            typesData={c.typesData}
            isPending={c.identifyMutation.isPending}
            nameInput={c.nameInput}           setNameInput={c.setNameInput}
            gender={c.gender}                 setGender={c.setGender}
            speakerAgeInput={c.speakerAgeInput} setSpeakerAgeInput={c.setSpeakerAgeInput}
            fieldErr={c.fieldErr}             setFieldErr={c.setFieldErr}
            onTypeSelect={c.handleTypeSelect}
            onRoleSelect={c.handleRoleSelect}
            onNameContinue={c.handleNameContinue}
            onStrangerContinue={c.handleStrangerContinue}
            onBackToType={() => {
              c.setSelectedType(null)
              c.setFieldErr(null)
              c.setGateStep("type")
            }}
            onBackToRole={() => {
              c.setSelectedRole(null)
              c.setFieldErr(null)
              c.setGateStep("role")
            }}
            t={t}
          />
        </div>
      </DashboardLayout>
    )
  }

  // ── Chat UI ──────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="c-root">
        <div className="c-header">
          <div className="c-header-left">
            <div className="c-eyebrow">{t("chat.eyebrow")}</div>
            <h1 className="c-title">{t("chat.eyebrow")}</h1>
            <p className="c-subtitle">{t("chat.startTalking")}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {c.speaker && (
              <div className="c-speaker-pill">
                <span className="c-speaker-name">{c.speaker.display_name}</span>
                <span className="c-speaker-rel">· {c.speaker.role_name_local || c.speaker.role_name}</span>
                {c.speaker.found_person && (
                  <span className="c-speaker-known" title="Known person — personal settings loaded">✓</span>
                )}
              </div>
            )}
            <button className="c-change-btn" onClick={c.handleReset}>{t("chat.change")}</button>
            <div className="c-agent-pill">
              <div className="c-agent-dot" /> {t("chat.listening")}
            </div>
          </div>
        </div>

        <ChatMessages
          messages={c.messages}
          correcting={c.correcting}
          correctionText={c.correctionText}
          setCorrecting={c.setCorrecting}
          setCorrectionText={c.setCorrectionText}
          isPending={c.chatMutation.isPending}
          feedbackPending={c.feedbackMutation.isPending}
          bottomRef={c.bottomRef}
          emptyTitle={t("chat.startTalking")}
          emptySubtitle={t("chat.startTalking")}
          memoriesLabel={t("chat.memoriesUsed")}
          thumbsUpLabel={t("chat.thumbsUp")}
          thumbsDownLabel={t("chat.thumbsDown")}
          correctionPlaceholder={t("chat.correctionPlaceholder")}
          submitCorrectionLabel={t("chat.submitCorrection")}
          cancelLabel={t("chat.cancel")}
          onLike={id => c.feedbackMutation.mutate({ response_id: id, feedback: "like" })}
          onCorrect={(id, text) => c.feedbackMutation.mutate({
            response_id: id, feedback: "corrected", correction_text: text,
          })}
        />

        <ChatInputBar
          input={c.input}
          setInput={c.setInput}
          isPending={c.chatMutation.isPending}
          placeholder={t("chat.inputPlaceholder")}
          hint={t("chat.inputHint")}
          onSend={c.handleSend}
          onKeyDown={c.handleKeyDown}
        />
      </div>
    </DashboardLayout>
  )
}