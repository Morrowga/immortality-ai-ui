/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { useEffect, useState }       from "react"
import { useRouter, usePathname }    from "next/navigation"
import Link                          from "next/link"
import { useAuthStore }              from "@/store/auth"
import { useQuery }                  from "@tanstack/react-query"
import { agentAPI }                  from "@/lib/api"
import {
  MessageSquare, BookOpen, LogOut,
  Home, Settings, Brain, Sun, Moon,
} from "lucide-react"
import { useTranslation }            from "@/locales"
import SoulsWidget                   from "@/components/billing/SoulsWidget"
import SoulsDepletedDialog           from "@/components/billing/SoulsDepletedDialog"
import "@/styles/layout.css"

// ── Avatar initials helper ────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Language display map ──────────────────────────────────────────────────
const LANG_LABELS: Record<string, string> = {
  en:    "English",
  my:    "မြန်မာ",
  th:    "ภาษาไทย",
  ja:    "日本語",
  ko:    "한국어",
  ar:    "العربية",
  ru:    "Русский",
  vi:    "Tiếng Việt",
  spain: "Español",
  de:    "Deutsch",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const {
    user, isLoading, logout,
    displayLanguage, setDisplayLanguage,
    darkMode, toggleDarkMode,
  } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const lang    = mounted ? displayLanguage : "en"
  const { t }   = useTranslation(lang)

  const NAV = [
    { href: "/dashboard", label: t("nav.home"),     icon: Home },
    { href: "/train",     label: t("nav.train"),    icon: BookOpen },
    { href: "/chat",      label: t("nav.chat"),     icon: MessageSquare },
    { href: "/memories",  label: t("nav.memories"), icon: Brain },
    { href: "/settings",  label: t("nav.settings"), icon: Settings },
  ]

  // ── auth guard ──
  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [user, isLoading])

  // ── agent data ──
  const { data: agentData } = useQuery({
    queryKey:  ["agent"],
    queryFn:   () => agentAPI.me().then(r => r.data),
    enabled:   !!user,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })

  // ── language init ──
  useEffect(() => {
    if (!user?.language) return
    const saved = localStorage.getItem("imm_display_lang")
    setDisplayLanguage(saved ?? user.language)
  }, [user?.language])

  // ── survey guard ──
  useEffect(() => {
    if (!agentData) return
    if (!agentData.survey_completed && pathname !== "/setup/survey") {
      const timer = setTimeout(() => router.push("/setup/survey"), 300)
      return () => clearTimeout(timer)
    }
  }, [agentData, pathname])

  const initials = user?.name ? getInitials(user.name) : "??"
  const showLang = mounted && user?.language && user.language !== "en"

  return (
    <div
      className={`layout-shell dashboard${darkMode ? " dark-panel" : ""}`}
      suppressHydrationWarning
    >
      {/* ══════════════════════════════════
          SIDEBAR
          ══════════════════════════════════ */}
      <aside className="sidebar" suppressHydrationWarning>

        {/* ── Brand / user identity ── */}
        <div className="sidebar-brand" suppressHydrationWarning>
          <a href="/" className="sidebar-logo" suppressHydrationWarning>
              <img 
                src={darkMode ? "/logo/logo-light.png" : "/logo/logo-dark.png"}
                alt="Immortality"
                style={{ width: '120px', height: 'auto', marginBottom: 15 }}
              />
          </a>

          <div className="sidebar-identity" suppressHydrationWarning>
            <div className="sidebar-avatar" suppressHydrationWarning>
              {initials}
            </div>
            <div suppressHydrationWarning>
              <p className="sidebar-username" suppressHydrationWarning>
                {user?.name ?? ""}
              </p>
              <p className="sidebar-memories" suppressHydrationWarning>
                {agentData
                  ? `${agentData.total_memories} ${t("dashboard.memories")}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="sidebar-nav" suppressHydrationWarning>
          {NAV.map(item => {
            const Icon   = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${active ? " active" : ""}`}
                suppressHydrationWarning
              >
                <Icon />
                <span suppressHydrationWarning>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ── Souls balance ── */}
        {mounted && user && (
          <div className="sidebar-souls" suppressHydrationWarning>
            {/* <div className="sidebar-sep" /> */}
          <SoulsWidget />
          </div>
        )}

        {/* ── Language toggle ── */}
        {showLang && (
          <div className="sidebar-lang" suppressHydrationWarning>
            <div className="sidebar-sep" />
            <span className="sidebar-lang-label" suppressHydrationWarning>
              {t("nav.language")}
            </span>

            <button
              onClick={() => {
                setDisplayLanguage("en")
                localStorage.setItem("imm_display_lang", "en")
              }}
              className={`lang-btn${displayLanguage === "en" ? " active" : ""}`}
            >
              {LANG_LABELS["en"]}
            </button>

            <button
              onClick={() => {
                setDisplayLanguage(user!.language)
                localStorage.setItem("imm_display_lang", user!.language)
              }}
              className={`lang-btn${displayLanguage === user!.language ? " active" : ""}`}
            >
              {LANG_LABELS[user!.language] ?? user!.language.toUpperCase()}
            </button>
          </div>
        )}

        {/* ── Theme toggle ── */}
        <div className="sidebar-theme" suppressHydrationWarning>
          <div className="sidebar-sep" />
          <button
            className="theme-toggle-btn"
            onClick={toggleDarkMode}
            suppressHydrationWarning
          >
            {darkMode
              ? <><Sun  size={14} /><span suppressHydrationWarning>Light mode</span></>
              : <><Moon size={14} /><span suppressHydrationWarning>Dark mode</span></>
            }
          </button>
        </div>

        {/* ── Sign out ── */}
        <div className="sidebar-footer">
          <div className="sidebar-sep" />
          <button
            onClick={logout}
            className="signout-btn"
            suppressHydrationWarning
          >
            <LogOut size={14} />
            <span suppressHydrationWarning>{t("nav.signout")}</span>
          </button>
        </div>

      </aside>

      <div className="layout-divider" />

      <main className="layout-main">
        {children}
      </main>

      <SoulsDepletedDialog />
    </div>
  )
}