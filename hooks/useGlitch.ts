import { useEffect, useState } from "react"

const CHARS = 'アイウエオ@#$%&ABCXYZ01'

export function useGlitch(text: string, active: boolean, speed = 42) {
  const [glitched, setGlitched] = useState(text)

  useEffect(() => {
    if (!active) { setGlitched(text); return }
    let count = 0
    const steps = text.length + 6
    const id = setInterval(() => {
      if (count >= steps) { setGlitched(text); clearInterval(id); return }
      setGlitched(text.split('').map((ch, i) =>
        i < count ? ch : (Math.random() < 0.4 ? CHARS[Math.floor(Math.random() * CHARS.length)] : ch)
      ).join(''))
      count++
    }, speed)
    return () => clearInterval(id)
  }, [active, text, speed])

  return glitched
}