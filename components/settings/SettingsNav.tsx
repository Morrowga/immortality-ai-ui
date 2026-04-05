import { useRouter } from "next/navigation"
import { Users, Mic, ChevronRight } from "lucide-react"

interface Props {
  t: (key: string) => string
}

export function SettingsNav({ t }: Props) {
  const router = useRouter()

  const items = [
    {
      icon:  <Users style={{ width: 16, height: 16 }} />,
      label: t("settings.navRelationships"),
      sub:   t("settings.navRelationshipsSub"),
      href:  "/settings/relationships",
      comingSoon: false,
    },
    {
      icon:  <Users style={{ width: 16, height: 16 }} />,
      label: t("settings.navNeoMode"),
      sub:   t("settings.navNeoModeSub"),
      href:  "/settings/neo-mode",
      comingSoon: false,
    },
    {
      icon:  <Mic style={{ width: 16, height: 16 }} />,
      label: t("settings.navVoice"),
      sub:   t("settings.navVoiceSub"),
      href:  "/settings/voice",
      comingSoon: true,
    },
  ]

  return (
    <div className="st-card">
      <div className="st-card-title">{t("settings.moreSettings")}</div>
      {items.map(item => (
        <button
          key={item.href}
          className={`st-nav-btn ${item.comingSoon ? "st-nav-btn--disabled" : ""}`}
          onClick={() => !item.comingSoon && router.push(item.href)}
          disabled={item.comingSoon}
        >
          <div className="st-nav-icon">{item.icon}</div>
          <div className="st-nav-text">
            <span className="st-nav-label">{item.label}</span>
            <span className="st-nav-sub">{item.sub}</span>
          </div>
          {item.comingSoon
            ? <span className="st-coming-soon">Coming Soon</span>
            : <ChevronRight className="st-nav-chevron" />
          }
        </button>
      ))}
    </div>
  )
}