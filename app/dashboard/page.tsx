"use client"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useQuery } from "@tanstack/react-query"
import { trainingAPI, agentAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import Link from "next/link"
import { useTranslation } from "@/locales"
import { Brain, GraduationCap, MessageSquareText, UsersRound, ArrowRight } from "lucide-react"
import "@/styles/dashboard.css"

const SECTION_NAMES: Record<string, string> = {
  BASIC: "Who I am",
  PAST: "My past",
  PRESENT: "My present life",
  FUTURE: "My hopes & future",
}

export default function DashboardPage() {
  const { user, displayLanguage } = useAuthStore()
  const { t } = useTranslation(displayLanguage)

  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: () => trainingAPI.progress().then(r => r.data),
    enabled: !!user,
  })

  const { data: agent } = useQuery({
    queryKey: ["agent"],
    queryFn: () => agentAPI.me().then(r => r.data),
    enabled: !!user,
  })

  const sections = progress?.sections
    ? Object.entries(progress.sections).map(([key, val]) => ({
        name: SECTION_NAMES[key] ?? key,
        count: val as number,
      }))
    : []

  const totalMemories = progress?.total_memories ?? 0
  const accuracy     = progress?.estimated_accuracy ?? 40
  const wisdomScore  = agent?.wisdom_score?.toFixed(1) ?? "0.0"
  const firstName    = user?.name?.split(" ")[0] ?? "friend"

  const getSubtitle = () => {
    if (totalMemories === 0) return "Your agent is ready to learn. Share your first memory whenever you feel ready."
    if (totalMemories < 5)  return "Your agent is just beginning to know you. Keep sharing your stories."
    if (totalMemories < 20) return "Your agent is growing. Every memory makes it more like you."
    return "Your agent knows you well. Keep sharing — every story matters."
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  })

  return (
    <DashboardLayout>
      <div className="d-root">

        {/* ── Top bar ── */}
        <div className="d-topbar d-fu">
          <div>
            <div className="d-eyebrow">{today}</div>
            <h1 className="d-greeting-title">
              {t("dashboard.greeting")}, <em>{firstName}</em>
            </h1>
            <p className="d-greeting-sub">{getSubtitle()}</p>
          </div>
          <div className="d-status-pill">
            <div className="d-status-dot" />
            Agent is active
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="d-stats d-fu">
          <div className="d-stat">
            <div className="d-stat-orb" style={{ background: "radial-gradient(circle, rgba(212,232,242,0.55) 0%, transparent 70%)" }} />
            <div className="d-stat-badge">Memories</div>
            <div className="d-stat-num">{totalMemories}</div>
            <div className="d-stat-lbl">total memories stored</div>
          </div>
          <div className="d-stat">
            <div className="d-stat-orb" style={{ background: "radial-gradient(circle, rgba(212,235,221,0.55) 0%, transparent 70%)" }} />
            <div className="d-stat-badge">Accuracy</div>
            <div className="d-stat-num">{accuracy}%</div>
            <div className="d-stat-lbl">estimated response accuracy</div>
          </div>
          <div className="d-stat">
            <div className="d-stat-orb" style={{ background: "radial-gradient(circle, rgba(242,216,216,0.55) 0%, transparent 70%)" }} />
            <div className="d-stat-badge">Wisdom</div>
            <div className="d-stat-num">{wisdomScore}</div>
            <div className="d-stat-lbl">wisdom score</div>
          </div>
        </div>

        {/* ── Middle row ── */}
        <div className="d-mid d-fu">

          {/* Progress card */}
          <div className="d-progress-card">
            <div className="d-card-label">{t("dashboard.trainingProgress")}</div>
            {totalMemories === 0 ? (
              <p className="d-empty-msg">No memories yet. Start training to see your progress here.</p>
            ) : (
              <div className="d-prog-list">
                {sections.map(section => (
                  <div key={section.name}>
                    <div className="d-prog-header">
                      <span className="d-prog-name">{section.name}</span>
                      <span className="d-prog-ct">{section.count} memories</span>
                    </div>
                    <div className="d-track">
                      <div className="d-fill" style={{ width: `${Math.min(section.count * 10, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="d-right-col">

            <Link href="/train" className="d-action">
              <div className="d-action-icon" style={{ background: "linear-gradient(135deg,#FBE8C8,#F0D4A8)" }}>
                <GraduationCap color="#8B6F5E" />
              </div>
              <div>
                <div className="d-action-title">{t("dashboard.trainAgent")}</div>
                <div className="d-action-sub">{t("dashboard.trainSubtitle")}</div>
              </div>
              <div className="d-action-arrow"><ArrowRight /></div>
            </Link>

            <Link href="/chat" className="d-action">
              <div className="d-action-icon" style={{ background: "linear-gradient(135deg,#D4E8F2,#B8D8EA)" }}>
                <MessageSquareText color="#5A8FA8" />
              </div>
              <div>
                <div className="d-action-title">{t("dashboard.talkAgent")}</div>
                <div className="d-action-sub">{t("dashboard.talkSubtitle")}</div>
              </div>
              <div className="d-action-arrow"><ArrowRight /></div>
            </Link>

            <Link href="/memories" className="d-mini">
              <div className="d-mini-icon"><Brain /></div>
              <div>
                <div className="d-mini-label">My memories</div>
                <div className="d-mini-hint">Browse what you've shared</div>
              </div>
            </Link>

            <Link href="/access" className="d-mini">
              <div className="d-mini-icon"><UsersRound /></div>
              <div>
                <div className="d-mini-label">Family access</div>
                <div className="d-mini-hint">Who can talk to your agent</div>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}