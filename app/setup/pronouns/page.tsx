/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { surveyAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { motion } from "framer-motion"
import { ArrowRight, Loader2, Check, Users, Languages, ShieldCheck, LogOut, Moon, Sun } from "lucide-react"
import { useTranslation } from "@/locales"
import "@/styles/survey.css"
import "@/styles/layout.css"

export default function PronounSetupPage() {
  const router      = useRouter()
  const { user, loadFromStorage, displayLanguage } = useAuthStore()
  const logout     = useAuthStore(s => s.logout)
  const darkMode   = useAuthStore(s => s.darkMode)
  const toggleDark = useAuthStore(s => s.toggleDarkMode)
  const { t } = useTranslation(displayLanguage ?? "en")
  const queryClient = useQueryClient()
  const [mounted, setMounted] = useState(false)
  const [done, setDone]       = useState(false)


  const CARDS = [
    { icon: Users,       title: t("survey.pronounCard1Title"), body: t("survey.pronounCard1Body") },
    { icon: Languages,   title: t("survey.pronounCard2Title"), body: t("survey.pronounCard2Body") },
    { icon: ShieldCheck, title: t("survey.pronounCard3Title"), body: t("survey.pronounCard3Body") },
  ]

  useEffect(() => { loadFromStorage(); setMounted(true) }, [])

  const { data: status, isLoading } = useQuery({
    queryKey: ["survey-status"],
    queryFn:  () => surveyAPI.me().then(r => r.data),
    enabled:  !!user,
  })

  useEffect(() => {
    if (!status) return
    if (!status.is_completed) router.push("/setup/survey")
    if (status.onboarding_step === "ready") router.push("/dashboard")
  }, [status])

  const advanceMutation = useMutation({
    mutationFn: () => surveyAPI.onboardingStep("ready"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-status"] })
      setDone(true)
      setTimeout(() => router.push("/dashboard"), 1200)
    },
  })

  if (!mounted || !user || isLoading) {
    return (
      <div className={`sv-fullpage dashboard${darkMode ? " dark-panel" : ""}`}>
        <div className="sv-fullpage-icon loading"><Loader2 className="animate-spin" /></div>
      </div>
    )
  }

  if (done) {
    return (
      <div className={`sv-fullpage dashboard${darkMode ? " dark-panel" : ""}`}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="sv-fullpage-icon success"
        >
          <Check />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="sv-fullpage-title">{t("survey.pronounDoneTitle")}</p>
          <p className="sv-fullpage-sub">{t("survey.pronounDoneSub")}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <main className={`dashboard${mounted && darkMode ? " dark-panel" : ""}`} style={s.page}>

      {/* Header */}
      <div className="sv-header">
        <div className="sv-header-left">
           <a href="/" className="sidebar-logo" suppressHydrationWarning>
              <img 
                src={darkMode ? "/logo/logo-light.png" : "/logo/logo-dark.png"}
                alt="Immortality"
                style={{ width: '120px', height: 'auto', marginBottom: 15 }}
              />
          </a>
          {/* <div className="sv-header-sep" />
          <span className="sv-header-label">{t("survey.pronounSetupLabel")}</span> */}
        </div>
        <div className="sv-header-right">
          <span className="sv-counter">{t("survey.pronounStepCounter")}</span>
          <div className="sv-header-sep" />
            {/* Dark / light toggle */}
            <motion.button
              className="sv-corner-btn"
              onClick={toggleDark}
              whileTap={{ scale: 0.92 }}
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode
                ? <Sun  style={{ width: 15, height: 15 }} />
                : <Moon style={{ width: 15, height: 15 }} />
              }
            </motion.button>
        
            {/* Logout */}
            <motion.button
              className="sv-corner-btn"
              onClick={logout}
              whileTap={{ scale: 0.92 }}
              title={t("nav.signout")}
            >
              <LogOut style={{ width: 15, height: 15 }} />
            </motion.button>
        </div>
      </div>

      {/* Progress */}
      <div className="sv-progress-track">
        <motion.div
          className="sv-progress-fill"
          initial={{ width: "50%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Scrollable body */}
      <div style={s.scroll}>
        <div style={s.inner}>

          {/* Title block */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <h1 style={s.heading}>{t("survey.pronounHeading")}</h1>
            <p style={s.sub}>{t("survey.pronounSub")}</p>
          </motion.div>

          {/* Concept cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={s.cardsWrap}
          >
            {CARDS.map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.07 }}
                  style={s.card}
                >
                  <div style={s.iconBox}>
                    <Icon style={{ width: 17, height: 17 }} />
                  </div>
                  <div>
                    <div style={s.cardTitle}>{card.title}</div>
                    <div style={s.cardBody}>{card.body}</div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38 }}
            style={s.note}
          >
            {t("survey.pronounNote")}
          </motion.div>

        </div>
      </div>

      {/* Action bar */}
      <div style={s.bar}>
        <div style={{ maxWidth: 560, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44 }}
            style={s.primaryBtn}
            onClick={() => router.push("/settings/relationships")}
            whileHover={{ opacity: 0.88 }}
            whileTap={{ scale: 0.98 }}
          >
            {t("survey.pronounSetupBtn")}
            <ArrowRight style={{ width: 16, height: 16 }} />
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              ...s.skipBtn,
              opacity: advanceMutation.isPending ? 0.5 : 1,
              cursor:  advanceMutation.isPending ? "not-allowed" : "pointer",
            }}
            onClick={() => advanceMutation.mutate()}
            disabled={advanceMutation.isPending}
          >
            {advanceMutation.isPending
              ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> {t("survey.pronounSkipSaving")}</>
              : t("survey.pronounSkipBtn")
            }
          </motion.button>

          <p style={s.hint}>{t("survey.pronounHint")}</p>
        </div>
      </div>

    </main>
  )
}

const s = {
  page: {
    height:        "100vh",
    maxHeight:     "100vh",
    display:       "flex" as const,
    flexDirection: "column" as const,
    background:    "var(--imm-sand)",
    fontFamily:    "'DM Sans', sans-serif",
    overflow:      "hidden",
  },
  scroll: {
    flex:       1,
    overflowY:  "auto" as const,
    padding:    "48px",
    boxSizing:  "border-box" as const,
  },
  inner: {
    maxWidth:      560,
    margin:        "0 auto",
    display:       "flex" as const,
    flexDirection: "column" as const,
    gap:           32,
  },
  heading: {
    fontFamily:    "'Lora', serif",
    fontSize:      28,
    fontWeight:    500,
    color:         "var(--imm-txt)",
    letterSpacing: "-0.02em",
    lineHeight:    1.3,
    margin:        0,
  },
  sub: {
    fontSize:   14,
    fontWeight: 300,
    color:      "var(--imm-txt3)",
    lineHeight: 1.65,
    margin:     0,
  },
  cardsWrap: {
    display:       "flex" as const,
    flexDirection: "column" as const,
    gap:           10,
  },
  card: {
    display:      "flex" as const,
    alignItems:   "flex-start" as const,
    gap:          14,
    background:   "var(--imm-sand2)",
    border:       "1px solid var(--imm-bdr)",
    borderRadius: 14,
    padding:      "16px 20px",
  },
  iconBox: {
    width:          36,
    height:         36,
    borderRadius:   10,
    background:     "var(--imm-gold-light)",
    border:         "1px solid rgba(201,146,74,0.2)",
    display:        "flex" as const,
    alignItems:     "center" as const,
    justifyContent: "center" as const,
    flexShrink:     0,
    color:          "var(--imm-gold)",
  },
  cardTitle: {
    fontSize:     13,
    fontWeight:   500,
    color:        "var(--imm-txt)",
    marginBottom: 5,
  },
  cardBody: {
    fontSize:   13,
    fontWeight: 300,
    color:      "var(--imm-txt3)",
    lineHeight: 1.65,
  },
  note: {
    background:   "var(--imm-sand2)",
    border:       "1px solid var(--imm-bdr)",
    borderRadius: 14,
    padding:      "16px 20px",
    fontSize:     13,
    fontWeight:   300,
    color:        "var(--imm-txt3)",
    lineHeight:   1.65,
  },
  bar: {
    flexShrink:    0,
    background:    "var(--imm-sand2)",
    borderTop:     "1px solid var(--imm-bdr)",
    padding:       "14px 48px 16px",
    display:       "flex" as const,
    flexDirection: "column" as const,
    gap:           10,
    boxSizing:     "border-box" as const,
  },
  primaryBtn: {
    display:        "flex" as const,
    alignItems:     "center" as const,
    justifyContent: "center" as const,
    gap:            8,
    width:          "100%",
    height:         50,
    borderRadius:   14,
    background:     "var(--imm-gold)",
    border:         "none",
    fontSize:       15,
    fontFamily:     "'DM Sans', sans-serif",
    fontWeight:     500,
    color:          "#fff",
    cursor:         "pointer",
  },
  skipBtn: {
    display:        "flex" as const,
    alignItems:     "center" as const,
    justifyContent: "center" as const,
    gap:            6,
    width:          "100%",
    height:         42,
    borderRadius:   12,
    background:     "none",
    border:         "1px solid var(--imm-bdr)",
    fontSize:       13,
    fontFamily:     "'DM Sans', sans-serif",
    fontWeight:     300,
    color:          "var(--imm-txt3)",
    cursor:         "pointer",
  },
  hint: {
    textAlign:  "center" as const,
    fontSize:   11,
    color:      "var(--imm-txt3)",
    fontWeight: 300,
    margin:     0,
  },
}