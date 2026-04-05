"use client"
import { useState, useEffect }   from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useTraining }             from "@/hooks/useTraining"
import { useAuthStore }            from "@/store/auth"
import { useTranslation }          from "@/locales"
import { TrainingStepIndicator }   from "@/components/training/TrainingStepIndicator"
import { TrainingInput }           from "@/components/training/TrainingInput"
import { TrainingReview }          from "@/components/training/TrainingReview"
import { TrainingDone }            from "@/components/training/TrainingDone"
import "@/styles/train.css"

export default function TrainPage() {
  const training = useTraining()
  const { displayLanguage } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const lang = mounted ? displayLanguage : "en"
  const { t } = useTranslation(lang)

  return (
    <DashboardLayout>
      <div className="t-root">

        {/* Header */}
        <div className="t-header t-fu">
          <div className="t-eyebrow">{t("train.eyebrow")}</div>
          <h1 className="t-title py-2">{t("train.pageTitle")}</h1>
          <p className="t-subtitle py-2">{t("train.pageSubtitle")}</p>
        </div>

        <TrainingStepIndicator step={training.step} stepIndex={training.stepIndex} t={t} />

        {training.step === "input" && (
          <TrainingInput
            text={training.text}
            setText={training.setText}
            isPending={training.submitMutation.isPending}
            onSubmit={training.handleSubmit}
            t={t}
          />
        )}

        {training.step === "review" && training.extracted && (
          <TrainingReview
            extracted={training.extracted}
            weight={training.weight}
            setWeight={training.setWeight}
            showDetails={training.showDetails}
            setShowDetails={training.setShowDetails}
            isPending={training.confirmMutation.isPending}
            onConfirm={training.handleConfirm}
            onReset={training.handleReset}
            t={t}
          />
        )}

        {training.step === "done" && training.doneResult && (
          <TrainingDone
            doneResult={training.doneResult}
            onReset={training.handleReset}
            t={t}
          />
        )}

      </div>
    </DashboardLayout>
  )
}