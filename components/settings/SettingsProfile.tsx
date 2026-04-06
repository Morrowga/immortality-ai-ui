"use client"
import { useRouter } from "next/navigation"

interface Props {
  user:  { name: string; email: string; language?: string } | null
  agent: { agent_name: string; total_memories: number } | null
  t:     (key: string) => string
}

export function SettingsProfile({ user, agent, t }: Props) {
  const router = useRouter()

  return (
    <div className="st-card">
      <div className="st-card-title">{t("settings.profileTitle")}</div>
      <div className="st-field-row">
        <span className="st-field-label">{t("settings.fieldName")}</span>
        <span className="st-field-value">{user?.name}</span>
      </div>
      <div className="st-field-row">
        <span className="st-field-label">{t("settings.fieldEmail")}</span>
        <span className="st-field-value">{user?.email}</span>
      </div>
      <div className="st-field-row">
        <span className="st-field-label">{t("settings.fieldLanguage")}</span>
        <span className="st-field-value st-field-badge">{user?.language || "en"}</span>
      </div>
      <div className="st-field-row">
        <span className="st-field-label">{t("settings.fieldAgent")}</span>
        <span className="st-field-value">{agent?.agent_name}</span>
      </div>

      {/* Agent Profile Settings button — replaces total memories row */}
      <div className="st-field-row" style={{ paddingTop: 16, justifyContent: "flex-end" }}>
        <button
          className="sp-btn"
          onClick={() => router.push("/settings/agent-profile")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          {t("settings.agentProfileBtn") || "Agent Profile Settings"}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}