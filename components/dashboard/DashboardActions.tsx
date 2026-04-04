import Link from "next/link"
import { GraduationCap, MessageSquareText, ArrowRight } from "lucide-react"

// ── Helpers ────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function formatLastTrained(dateStr: string | null | undefined, t: (key: string) => string): string {
  const days = daysSince(dateStr)
  if (days === null) return t("dashboard.metaNever")
  if (days === 0)    return t("dashboard.metaToday")
  if (days === 1)    return t("dashboard.metaYesterday")
  return t("dashboard.metaDaysAgo").replace("{days}", String(days))
}

// ── Agent meta ─────────────────────────────────────────────────────────────

interface AgentMetaProps {
  lastTrainedAt:    string | null | undefined
  neverForgetCount: number
  interactions:     number
  agentName:        string
  t:                (key: string) => string
}

export function DashboardAgentMeta({
  lastTrainedAt,
  neverForgetCount,
  interactions,
  agentName,
  t,
}: AgentMetaProps) {
  const days           = daysSince(lastTrainedAt)
  const needsAttention = days !== null && days >= 7

  return (
    <div className="d-info-card">
      <div className="d-info-card-label">{t("dashboard.agentStatus")}</div>

      <div className="d-meta-list">
        <div className="d-meta-row">
          <span className="d-meta-key">{t("dashboard.metaName")}</span>
          <span className="d-meta-val">{agentName}</span>
        </div>
        <div className="d-meta-sep" />
        <div className="d-meta-row">
          <span className="d-meta-key">{t("dashboard.metaLastTrained")}</span>
          <span className={`d-meta-val ${needsAttention ? "warn" : ""}`}>
            {formatLastTrained(lastTrainedAt, t)}
          </span>
        </div>
        <div className="d-meta-sep" />
        <div className="d-meta-row">
          <span className="d-meta-key">{t("dashboard.metaCoreMemories")}</span>
          <span className="d-meta-val">{neverForgetCount}</span>
        </div>
        <div className="d-meta-sep" />
        <div className="d-meta-row">
          <span className="d-meta-key">{t("dashboard.metaConversations")}</span>
          <span className="d-meta-val">{interactions}</span>
        </div>
      </div>
    </div>
  )
}

// ── Pattern tags ───────────────────────────────────────────────────────────

interface PatternsProps {
  tags: string[]
  t:    (key: string) => string
}

export function DashboardPatterns({ tags, t }: PatternsProps) {
  return (
    <div className="d-info-card">
      <div className="d-info-card-label">{t("dashboard.patternsLabel")}</div>

      {tags.length === 0 ? (
        <p className="d-pattern-empty">{t("dashboard.patternsEmpty")}</p>
      ) : (
        <div className="d-patterns">
          {tags.map(tag => (
            <span key={tag} className="d-pattern-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Quick actions ──────────────────────────────────────────────────────────

interface ActionsProps {
  trainLabel:    string
  trainSubtitle: string
  talkLabel:     string
  talkSubtitle:  string
  t:             (key: string) => string
}

export function DashboardActions({
  trainLabel,
  trainSubtitle,
  talkLabel,
  talkSubtitle,
  t,
}: ActionsProps) {
  return (
    <div className="d-info-card">
      <div className="d-info-card-label">{t("dashboard.quickActions")}</div>
      <div className="d-actions">

        <Link href="/train" className="d-action-btn primary">
          <div className="d-action-icon"><GraduationCap /></div>
          <div className="d-action-text">
            <div className="d-action-title">{trainLabel}</div>
            <div className="d-action-sub">{trainSubtitle}</div>
          </div>
          <div className="d-action-arrow"><ArrowRight /></div>
        </Link>

        <Link href="/chat" className="d-action-btn">
          <div className="d-action-icon"><MessageSquareText /></div>
          <div className="d-action-text">
            <div className="d-action-title">{talkLabel}</div>
            <div className="d-action-sub">{talkSubtitle}</div>
          </div>
          <div className="d-action-arrow"><ArrowRight /></div>
        </Link>

      </div>
    </div>
  )
}