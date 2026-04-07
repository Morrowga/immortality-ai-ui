interface StatsProps {
  totalMemories: number
  accuracy:      number
  wisdomScore:   string
  interactions:  number
  t:             (key: string) => string
}

export function DashboardStats({
  totalMemories,
  accuracy,
  wisdomScore,
  t,
}: StatsProps) {
  return (
    <div className="d-stats d-fu">

      <div className="d-stat">
        <div className="d-stat-badge">{t("dashboard.statMemories")}</div>
        <div className="d-stat-num">{totalMemories}</div>
        <div className="d-stat-lbl">{t("dashboard.statMemoriesHint")}</div>
      </div>

      <div className="d-stat">
        <div className="d-stat-badge">{t("dashboard.statAccuracy")}</div>
        <div className="d-stat-num">{accuracy}<span>%</span></div>
        <div className="d-stat-lbl">{t("dashboard.statAccuracyHint")}</div>
      </div>

      <div className="d-stat">
        <div className="d-stat-badge">{t("dashboard.statWisdom")}</div>
        <div className="d-stat-num">{wisdomScore}</div>
        <div className="d-stat-lbl">{t("dashboard.statWisdomHint")}</div>
      </div>

    </div>
  )
}