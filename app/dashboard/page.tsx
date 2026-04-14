"use client"
import { useState, useEffect }   from "react"
import DashboardLayout            from "@/components/layout/DashboardLayout"
import { useQuery }               from "@tanstack/react-query"
import { trainingAPI, agentAPI, memoriesAPI } from "@/lib/api"
import { useAuthStore }           from "@/store/auth"
import { useTranslation }         from "@/locales"
import { DashboardStats }         from "@/components/dashboard/DashboardStats"
import { DashboardProgress }      from "@/components/dashboard/DashboardProgress"
import { DashboardAgentMeta } from "@/components/dashboard/DashboardActions"
import "@/styles/dashboard.css"
import { useOnboardingGuard } from "@/hooks/onBoardingLoader"
import { OnboardingLoader } from "@/components/dashboard/OnBoardingLoader"

function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  })

  return (
    <div className="d-root">
      <style>{`
        .d-sk {
          background-color: var(--imm-brown-dark);
          background-image: linear-gradient(90deg, transparent 25%, var(--imm-brown-dark) 50%, transparent 75%);
          background-size: 200% 100%;
          animation: d-shimmer 1.4s ease-in-out infinite;
          opacity: 0.18;
          border-radius: 6px;
          flex-shrink: 0;
        }
        @keyframes d-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Topbar ── */}
      <div className="d-topbar d-fu">
        <div>
          <div className="d-eyebrow">{today}</div>
          {/* greeting: large title line */}
          <div className="d-sk" style={{ width: 320, height: 36, marginTop: 10, marginBottom: 12 }} />
          {/* subtitle */}
          <div className="d-sk" style={{ width: 260, height: 14 }} />
        </div>
        {/* status pill */}
        <div className="d-status-pill" style={{ opacity: 0.4 }}>
          <div className="d-status-dot" />
          <div className="d-sk" style={{ width: 100, height: 12, opacity: 1 }} />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="d-stats d-fu">
        {[["40%", 180], ["55%", 140], ["45%", 120]].map(([labelW, valW], i) => (
          <div key={i} className="d-stat-card">
            <div className="d-sk" style={{ width: labelW as string, height: 11, marginBottom: 16 }} />
            <div className="d-sk" style={{ width: valW as number, height: 40, marginBottom: 10 }} />
            <div className="d-sk" style={{ width: "70%", height: 11 }} />
          </div>
        ))}
      </div>

      {/* ── Mid row ── */}
      <div className="d-mid d-fu">

        {/* Progress card */}
        <div className="d-progress-card d-fu">
          <div className="d-sk" style={{ width: 130, height: 11, marginBottom: 20 }} />
          {[100, 60, 80, 40].map((w, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div className="d-sk" style={{ width: `${w * 0.6}%`, height: 12 }} />
                <div className="d-sk" style={{ width: 60, height: 12 }} />
              </div>
              <div style={{
                height: 6, borderRadius: 99,
                background: "var(--imm-bdr)",
                overflow: "hidden",
              }}>
                <div className="d-sk" style={{
                  width: `${w * 0.4}%`, height: "100%",
                  borderRadius: 99, opacity: 0.25,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Right col */}
        <div className="d-right-col">

          {/* Agent meta card */}
          <div className="d-card d-fu">
            <div className="d-sk" style={{ width: 110, height: 10, marginBottom: 16 }} />
            {[["Name", 140], ["Last trained", 60], ["Core memories", 20], ["Conversations", 20]].map(([, valW], i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                paddingBlock: 10,
                borderTop: i === 0 ? "none" : "1px solid var(--imm-bdr)",
              }}>
                <div className="d-sk" style={{ width: 90, height: 11 }} />
                <div className="d-sk" style={{ width: valW as number, height: 11 }} />
              </div>
            ))}
          </div>

          {/* Patterns card */}
          <div className="d-card d-fu" style={{ marginTop: 12 }}>
            <div className="d-sk" style={{ width: 150, height: 10, marginBottom: 16 }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[80, 60, 100, 70, 55].map((w, i) => (
                <div key={i} className="d-sk" style={{ width: w, height: 24, borderRadius: 99 }} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Content ───────────────────────────────────────────────────────────────

function DashboardContent() {
  const [mounted, setMounted] = useState(false)
  const { user, displayLanguage } = useAuthStore()

  const lang = mounted ? displayLanguage : "en"
  const { t } = useTranslation(lang)

  useEffect(() => { setMounted(true) }, [])

  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn:  () => trainingAPI.progress().then(r => r.data),
    enabled:  !!user,
  })

  const { data: agent } = useQuery({
    queryKey: ["agent"],
    queryFn:  () => agentAPI.me().then(r => r.data),
    enabled:  !!user,
  })

  const { data: memStats } = useQuery({
    queryKey: ["memories", "stats"],
    queryFn:  () => memoriesAPI.stats().then(r => r.data),
    enabled:  !!user,
  })

  const { data: lifecycle } = useQuery({
    queryKey: ["lifecycle"],
    queryFn:  () => agentAPI.lifecycle().then(r => r.data),
    enabled:  !!user,
  })

  const totalMemories  = progress?.total_memories     ?? 0
  const accuracy       = progress?.estimated_accuracy ?? 40
  const wisdomScore    = (agent?.wisdom_score ?? 0).toFixed(1)
  const agentName      = agent?.agent_name            ?? "—"
  // const patternTags    = agent?.dominant_pattern_tags ?? []
  const neverForget    = memStats?.never_forget_count ?? 0
  const interactions   = lifecycle?.interaction_count ?? 0
  const lastTrainedAt  = lifecycle?.last_active_at    ?? null

  const firstName      = user?.name?.split(" ")[0]   ?? "friend"
  const days           = daysSince(lastTrainedAt)
  const needsAttention = days !== null && days >= 7

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  })

  if (!mounted) return <DashboardSkeleton />

  return (
    <div className="d-root">

      {/* ── Top bar ── */}
      <div className="d-topbar d-fu">
        <div>
          <div className="d-eyebrow">{today}</div>
          <h1 className="d-greeting-title py-2">
            {t("dashboard.greeting")}, <em>{firstName}</em>
          </h1>
          <p className="d-greeting-sub py-2">
            {totalMemories === 0
              ? t("dashboard.subtitle0")
              : days !== null && days >= 7
                ? t("dashboard.subtitle7days")
                : totalMemories < 5
                  ? t("dashboard.subtitle5")
                  : totalMemories < 20
                    ? t("dashboard.subtitle20")
                    : t("dashboard.subtitleDone")}
          </p>
        </div>
        <div className="d-status-pill">
          <div className="d-status-dot" />
          {t("dashboard.agentActive")}
        </div>
      </div>

      {/* ── Nudge ── */}
      {needsAttention && (
        <div className="d-nudge d-fu">
          <div className="d-nudge-dot" />
          <span>
            <strong>{t("dashboard.nudgeMessage").replace("{days}", String(days))}</strong>{" "}
            {t("dashboard.nudgeAction")}
          </span>
        </div>
      )}

      {/* ── Stat cards ── */}
      <DashboardStats
        totalMemories={totalMemories}
        accuracy={accuracy}
        wisdomScore={wisdomScore}
        interactions={interactions}
        t={t}
      />

      {/* ── Mid row ── */}
      <div className="d-mid d-fu">

        <DashboardProgress
          sections={progress?.sections}
          totalMemories={totalMemories}
          label={t("dashboard.trainingProgress")}
          t={t}
        />

        <div className="d-right-col">
          <DashboardAgentMeta
            lastTrainedAt={lastTrainedAt}
            neverForgetCount={neverForget}
            interactions={interactions}
            agentName={agentName}
            t={t}
          />
          {/* <DashboardPatterns tags={patternTags} t={t} /> */}
        </div>

      </div>

    </div>
  )
}

export default function DashboardPage() {
  const { checking } = useOnboardingGuard()

  if (checking) return <OnboardingLoader />

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  )
}