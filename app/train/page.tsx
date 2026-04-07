/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { useState, useEffect } from "react"
import DashboardLayout         from "@/components/layout/DashboardLayout"
import { useTraining }         from "@/hooks/useTraining"
import { useAuthStore }        from "@/store/auth"
import { useTranslation }      from "@/locales"
import { TrainingChat }        from "@/components/training/TrainingChat"
import "@/styles/train.css"
import { useBilling } from "@/hooks/useBilling"

export default function TrainPage() {
  const training = useTraining()
  const { displayLanguage } = useAuthStore()
  const { balance, setSoulsDialogOpen } = useBilling()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const lang = mounted ? displayLanguage : "en"
  const { t } = useTranslation(lang)

  useEffect(() => {
    if (balance && !balance.can_train) {
      setSoulsDialogOpen(true)
    }
  }, [balance])

  return (
    <DashboardLayout>
      <div className="t-root">

        <div className="t-header t-fu">
          <div className="t-eyebrow">{t("train.eyebrow")}</div>
          <h1 className="t-title">{t("train.pageTitle")}</h1>
          <p className="t-subtitle">{t("train.pageSubtitle")}</p>
        </div>

        <TrainingChat training={training} t={t} />

      </div>
    </DashboardLayout>
  )
}