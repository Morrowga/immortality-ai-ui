/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/auth"
import { useQuery } from "@tanstack/react-query"
import { agentAPI } from "@/lib/api"
import { MessageSquare, BookOpen, LogOut, Home, Settings, Brain, Sun, Moon } from "lucide-react"
import { useTranslation } from "@/locales"
import SoulsWidget from "@/components/billing/SoulsWidget"
import "@/styles/layout.css"
import SoulsDepletedDialog from "@/components/billing/SoulsDepletedDialog"

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
  const lang = mounted ? displayLanguage : "en"
  const { t } = useTranslation(lang)

  const NAV = [
    { href: "/dashboard", label: t("nav.home"),      icon: Home },
    { href: "/train",     label: t("nav.train"),     icon: BookOpen },
    { href: "/chat",      label: t("nav.chat"),      icon: MessageSquare },
    { href: "/settings",  label: t("nav.settings"),  icon: Settings },
    { href: "/memories",  label: t("nav.memories"),  icon: Brain },
  ]

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [user, isLoading])

  const { data: agentData } = useQuery({
    queryKey: ["agent"],
    queryFn:  () => agentAPI.me().then(r => r.data),
    enabled:  !!user,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 10,
  })

  useEffect(() => {
    if (!user?.language) return
    const saved = localStorage.getItem("imm_display_lang")
    if (saved) {
      setDisplayLanguage(saved)
    } else {
      setDisplayLanguage(user.language)
    }
  }, [user?.language])

  useEffect(() => {
    if (!agentData) return
    if (!agentData.survey_completed && pathname !== "/setup/survey") {
      const timer = setTimeout(() => router.push("/setup/survey"), 300)
      return () => clearTimeout(timer)
    }
  }, [agentData, pathname])

  return (
    <div
      className={`layout-shell dashboard${darkMode ? " dark-panel" : ""}`}
      suppressHydrationWarning
    >
      <aside className="sidebar" suppressHydrationWarning>

        <div className="sidebar-brand" suppressHydrationWarning>
          <p className="sidebar-username" suppressHydrationWarning>
            {user?.name ?? ""}
          </p>
          <p className="sidebar-memories" suppressHydrationWarning>
            {agentData ? `${agentData.total_memories} ${t("dashboard.memories")}` : ""}
          </p>
        </div>

        <nav className="sidebar-nav" suppressHydrationWarning>
          {NAV.map(item => {
            const Icon   = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? "active" : ""}`}
                suppressHydrationWarning
              >
                <Icon />
                <span suppressHydrationWarning>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ── Souls balance widget ── */}
        {mounted && user && (
          <div className="sidebar-souls" suppressHydrationWarning>
            <div className="sidebar-sep" />
            <SoulsWidget />
          </div>
        )}

        <div className="sidebar-lang" suppressHydrationWarning>
          {mounted && user?.language && user.language !== "en" && (
            <>
              <div className="sidebar-sep" />
              <p className="sidebar-lang-label" suppressHydrationWarning>{t("nav.language")}</p>
              <button
                onClick={() => {
                  setDisplayLanguage("en")
                  localStorage.setItem("imm_display_lang", "en")
                }}
                className={`lang-btn ${displayLanguage === "en" ? "active" : ""}`}
              >
                English
              </button>
              <button
                onClick={() => {
                  setDisplayLanguage(user.language)
                  localStorage.setItem("imm_display_lang", user.language)
                }}
                className={`lang-btn ${displayLanguage === user.language ? "active" : ""}`}
              >
                {user.language === "my" ? "မြန်မာ" :
                user.language === "th" ? "ภาษาไทย" :
                user.language === "ja" ? "日本語" :
                user.language === "ko" ? "한국어" :
                user.language === "ar" ? "العربية" :
                user.language === "ru" ? "Русский" :
                user.language === "vi" ? "Tiếng Việt" :
                user.language === "spain" ? "Español" :
                user.language === "de" ? "Deutsch" :
                user.language.toUpperCase()}
              </button>
            </>
          )}
        </div>

        <div className="sidebar-theme" suppressHydrationWarning>
          <div className="sidebar-sep" />
          <button className="theme-toggle-btn" onClick={toggleDarkMode} suppressHydrationWarning>
            {darkMode
              ? <><Sun /><span suppressHydrationWarning>Light</span></>
              : <><Moon /><span suppressHydrationWarning>Dark</span></>
            }
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-sep" />
          <button onClick={logout} className="signout-btn" suppressHydrationWarning>
            <LogOut />
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