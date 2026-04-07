"use client"
import { useEffect, useState } from "react"

const STEPS = [
  "neo.installStep1",   // "Validating package"
  "neo.installStep2",   // "Linking to agent memory"
  "neo.installStep3",   // "Calibrating instructions"
]

interface InstallingSlotProps {
  slotNum:  number
  pkgTitle: string
  progress: number   // 0–100
  t:        (key: string) => string
}

export function InstallingSlot({ slotNum, pkgTitle, progress, t }: InstallingSlotProps) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const step = progress < 40 ? 0 : progress < 75 ? 1 : 2
    setActiveStep(step)
  }, [progress])

  return (
    <div className="neo-slot installing">
      <span className="neo-slot-number">
        {t("neo.slotLabel").replace("{n}", String(slotNum).padStart(2, "0"))}
      </span>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
        <div className="neo-install-label">
          {pkgTitle}
        </div>

        {/* progress bar */}
        <div className="neo-install-bar-wrap">
          <div
            className="neo-install-bar-fill"
            style={{ width: `${progress}%`, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </div>

        {/* step list */}
        <div className="neo-install-steps">
          {STEPS.map((key, i) => (
            <div
              key={key}
              className={`neo-install-step ${i < activeStep ? "done" : i === activeStep ? "active" : ""}`}
            >
              <div className="neo-install-step-dot" />
              {t(key)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}