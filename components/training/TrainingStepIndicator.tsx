import { Fragment } from "react"
import { Check } from "lucide-react"
import { TrainingStep } from "@/hooks/useTraining"

interface Props {
  step:      TrainingStep
  stepIndex: number
  t:         (key: string) => string
}

export function TrainingStepIndicator({ step, stepIndex, t }: Props) {
  const STEPS = [t("train.stepWrite"), t("train.stepReview"), t("train.stepSaved")]

  return (
    <div className="t-steps t-fu">
      {STEPS.map((label, i) => {
        const isDone   = step === "done" || i < stepIndex
        const isActive = step !== "done" && i === stepIndex
        return (
          <Fragment key={label}>
            <div className={`t-step ${isActive ? "active" : isDone ? "done" : ""}`}>
              <div className="t-step-dot">
                {isDone ? <Check style={{ width: 10, height: 10 }} /> : i + 1}
              </div>
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="t-step-line"
                style={{ background: isDone ? "var(--imm-green)" : "var(--imm-bdr)" }}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}