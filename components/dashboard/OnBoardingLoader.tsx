/* eslint-disable react-hooks/exhaustive-deps */
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/auth"
import { useEffect, useState } from "react"
import "@/styles/dashboard.css"
import "@/styles/layout.css"

export function OnboardingLoader() {
  const darkMode = useAuthStore(s => s.darkMode)
  const { loadFromStorage } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { loadFromStorage(); setMounted(true) }, [])

  return (
    <div
      className={`onboarding-loader dashboard${mounted && darkMode ? " dark-panel" : ""}`}
      suppressHydrationWarning
    >
      {/* Wordmark */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          fontFamily:    "'Lora', Georgia, serif",
          fontSize:      "24px",
          fontWeight:    500,
          letterSpacing: "0.06em",
          color:         "var(--imm-txt, #DBEAFE)",
        }}
      >
        imm<span style={{ color: "var(--imm-matrix, #3B82F6)", fontStyle: "italic" }}>or</span>tality
      </motion.div>

      {/* Spinner — thin, elegant */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        style={{
          width:          "20px",
          height:         "20px",
          borderRadius:   "50%",
          border:         "1.5px solid rgba(59,130,246,0.15)",
          borderTopColor: "var(--imm-matrix, #3B82F6)",
        }}
      />

      {/* Scanning line */}
      <motion.div
        animate={{ scaleX: [0, 1, 0], opacity: [0, 0.6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        style={{
          width:        "80px",
          height:       "1px",
          background:   "linear-gradient(90deg, transparent, var(--imm-matrix, #3B82F6), transparent)",
          borderRadius: "99px",
        }}
      />
    </div>
  )
}