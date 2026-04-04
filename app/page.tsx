/* eslint-disable @next/next/no-img-element */
"use client"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useGlitch } from "@/hooks/useGlitch"
import { CinematicHeadline } from "@/components/landing/CinematicHeadline"
import "@/styles/home.css"

const RainCanvas = dynamic(
  () => import("@/components/landing/RainCanvas").then(m => ({ default: m.RainCanvas })),
  { ssr: false }
)
const MemoryStack = dynamic(
  () => import("@/components/landing/MemoryStack").then(m => ({ default: m.MemoryStack })),
  { ssr: false }
)

export default function Home() {
  const [glitchTitle, setGlitchTitle] = useState(false)
  const titleText = useGlitch('IMMORTAL AI', glitchTitle, 200)
  const { isLoading } = useAuthStore()
  const [visible,     setVisible]     = useState(false)
  const [glitchBegin, setGlitchBegin] = useState(false)
  const [glitchSign,  setGlitchSign]  = useState(false)

  const beginText = useGlitch('ENTER THE CONSTRUCT', glitchBegin)
  const signText  = useGlitch('SIGN IN', glitchSign)

  useEffect(() => { const t = setTimeout(() => setVisible(true), 80);     return () => clearTimeout(t) }, [])
  useEffect(() => { const t = setTimeout(() => setGlitchTitle(true), 300); return () => clearTimeout(t) }, [])

  if (isLoading) return null

  return (
    <main className="root">
      <RainCanvas />
      <div className="vignette" />

      <div className="grid">

        {/* ── LEFT ── */}
        <div className={`left${visible ? ' visible' : ''}`}>
          <div className="title-block">
            <div className="title">{titleText}</div>
          </div>
          <MemoryStack />
          <div className="btn-row">
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <button
                className="btn-primary"
                onMouseEnter={() => { setGlitchBegin(true); setTimeout(() => setGlitchBegin(false), 700) }}
              >
                <span className="btn-label">{beginText}</span>
                <span className="arrow">▶</span>
              </button>
            </Link>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button
                className="btn-secondary"
                onMouseEnter={() => { setGlitchSign(true); setTimeout(() => setGlitchSign(false), 700) }}
              >
                <span className="btn-label-sm">{signText}</span>
              </button>
            </Link>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="right">
          <div className="right-inner">
            <CinematicHeadline />
            <div className="hero-wrap">
              <img src="/hero.png" alt="" className="hero-img" />
            </div>
          </div>
        </div>

      </div>

      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />
    </main>
  )
}