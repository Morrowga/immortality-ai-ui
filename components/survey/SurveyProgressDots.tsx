import { motion } from "framer-motion"
import { STEPS } from "@/hooks/useSurveyWizard"

interface Props {
  stepIndex: number
}

export function SurveyProgressDots({ stepIndex }: Props) {
  return (
    <div className="sv-step-dots">
      {STEPS.map((_, i) => (
        <motion.div
          key={i}
          className={`sv-step-dot ${i === stepIndex ? "active" : i < stepIndex ? "done" : ""}`}
          animate={{
            scale:           i === stepIndex ? 1.25 : 1,
            backgroundColor: i < stepIndex
              ? "var(--imm-green)"
              : i === stepIndex
                ? "var(--imm-gold)"
                : "var(--imm-bdr)",
          }}
          transition={{ duration: 0.25 }}
        />
      ))}
    </div>
  )
}