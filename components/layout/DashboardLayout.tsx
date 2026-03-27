"use client"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/auth"
import { useQuery } from "@tanstack/react-query"
import { agentAPI } from "@/lib/api"
import { MessageSquare, BookOpen, LogOut, Home } from "lucide-react"
import { useTranslation } from "@/locales"
import "@/styles/layout.css"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, loadFromStorage, logout, displayLanguage, setDisplayLanguage } = useAuthStore()
  const { t } = useTranslation(displayLanguage)

  // Slang hidden for now
  const NAV = [
    { href: "/dashboard", label: t("nav.home"),  icon: Home },
    { href: "/train",     label: t("nav.train"), icon: BookOpen },
    { href: "/chat",      label: t("nav.chat"),  icon: MessageSquare },
  ]

  useEffect(() => { loadFromStorage() }, [])

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [user, isLoading])

  const { data: agentData } = useQuery({
    queryKey: ["agent"],
    queryFn: () => agentAPI.me().then(r => r.data),
    enabled: !!user,
  })

  useEffect(() => {
    if (user?.language) setDisplayLanguage(user.language)
  }, [user?.language])

  useEffect(() => {
    if (!agentData) return
    if (!agentData.survey_completed && pathname !== "/survey") {
      const timer = setTimeout(() => router.push("/survey"), 300)
      return () => clearTimeout(timer)
    }
  }, [agentData, pathname])

  if (isLoading || !user) return null

  return (
    <div className="layout-shell">

      {/* Sidebar */}
      <aside className="sidebar">

        {/* Brand */}
        <div className="sidebar-brand">
          <p className="sidebar-logo">
            imm<span>or</span>tality
          </p>
          <p className="sidebar-username">{user.name}</p>
          {agentData && (
            <p className="sidebar-memories">{agentData.total_memories} memories</p>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <Icon />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Language toggle */}
        {user?.language && user.language !== "en" && (
          <div className="sidebar-lang">
            <div className="sidebar-sep" />
            <p className="sidebar-lang-label">Language</p>
            <button
              onClick={() => setDisplayLanguage("en")}
              className={`lang-btn ${displayLanguage === "en" ? "active" : ""}`}
            >
              English
            </button>
            <button
              onClick={() => setDisplayLanguage(user.language)}
              className={`lang-btn ${displayLanguage === user.language ? "active" : ""}`}
            >
              {user.language === "my" ? "မြန်မာ" :
               user.language === "th" ? "ภาษาไทย" :
               user.language === "zh" ? "中文" :
               user.language === "ja" ? "日本語" :
               user.language === "ko" ? "한국어" :
               user.language === "ar" ? "العربية" :
               user.language.toUpperCase()}
            </button>
          </div>
        )}

        {/* Sign out */}
        <div className="sidebar-footer">
          <div className="sidebar-sep" />
          <button onClick={logout} className="signout-btn">
            <LogOut />
            {t("nav.signout")}
          </button>
        </div>

      </aside>

      {/* Divider */}
      <div className="layout-divider" />

      {/* Main */}
      <main className="layout-main">
        {children}
      </main>

    </div>
  )
}