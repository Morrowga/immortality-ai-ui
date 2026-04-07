/* eslint-disable react-hooks/exhaustive-deps */

import { motion } from "framer-motion"
import { useAuthStore } from "@/store/auth"
import { useEffect, useState }    from "react"
import "@/styles/dashboard.css"
import "@/styles/layout.css"

export function OnboardingLoader() {
  const darkMode = useAuthStore(s => s.darkMode)
  const { loadFromStorage } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { loadFromStorage(); setMounted(true) }, [])

  return (
    <div className={`onboarding-loader dashboard${mounted && darkMode ? " dark-panel" : ""}`} suppressHydrationWarning>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          fontFamily:    "Georgia, serif",
          fontSize:      "22px",
          letterSpacing: "0.04em",
          color:         "var(--imm-txt, #e8e0d0)",
        }}
      >
        imm<span style={{ color: "var(--imm-gold, #c9a84c)" }}>or</span>tality
      </motion.div>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        style={{
          width:          "18px",
          height:         "18px",
          borderRadius:   "50%",
          border:         "2px solid var(--imm-bdr, #2a2a2a)",
          borderTopColor: "var(--imm-gold, #c9a84c)",
        }}
      />
    </div>
  )
}