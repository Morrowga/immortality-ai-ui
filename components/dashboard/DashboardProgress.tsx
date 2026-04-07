"use client"
import { useEffect, useRef } from "react"

const MAX_COUNT = 999999
const MIN_FILL  = 0.04

const SECTION_KEYS: Record<string, string> = {
  BASIC:   "dashboard.sectionBasic",
  PAST:    "dashboard.sectionPast",
  PRESENT: "dashboard.sectionPresent",
  FUTURE:  "dashboard.sectionFuture",
}

interface Props {
  sections:      Record<string, number> | undefined
  totalMemories: number
  label:         string
  t:             (key: string) => string
}

interface VialProps {
  count: number
  name:  string
  delay: number
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K"
  return String(n)
}

const GW   = 96
const GH   = 280
const WALL = 2
const PR   = GW / 2
const IW   = GW - WALL * 2
const IH   = GH - WALL * 2
const OX   = 4
const OY   = 4

function WaterVial({ count, name, delay }: VialProps) {
  const rectRef = useRef<SVGRectElement | null>(null)
  const waveRef = useRef<SVGPathElement | null>(null)

  const rawRatio = count / MAX_COUNT
  const ratio    = count === 0 ? MIN_FILL : Math.max(rawRatio, MIN_FILL)
  const FILL_H   = IH * ratio
  const BASE_Y   = OY + WALL + IH

  const clipId = `clip-${name.replace(/\s/g, "")}`
  const gradId = `grad-${name.replace(/\s/g, "")}`

  useEffect(() => {
    const rectEl = rectRef.current
    const waveEl = waveRef.current
    if (rectEl === null || waveEl === null) return

    // capture as non-nullable so TypeScript trusts them inside tick
    const rect: SVGRectElement  = rectEl
    const wave: SVGPathElement  = waveEl

    let raf = 0
    let start: number | null = null
    let phase = 0
    const duration = 1400

    function tick(ts: number): void {
      if (start === null) start = ts
      const p    = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const cf   = FILL_H * ease
      const cy   = BASE_Y - cf

      rect.setAttribute("y",      String(cy))
      rect.setAttribute("height", String(cf))

      phase += 0.026
      const wx   = OX + WALL
      const segs = 14
      const sw   = IW / segs
      let d = `M ${wx} ${cy}`
      for (let i = 0; i <= segs; i++) {
        const x = wx + i * sw
        const y = cy + Math.sin(i * 1.0 + phase) * 3 * ease
        d += ` L ${x} ${y}`
      }
      d += ` L ${wx + IW} ${cy + 8} L ${wx} ${cy + 8} Z`
      wave.setAttribute("d", d)

      raf = requestAnimationFrame(tick)
    }

    const t = setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(t)
      cancelAnimationFrame(raf)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, delay])

  const vw = GW + 8
  const vh = GH + 8

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} style={{ overflow: "visible" }}>
        <defs>
          <clipPath id={clipId}>
            <rect
              x={OX + WALL} y={OY + WALL}
              width={IW} height={IH}
              rx={IW / 2}
            />
          </clipPath>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#93C5FD" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        <rect
          x={OX} y={OY} width={GW} height={GH}
          rx={PR}
          fill="rgba(2,4,8,0.55)"
          stroke="rgba(59,130,246,0.40)" strokeWidth="1.5"
        />

        <g clipPath={`url(#${clipId})`}>
          <rect
            ref={rectRef}
            x={OX + WALL} y={BASE_Y}
            width={IW} height={0}
            fill={`url(#${gradId})`}
          />
          <path ref={waveRef} fill="#93C5FD" fillOpacity="0.40" stroke="none" d="" />
        </g>

        <rect
          x={OX + WALL + 6} y={OY + PR + 4}
          width="4" height={IH - PR * 2 - 8}
          rx="2" fill="rgba(255,255,255,0.09)"
        />

        {[25, 50, 75].map(pct => {
          const ty = OY + WALL + IH * (1 - pct / 100)
          return (
            <line
              key={pct}
              x1={OX + GW - WALL - 10} x2={OX + GW - WALL - 4}
              y1={ty} y2={ty}
              stroke="rgba(59,130,246,0.28)" strokeWidth="1"
            />
          )
        })}
      </svg>

      <div style={{ fontSize: 11, color: "var(--imm-txt2)", fontWeight: 500, textAlign: "center" }}>
        {name}
      </div>
      <div style={{ fontSize: 10, color: "var(--imm-txt3)", fontWeight: 300 }}>
        {fmt(count)} / {fmt(MAX_COUNT)}
      </div>
    </div>
  )
}

export function DashboardProgress({ sections, totalMemories, label, t }: Props) {
  const items = sections
    ? Object.entries(sections).map(([key, val]) => ({
        name:  t(SECTION_KEYS[key] ?? key),
        count: val as number,
      }))
    : []

  return (
    <div className="d-progress-card d-fu">
      <div className="d-card-label">{label}</div>

      {totalMemories === 0 && items.every(i => i.count === 0) ? (
        <p className="d-empty-msg">{t("dashboard.progressEmpty")}</p>
      ) : (
        <div style={{
          display:             "grid",
          gridTemplateColumns: `repeat(${items.length}, 1fr)`,
          gap:                 4,
          alignItems:          "end",
          justifyItems:        "center",
          flex:                1,
          paddingTop:          8,
        }}>
          {items.map((item, i) => (
            <WaterVial
              key={item.name}
              name={item.name}
              count={item.count}
              delay={i * 130}
            />
          ))}
        </div>
      )}
    </div>
  )
}