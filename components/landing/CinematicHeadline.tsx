import { useEffect, useState } from "react"

const HEADLINE_WORDS = [
  { text: '"',      color: '#93C5FD' },   // was #6EE7B7
  { text: 'What',   color: '#93C5FD' },   // was #6EE7B7
  { text: 'if',     color: '#2563EB' },   // was #22C55E
  { text: 'the',    color: '#BFDBFE' },   // was #A7F3D0
  { text: 'people', color: '#DBEAFE' },   // was #D1FAE5
  { text: 'you',    color: '#DBEAFE' },   // was #D1FAE5
  { text: 'love',   color: '#2563EB' },   // was #22C55E
  { text: 'never',  color: '#BFDBFE' },   // was #A7F3D0
  { text: 'truly',  color: '#93C5FD' },   // was #6EE7B7
  { text: 'left?',  color: '#3B82F6' },   // was #00FF41
  { text: '"',      color: '#3B82F6' },   // was #00FF41
]

export function CinematicHeadline() {
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    let i = 0
    function next() {
      if (i >= HEADLINE_WORDS.length) return
      i++; setRevealed(i)
      const delay = i === 1 ? 280 : i <= 3 ? 220 : i <= 6 ? 180 : i === 8 ? 320 : 240
      setTimeout(next, delay)
    }
    const t = setTimeout(next, 800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="headline-wrap">
      {HEADLINE_WORDS.map((w, i) => (
        <span
          key={i}
          className={`headline-word${i < revealed ? ' revealed' : ''}`}
          style={{
            color: w.color,
            fontFamily: "'Oxanium', sans-serif",
            textShadow: i < revealed && i === HEADLINE_WORDS.length - 1
              ? '0 0 30px rgba(59,130,246,0.5), 0 0 60px rgba(59,130,246,0.2)'   // was green
              : i < revealed ? `0 0 20px ${w.color}33` : 'none',
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  )
}