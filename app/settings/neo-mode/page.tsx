/* eslint-disable react/no-unescaped-entities */
"use client"
// app/(dashboard)/settings/neo-mode/page.tsx

import dynamic from "next/dynamic"
import DashboardLayout from "@/components/layout/DashboardLayout"
import "@/styles/neo.css"

function Sh({ w, h, radius = 6, style }: {
  w: number | string
  h: number | string
  radius?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      className="neo-sk"
      style={{ width: w, height: h, borderRadius: radius, flexShrink: 0, ...style }}
    />
  )
}

function NeoModeSkeleton() {
  return (
    <DashboardLayout>
      <style>{`
        .neo-sk {
          background-color: var(--imm-brown-dark);
          background-image: linear-gradient(90deg, transparent 25%, var(--imm-brown-dark) 50%, transparent 75%);
          background-size: 200% 100%;
          animation: neo-shimmer 1.4s ease-in-out infinite;
          opacity: 0.22;
        }
        @keyframes neo-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="neo-root">

        {/* Header */}
        <div className="neo-header">
          <Sh w={56} h={10} style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Sh w={120} h={32} />
            <Sh w={48} h={22} radius={6} />
          </div>
          <Sh w="100%" h={13} style={{ maxWidth: 520, marginBottom: 6 }} />
          <Sh w="72%" h={13} style={{ maxWidth: 400 }} />
        </div>

        {/* Body */}
        <div className="neo-full-body">

          {/* Section header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Sh w={180} h={14} />
            <Sh w={140} h={32} radius={9} />
          </div>

          {/* 4 slot cards */}
          <div className="neo-slots-grid-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="neo-slot" style={{ minHeight: 160 }}>
                <Sh w={40} h={10} style={{ marginBottom: 16 }} />
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 10, flex: 1,
                }}>
                  <Sh w={32} h={32} radius={99} />
                  <Sh w={72} h={11} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <Sh w={76} h={28} radius={8} />
                    <Sh w={76} h={28} radius={8} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="neo-divider" />

          {/* Info block */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "14px 16px",
            border: "1px solid var(--imm-bdr)",
            borderRadius: 10,
            background: "var(--imm-sand2)",
          }}>
            <Sh w={16} h={16} radius={99} style={{ marginTop: 2 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <Sh w="100%" h={11} />
              <Sh w="75%" h={11} />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}

const NeoModeContent = dynamic(
  () => import("@/components/neo/NeoModeContent"),
  {
    ssr: false,
    loading: () => <NeoModeSkeleton />,
  }
)

export default function NeoModePage() {
  return <NeoModeContent />
}