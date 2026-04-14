/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react"
import { useAuthStore } from "@/store/auth"

const STATUSES = [
  "loading profile…",
  "syncing memory shards…",
  "mapping neural threads…",
  "calibrating timeline…",
  "restoring identity…",
]

export function OnboardingLoader() {
  const { loadFromStorage } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [statusIdx, setStatusIdx] = useState(0)
  const [statusVisible, setStatusVisible] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()

  useEffect(() => { loadFromStorage(); setMounted(true) }, [])

  // Star field
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const parent = canvas.parentElement!

    const resize = () => {
      canvas.width = parent.offsetWidth
      canvas.height = parent.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.004 + 0.001,
      phase: Math.random() * Math.PI * 2,
    }))

    const loop = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const s of stars) {
        const alpha = 0.1 + 0.35 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(147,197,253,${alpha})`
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener("resize", resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [mounted])

  // Status cycling
  useEffect(() => {
    const id = setInterval(() => {
      setStatusVisible(false)
      setTimeout(() => {
        setStatusIdx(i => (i + 1) % STATUSES.length)
        setStatusVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      background: "#070d17",
      gap: "32px",
    }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      {/* Wordmark */}
      <div style={{
        fontFamily: "'Oxanium', sans-serif",
        fontSize: "52px",
        fontWeight: 400,
        letterSpacing: "0.18em",
        color: "#3B82F6",
        position: "relative",
        zIndex: 2,
        animation: "wordPulse 3s ease-in-out infinite",
      }}>
        IMMORTAL
      </div>

      <div style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: "12px",
        letterSpacing: "0.28em",
        color: "rgba(147,197,253,0.45)",
        textTransform: "uppercase",
        position: "relative",
        zIndex: 2,
        marginTop: "-22px",
        animation: "tagFade 3s ease-in-out infinite",
      }}>
        initialising your legacy
      </div>

      {/* Triple ring spinner */}
      {/* <div style={{ position: "relative", width: 72, height: 72, zIndex: 2 }}>
        {[
          { inset: 0, borderTopColor: "#3B82F6", duration: "2.4s", dir: "normal" },
          { inset: 10, borderRightColor: "rgba(59,130,246,0.5)", duration: "1.8s", dir: "reverse" },
          { inset: 22, borderBottomColor: "rgba(59,130,246,0.35)", duration: "1.2s", dir: "normal" },
        ].map((ring, i) => (
          <div key={i} style={{
            position: "absolute",
            inset: ring.inset,
            borderRadius: "50%",
            border: "1px solid rgba(59,130,246,0.08)",
            ...ring,
            animation: `spin ${ring.duration} linear infinite`,
            animationDirection: ring.dir as any,
          }} />
        ))}
        <div style={{
          position: "absolute",
          width: 4, height: 4,
          borderRadius: "50%",
          background: "#3B82F6",
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          boxShadow: "0 0 8px 2px rgba(59,130,246,0.5)",
          animation: "dotPulse 2.4s ease-in-out infinite",
          zIndex: 3,
        }} />
      </div> */}

      {/* Scan line */}
      <div style={{ width: 160, height: 1, position: "relative", zIndex: 2, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.7),transparent)",
          animation: "scanMove 2.2s ease-in-out infinite",
        }} />
      </div>

      {/* Status text */}
      <div style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: "11px",
        letterSpacing: "0.2em",
        color: "rgba(147,197,253,0.35)",
        zIndex: 2,
        marginTop: -16,
        transition: "opacity 0.4s ease",
        opacity: statusVisible ? 1 : 0,
      }}>
        {STATUSES[statusIdx]}
      </div>
    </div>
  )
}