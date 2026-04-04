const SECTION_KEYS: Record<string, string> = {
  BASIC:   "dashboard.sectionBasic",
  PAST:    "dashboard.sectionPast",
  PRESENT: "dashboard.sectionPresent",
  FUTURE:  "dashboard.sectionFuture",
}

interface Props {
  sections:      Record<string, number> | undefined
  totalMemories: number
  label:         string
  t:             (key: string) => string
}

export function DashboardProgress({ sections, totalMemories, label, t }: Props) {
  const items = sections
    ? Object.entries(sections).map(([key, val]) => ({
        name:  t(SECTION_KEYS[key] ?? key),
        count: val as number,
      }))
    : []

  return (
    <div className="d-progress-card d-fu">
      <div className="d-card-label">{label}</div>
      {totalMemories === 0 ? (
        <p className="d-empty-msg">{t("dashboard.progressEmpty")}</p>
      ) : (
        <div className="d-prog-list">
          {items.map(section => (
            <div key={section.name}>
              <div className="d-prog-header">
                <span className="d-prog-name">{section.name}</span>
                <span className="d-prog-ct">
                  {t("dashboard.memoriesCount").replace("{count}", String(section.count))}
                </span>
              </div>
              <div className="d-track">
                <div
                  className="d-fill"
                  style={{ width: `${Math.min(section.count * 10, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}