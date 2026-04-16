/* eslint-disable @next/next/no-img-element */
"use client"
import { motion, AnimatePresence } from "framer-motion"
import type { Variants } from "framer-motion"
import { Check, Loader2, LogOut, Moon, Sun } from "lucide-react"
import { useSurveyWizard } from "@/hooks/useSurveyWizard"
import { SurveyProgressDots } from "@/components/survey/SurveyProgressDots"
import { SurveyStepInput }    from "@/components/survey/SurveyStepInput"
import { SurveyNavBar }       from "@/components/survey/SurveyNavBar"
import { useTranslation }     from "@/locales"
import { useAuthStore }       from "@/store/auth"
import "@/styles/survey.css"
import "@/styles/layout.css"

const slideVariants: Variants = {
enter: (dir: number) => ({
  x: dir > 0 ? 60 : -60, opacity: 0, scale: 0.97,
}),
center: {
  x: 0, opacity: 1, scale: 1,
  transition: {
    x:       { type: "spring" as const, stiffness: 340, damping: 32 },
    opacity: { duration: 0.22 },
    scale:   { duration: 0.22 },
  },
},
exit: (dir: number) => ({
  x: dir > 0 ? -60 : 60, opacity: 0, scale: 0.97,
  transition: {
    x:       { type: "spring" as const, stiffness: 340, damping: 32 },
    opacity: { duration: 0.16 },
  },
}),
}

export default function SurveyPage() {
const w = useSurveyWizard()
const { mounted } = w
const logout     = useAuthStore(s => s.logout)
const darkMode   = useAuthStore(s => s.darkMode)
const toggleDark = useAuthStore(s => s.toggleDarkMode)
const { displayLanguage } = useAuthStore()
const { t } = useTranslation(displayLanguage ?? "en")

// ── Guards ─────────────────────────────────────────────────────────────
if (!w.mounted || !w.user || w.statusLoading) {
  return (
    <div className={`sv-fullpage dashboard${w.mounted && darkMode ? " dark-panel" : ""}`}>
      <div className="sv-fullpage-icon loading"><Loader2 className="animate-spin" /></div>
    </div>
  )
}

if (w.pageState === "submitting") {
  return (
    <div className={`sv-fullpage dashboard${w.mounted && darkMode ? " dark-panel" : ""}`}>
      <div className="sv-fullpage-icon loading"><Loader2 className="animate-spin" /></div>
      <div>
        <p className="sv-fullpage-title">{t("survey.submittingTitle")}</p>
        <p className="sv-fullpage-sub">{t("survey.saving")}</p>
      </div>
    </div>
  )
}

if (w.pageState === "done") {
  return (
    <div className={`sv-fullpage dashboard${w.mounted && darkMode ? " dark-panel" : ""}`}>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="sv-fullpage-icon success"
      >
        <Check />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <p className="sv-fullpage-title">{t("survey.doneTitle")}</p>
        <p className="sv-fullpage-sub">{t("survey.doneSubtitle")}</p>
      </motion.div>
    </div>
  )
}

// ── Wizard ─────────────────────────────────────────────────────────────
return (
  <main className={`sv-shell dashboard${mounted && darkMode ? " dark-panel" : ""}`}>

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
        {/* <div className="sv-header-sep" /> */}
        {/* <span className="sv-header-label">{t("survey.subtitle")}</span> */}
      </div>
      <div className="sv-header-right">
        <span className="sv-counter">
          {t("survey.section")} {w.stepIndex + 1} {t("survey.of")} {7}
        </span>
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

    {/* Progress bar */}
    <div className="sv-progress-track">
      <motion.div
        className="sv-progress-fill"
        animate={{ width: `${w.progress}%` }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
    </div>

    {/* Step area */}
    <div className="sv-wizard-stage">
      <AnimatePresence mode="wait" custom={w.direction}>
        <motion.div
          key={w.stepIndex}
          custom={w.direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="sv-wizard-step"
        >
          <SurveyProgressDots stepIndex={w.stepIndex} />

          <div className="sv-wiz-question">
            {w.current.question}
            {!w.isRequired && <span className="sv-wiz-optional"> — optional</span>}
          </div>
          {w.current.subtext && (
            <p className="sv-wiz-subtext">{w.current.subtext}</p>
          )}

          <SurveyStepInput
            current={w.current}
            inputRef={w.inputRef}
            getValue={w.getValue}
            setValue={w.setValue}
            handleKeyDown={w.handleKeyDown}
            goNext={w.goNext}
            getList={w.getList}
            updateListItem={w.updateListItem}
            addListItem={w.addListItem}
            removeListItem={w.removeListItem}
            t={t}
          />
        </motion.div>
      </AnimatePresence>
    </div>

    <SurveyNavBar
      current={w.current}
      isLast={w.isLast}
      isRequired={w.isRequired}
      canAdvance={w.canAdvance}
      stepIndex={w.stepIndex}
      goNext={w.goNext}
      goBack={w.goBack}
      t={t}
    />

  </main>
)
}