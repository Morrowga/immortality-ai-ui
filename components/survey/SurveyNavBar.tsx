import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Step } from "@/hooks/useSurveyWizard"

interface Props {
  current:    Step
  isLast:     boolean
  isRequired: boolean
  canAdvance: () => boolean
  stepIndex:  number
  goNext:     () => void
  goBack:     () => void
  t:          (key: string) => string
}

export function SurveyNavBar({
  current, isLast, isRequired, canAdvance, stepIndex, goNext, goBack, t,
}: Props) {
  return (
    <div className="sv-input-bar">
      <div className="sv-wiz-nav">
        <motion.button
          className="sv-wiz-back"
          onClick={goBack}
          disabled={stepIndex === 0}
          whileHover={stepIndex > 0 ? { x: -2 } : {}}
          whileTap={stepIndex > 0 ? { scale: 0.95 } : {}}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          {t("survey.back")}
        </motion.button>

        <motion.button
          className={`sv-wiz-next ${isLast ? "finish" : ""}`}
          onClick={goNext}
          disabled={isRequired && !canAdvance()}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          {isLast ? (
            <><Check style={{ width: 15, height: 15 }} /> {t("survey.saveAndContinue")}</>
          ) : (
            <>{isRequired ? t("survey.continue") : t("survey.skip")} <ChevronRight style={{ width: 16, height: 16 }} /></>
          )}
        </motion.button>
      </div>

      {(current.type === "text" || current.type === "number") && (
        <p className="sv-input-hint">{t("survey.enterToContinue")}</p>
      )}
    </div>
  )
}