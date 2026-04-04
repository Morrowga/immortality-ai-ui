import { useEffect, useRef } from "react"

export function useRainCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&'
    const FS = 14
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const gfx = ctx

    // Capture as non-null locals so closures don't lose narrowing
    const cvs = canvas
    let running = true, animId = 0, W = 0, H = 0

    interface Col { x: number; y: number; speed: number; chars: string[]; bright: boolean }
    let cols: Col[] = []

    function rndChar() { return CHARS[Math.floor(Math.random() * CHARS.length)] }

    function setup() {
      W = cvs.width = window.innerWidth
      H = cvs.height = window.innerHeight
      gfx.clearRect(0, 0, W, H)
      cols = Array.from({ length: Math.floor(W / FS) }, (_, i) => ({
        x: i * FS,
        y: Math.random() * H,
        speed: FS * (0.08 + Math.random() * 0.13),
        chars: Array.from({ length: Math.floor(H / FS) + 2 }, rndChar),
        bright: Math.random() < 0.05,
      }))
    }

    function loop() {
      if (!running) return
      gfx.fillStyle = 'rgba(2,4,8,0.05)'
      gfx.fillRect(0, 0, W, H)
      gfx.font = `${FS}px "Matrix Code NFI", monospace`

      for (const col of cols) {
        for (let j = 0; j < col.chars.length; j++) {
          const y = col.y + j * FS
          if (y < 0 || y > H) continue
          if (j === 0) {
            gfx.fillStyle = col.bright ? '#ffffff' : '#a8ffbe'
          } else {
            const a = Math.max(0.04, 1 - j * 0.055)
            gfx.fillStyle = col.bright ? `rgba(0,255,65,${a})` : `rgba(34,197,94,${a * 0.65})`
          }
          if (Math.random() < 0.007) col.chars[j] = rndChar()
          gfx.fillText(col.chars[j], col.x, y)
        }
        col.y += col.speed
        if (col.y > H + FS * 2) {
          col.y = -FS * (Math.floor(Math.random() * 20) + 4)
          col.speed = FS * (0.08 + Math.random() * 0.13)
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

  return ref
}