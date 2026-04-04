// ─────────────────────────────────────────────
// components/dashboard/index.tsx
// All dashboard sub-components in one file
// ─────────────────────────────────────────────

import Link from "next/link"
import { GraduationCap, MessageSquareText, ArrowRight } from "lucide-react"

// ── Helpers ────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatLastTrained(dateStr: string | null | undefined): string {
  const days = daysSince(dateStr)
  if (days === null) return "Never"
  if (days === 0)    return "Today"
  if (days === 1)    return "Yesterday"
  return `${days} days ago`
}

// ── Stat cards ─────────────────────────────────────────────────────────────

interface StatsProps {
  totalMemories: number
  accuracy:      number
  wisdomScore:   string
  interactions:  number
}

export function DashboardStats({
  totalMemories,
  accuracy,
  wisdomScore,
  // interactions,
}: StatsProps) {
  return (
    <div className="d-grid">

      <div className="d-stat-card">
        <div className="d-stat-label">Memories</div>
        <div className="d-stat-value">{totalMemories}</div>
        <div className="d-stat-hint">stored in agent memory</div>
      </div>

      <div className="d-stat-card">
        <div className="d-stat-label">Accuracy</div>
        <div className="d-stat-value">
          {accuracy}<span>%</span>
        </div>
        <div className="d-stat-hint">estimated response accuracy</div>
      </div>

      <div className="d-stat-card">
        <div className="d-stat-label">Wisdom</div>
        <div className="d-stat-value">{wisdomScore}</div>
        <div className="d-stat-hint">pattern abstraction score</div>
      </div>

    </div>
  )
}

// ── Agent meta — last trained, conversations, never forget ─────────────────

interface AgentMetaProps {
  lastTrainedAt:    string | null | undefined
  neverForgetCount: number
  interactions:     number
  agentName:        string
}

export function DashboardAgentMeta({
  lastTrainedAt,
  neverForgetCount,
  interactions,
  agentName,
}: AgentMetaProps) {
  const days = daysSince(lastTrainedAt)
  const needsAttention = days !== null && days >= 7

  return (
    <div className="d-info-card">
      <div className="d-info-card-label">Agent status</div>

      <div className="d-meta-list">
        <div className="d-meta-row">
          <span className="d-meta-key">Name</span>
          <span className="d-meta-val">{agentName}</span>
        </div>

        <div className="d-meta-sep" />

        <div className="d-meta-row">
          <span className="d-meta-key">Last trained</span>
          <span className={`d-meta-val ${needsAttention ? "warn" : ""}`}>
            {formatLastTrained(lastTrainedAt)}
          </span>
        </div>

        <div className="d-meta-sep" />

        <div className="d-meta-row">
          <span className="d-meta-key">Core memories</span>
          <span className="d-meta-val">{neverForgetCount}</span>
        </div>

        <div className="d-meta-sep" />

        <div className="d-meta-row">
          <span className="d-meta-key">Conversations</span>
          <span className="d-meta-val">{interactions}</span>
        </div>
      </div>
    </div>
  )
}

// ── Pattern tags — what the agent has learned about you ────────────────────

interface PatternsProps {
  tags: string[]
}

export function DashboardPatterns({ tags }: PatternsProps) {
  return (
    <div className="d-info-card">
      <div className="d-info-card-label">What your agent knows about you</div>

      {tags.length === 0 ? (
        <p className="d-pattern-empty">
          Patterns emerge after more training. Keep sharing your stories.
        </p>
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
}

export function DashboardActions({
  trainLabel,
  trainSubtitle,
  talkLabel,
  talkSubtitle,
}: ActionsProps) {
  return (
    <div className="d-info-card">
      <div className="d-info-card-label">Quick actions</div>
      <div className="d-actions">

        <Link href="/train" className="d-action-btn primary">
          <div className="d-action-icon">
            <GraduationCap />
          </div>
          <div className="d-action-text">
            <div className="d-action-title">{trainLabel}</div>
            <div className="d-action-sub">{trainSubtitle}</div>
          </div>
          <div className="d-action-arrow"><ArrowRight /></div>
        </Link>

        <Link href="/chat" className="d-action-btn">
          <div className="d-action-icon">
            <MessageSquareText />
          </div>
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