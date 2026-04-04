// components/landing/GlitchTitle.tsx
import { useGlitch } from "@/hooks/useGlitch"
import { useState, useEffect } from "react"

interface Props {
  text: string
  speed?: number
}

export function GlitchTitle({ text, speed = 80 }: Props) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const start = setTimeout(() => setActive(true), 300)
    const stop  = setTimeout(() => setActive(false), 1500)
    return () => { clearTimeout(start); clearTimeout(stop) }
  }, [])

  const glitched = useGlitch(text, active, speed)

  return <div className="title">{glitched}</div>
}