import { useEffect, useRef, useState } from "react"
import { LINES } from "@/hooks/lines"

interface MemoryItem {
  id: number
  text: string
  opacity: number
  size: number
  y: number
  x: number
  blur: number
  color: string
}

export function MemoryStack() {
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const idRef    = useRef(0)
  const indexRef = useRef(0)

  useEffect(() => {
    function spawn() {
      const text = LINES[indexRef.current % LINES.length]
      indexRef.current++

      const isBinary   = /^[01\s]{8,}/.test(text)
      const isCommand  = text.startsWith('>')
      const isJapanese = /^[ァ-ン死]/.test(text)

      const color = isCommand  ? '#00FF41'
        : isBinary   ? 'rgba(0,255,65,0.45)'
        : isJapanese ? 'rgba(34,197,94,0.65)'
        : `rgba(${[
            '110,231,183',
            '209,250,229',
            '167,243,208',
            '52,211,153',
          ][Math.floor(Math.random() * 4)]}, 0.8)`

      const id: number = idRef.current++
      const item: MemoryItem = {
        id, text, opacity: 0,
        size: isBinary ? 10 : isCommand ? 12 : isJapanese ? 13 : 11 + Math.random() * 8,
        y: Math.random() * 240,
        x: Math.random() * 20 - 10,
        blur: Math.random() * 2,
        color,
      }

      setMemories(prev => [...prev, item])
      setTimeout(() => {
        setMemories(prev => prev.map(m => m.id === id ? { ...m, opacity: 0.15 + Math.random() * 0.7 } : m))
      }, 40)

      const hold = isBinary ? 1200 : isCommand ? 1500 : isJapanese ? 2000 : 2500 + Math.random() * 2000
      setTimeout(() => {
        setMemories(prev => prev.map(m => m.id === id ? { ...m, opacity: 0, blur: m.blur + 3 } : m))
      }, hold)
      setTimeout(() => {
        setMemories(prev => prev.filter(m => m.id !== id))
      }, hold + 1200)

      const nextDelay = 400 + Math.random() * 500
      setTimeout(spawn, nextDelay)
    }

    for (let i = 0; i < 5; i++) setTimeout(spawn, i * 200)
  }, [])

  return (
    <div className="memory-outer">
      {memories.map(m => (
        <div
          key={m.id}
          className="memory-item"
          style={{
            top: m.y,
            left: m.x,
            fontSize: m.size,
            color: m.color,
            opacity: m.opacity,
            filter: `blur(${m.blur}px)`,
            fontFamily: /^[01\s]{8,}/.test(m.text) || m.text.startsWith('>')
              ? "'Matrix Code NFI', monospace" : "'Oxanium', sans-serif",
            fontWeight: m.text.startsWith('>') ? 600 : 400,
            letterSpacing: /^[01\s]{8,}/.test(m.text) ? '0.1em' : '0.03em',
          }}
        >
          {m.text}
        </div>
      ))}
    </div>
  )
}