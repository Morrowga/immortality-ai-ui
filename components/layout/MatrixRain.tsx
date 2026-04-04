"use client"
import { useEffect, useRef } from "react"

const CHARS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&'

interface Col {
  x: number
  y: number
  speed: number
  chars: string[]
  bright: boolean
}

export default function MatrixRain({ opacity = 0.25 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const FS = 14
    let animId = 0
    let running = true
    let cols: Col[] = []
    let W = 0
    let H = 0

    function randomChar() {
      return CHARS[Math.floor(Math.random() * CHARS.length)]
    }

    function setup() {
      W = canvas!.width  = window.innerWidth
      H = canvas!.height = window.innerHeight
      ctx!.clearRect(0, 0, W, H)
      const n = Math.floor(W / FS)
      cols = Array.from({ length: n }, (_, i) => ({
        x:      i * FS,
        y:      Math.random() * H,
        speed:  FS * (0.08 + Math.random() * 0.13),
        chars:  Array.from({ length: Math.floor(H / FS) + 2 }, randomChar),
        bright: Math.random() < 0.05,
      }))
    }

    function loop() {
      if (!running) return

      ctx!.fillStyle = 'rgba(2,4,8,0.05)'
      ctx!.fillRect(0, 0, W, H)
      ctx!.font = `${FS}px "Matrix Code NFI", monospace`

      for (const col of cols) {
        for (let j = 0; j < col.chars.length; j++) {
          const y = col.y + j * FS
          if (y < 0 || y > H) continue

          if (j === 0) {
            ctx!.fillStyle = col.bright ? '#ffffff' : '#a8ffbe'
          } else {
            const a = Math.max(0.04, 1 - j * 0.055)
            ctx!.fillStyle = col.bright
              ? `rgba(0,255,65,${a})`
              : `rgba(34,197,94,${a * 0.65})`
          }

          if (Math.random() < 0.007) col.chars[j] = randomChar()
          ctx!.fillText(col.chars[j], col.x, y)
        }

        col.y += col.speed
        if (col.y > H + FS * 2) {
          col.y     = -FS * (Math.floor(Math.random() * 20) + 4)
          col.speed  = FS * (0.08 + Math.random() * 0.13)
          col.bright = Math.random() < 0.05
        }
      }

      animId = requestAnimationFrame(loop)
    }

    setup()
    window.addEventListener('resize', setup)
    loop()

    return () => {
      running = false
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', setup)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
      }}
    />
  )
}