"use client"
import { useState, useEffect }    from "react"
import DashboardLayout            from "@/components/layout/DashboardLayout"
import { useSettings }            from "@/hooks/useSettings"
import { useAuthStore }           from "@/store/auth"
import { useTranslation }         from "@/locales"
import { SettingsProfile }        from "@/components/settings/SettingsProfile"
import { SettingsPublicUrl }      from "@/components/settings/SettingsPublicUrl"
import { SettingsNav }            from "@/components/settings/SettingsNav"
import { SettingsDangerZone }     from "@/components/settings/SettingsDangerZone"
import "@/styles/settings-root.css"

// ── Skeleton ──────────────────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <>
      <style>{`
        .st-sk {
          background-color: var(--imm-brown-dark);
          background-image: linear-gradient(90deg, transparent 25%, var(--imm-brown-dark) 50%, transparent 75%);
          background-size: 200% 100%;
          animation: st-shimmer 1.4s ease-in-out infinite;
          opacity: 0.18;
          border-radius: 6px;
          flex-shrink: 0;
        }
        @keyframes st-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="st-root">

        {/* Header */}
        <div className="st-header">
          <div className="st-sk" style={{ width: 52, height: 10, marginBottom: 14 }} />
          <div className="st-sk" style={{ width: 100, height: 30, marginBottom: 10 }} />
          <div className="st-sk" style={{ width: 280, height: 13 }} />
        </div>

        <div className="st-body">

          {/* Left column */}
          <div className="st-col-left">

            {/* Profile card — 5 label+value rows */}
            <div className="st-card">
              <div className="st-sk" style={{ width: 60, height: 13, marginBottom: 20 }} />
              {[140, 180, 80, 120, 40].map((valW, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  paddingBlock: 14,
                  borderTop: i === 0 ? "none" : "1px solid var(--imm-bdr)",
                }}>
                  <div className="st-sk" style={{ width: 60, height: 12 }} />
                  <div className="st-sk" style={{ width: valW, height: 12 }} />
                </div>
              ))}
            </div>

            {/* Public link card */}
            <div className="st-card" style={{ marginTop: 16 }}>
              <div className="st-sk" style={{ width: 140, height: 13, marginBottom: 8 }} />
              <div className="st-sk" style={{ width: "90%", height: 12, marginBottom: 20 }} />
              {/* URL input row */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--imm-bdr)",
                background: "var(--imm-sand)",
              }}>
                <div className="st-sk" style={{ flex: 1, height: 13 }} />
                <div className="st-sk" style={{ width: 20, height: 20, borderRadius: 4 }} />
                <div className="st-sk" style={{ width: 20, height: 20, borderRadius: 4 }} />
                <div className="st-sk" style={{ width: 20, height: 20, borderRadius: 4 }} />
              </div>
            </div>

          </div>

          {/* Right column */}
          <div className="st-col-right">

            {/* More settings nav card — 3 rows */}
            <div className="st-card">
              <div className="st-sk" style={{ width: 100, height: 13, marginBottom: 16 }} />
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--imm-bdr)",
                }}>
                  <div className="st-sk" style={{ width: 32, height: 32, borderRadius: 8 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="st-sk" style={{ width: 90, height: 12 }} />
                    <div className="st-sk" style={{ width: 140, height: 10 }} />
                  </div>
                  <div className="st-sk" style={{ width: 14, height: 14, borderRadius: 3 }} />
                </div>
              ))}
            </div>

            {/* Danger zone card */}
            <div className="st-card" style={{ marginTop: 16, border: "1px solid rgba(220,53,69,0.15)" }}>
              <div className="st-sk" style={{ width: 80, height: 13, marginBottom: 8 }} />
              <div className="st-sk" style={{ width: "85%", height: 12, marginBottom: 16 }} />
              <div className="st-sk" style={{ width: 130, height: 34, borderRadius: 9 }} />
            </div>

          </div>

        </div>
      </div>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const s = useSettings()
  const { displayLanguage } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const lang = mounted ? displayLanguage : "en"
  const { t } = useTranslation(lang)

  return (
    <DashboardLayout>
      {(!mounted || s.isLoading) ? (
        <SettingsSkeleton />
      ) : (
        <div className="st-root">

          <div className="st-header">
            <div className="st-eyebrow">{t("settings.eyebrow")}</div>
            <h1 className="st-title">{t("settings.title")}</h1>
            <p className="st-subtitle">{t("settings.subtitle")}</p>
          </div>

          <div className="st-body">

            <div className="st-col-left">
              <SettingsProfile user={s.user} agent={s.agent} t={t} />
              <SettingsPublicUrl
                agent={s.agent}
                publicUrl={s.publicUrl}
                editingSlug={s.editingSlug}
                slugInput={s.slugInput}
                slugErr={s.slugErr}
                copiedSlug={s.copiedSlug}
                isPending={s.updateSlug.isPending}
                setSlugInput={s.setSlugInput}
                setSlugErr={s.setSlugErr}
                setEditingSlug={s.setEditingSlug}
                openSlugEdit={s.openSlugEdit}
                copyUrl={s.copyUrl}
                handleSlugSave={s.handleSlugSave}
                t={t}
              />
            </div>

            <div className="st-col-right">
              <SettingsNav t={t} />
              <SettingsDangerZone
                userName={s.user?.name}
                deleteConfirm={s.deleteConfirm}
                deleteInput={s.deleteInput}
                isPending={s.deleteAccount.isPending}
                setDeleteConfirm={s.setDeleteConfirm}
                setDeleteInput={s.setDeleteInput}
                onDelete={() => s.deleteAccount.mutate()}
                t={t}
              />
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  )
}