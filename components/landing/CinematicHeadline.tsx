import { useEffect, useState } from "react"

const HEADLINE_WORDS = [
  { text: '"',      color: '#6EE7B7' },
  { text: 'What',   color: '#6EE7B7' },
  { text: 'if',     color: '#22C55E' },
  { text: 'the',    color: '#A7F3D0' },
  { text: 'people', color: '#D1FAE5' },
  { text: 'you',    color: '#D1FAE5' },
  { text: 'love',   color: '#22C55E' },
  { text: 'never',  color: '#A7F3D0' },
  { text: 'truly',  color: '#6EE7B7' },
  { text: 'left?',  color: '#00FF41' },
  { text: '"',      color: '#00FF41' },
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
              ? '0 0 30px rgba(0,255,65,0.5), 0 0 60px rgba(0,255,65,0.2)'
              : i < revealed ? `0 0 20px ${w.color}33` : 'none',
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  )
}