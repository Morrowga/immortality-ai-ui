/* eslint-disable react-hooks/exhaustive-deps */

"use client"
import { useState, useEffect, useRef } from "react"
import DashboardLayout   from "@/components/layout/DashboardLayout"
import { Loader2, FlaskConical, Info, ArrowLeft } from "lucide-react"
import { useNeo }        from "@/hooks/useNeo"
import { useAuthStore }  from "@/store/auth"
import { useTranslation } from "@/locales"
import { EmptySlot }     from "./EmptySlot"
import { FilledSlot }    from "./FilledSlot"
import { InstallingSlot } from "./InstallingSlot"
import { InstallScreen } from "./InstallScreen"
import { CustomScreen }  from "./CustomScreen"
import { EditInstrModal } from "./EditInstrModal"
import { useBilling }    from "@/hooks/useBilling"
import "@/styles/neo.css"

type View = "grid" | "install" | "custom"

export default function NeoModeContent() {
  const n = useNeo()
  const { balance, setSoulsDialogOpen } = useBilling()
  const [view, setView]         = useState<View>("grid")
  const [mounted, setMounted]   = useState(false)

  // Track which slot is currently installing + animated progress
  const [installingSlot, setInstallingSlot]     = useState<number | null>(null)
  const [installingTitle, setInstallingTitle]   = useState<string>("")
  const [installProgress, setInstallProgress]   = useState<number>(0)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { displayLanguage } = useAuthStore()
  const lang    = mounted ? displayLanguage : "en"
  const { t }   = useTranslation(lang)

  useEffect(() => { setMounted(true) }, [])

  // When autoGenerate succeeds → back to grid
  useEffect(() => {
    if (!n.autoGenerateMutation.isSuccess) return
    setView("grid")
  }, [n.autoGenerateMutation.isSuccess])

  // Trigger souls dialog when balance is depleted
  useEffect(() => {
    if (balance && !balance.can_train) setSoulsDialogOpen(true)
  }, [balance])

  // ── Progress animation helpers ──────────────────────────────
  function startProgress() {
    setInstallProgress(0)
    let p = 0
    progressRef.current = setInterval(() => {
      // accelerate to ~85% then slow — never reaches 100 until done
      p += p < 40 ? 6 : p < 70 ? 3 : p < 85 ? 1 : 0.2
      if (p > 85) p = 85
      setInstallProgress(Math.round(p))
    }, 120)
  }

  function finishProgress(cb: () => void) {
    if (progressRef.current) clearInterval(progressRef.current)
    setInstallProgress(100)
    setTimeout(() => {
      setInstallingSlot(null)
      setInstallProgress(0)
      cb()
    }, 600)
  }

  function cancelProgress() {
    if (progressRef.current) clearInterval(progressRef.current)
    setInstallingSlot(null)
    setInstallProgress(0)
  }

  // ── Install handler wired to InstallingSlot ─────────────────
  function handleInstall(data: {
    package_key:          string
    slot_number:          number
    custom_instructions?: string
  }) {
    // find the package title for the installing slot label
    const pkgDef = n.systemPackages.find(p => p.package_key === data.package_key)
    setInstallingSlot(data.slot_number)
    setInstallingTitle(pkgDef?.title ?? "Package")
    startProgress()
    setView("grid")   // go back to grid so the user sees the animation

    n.installMutation.mutate(data, {
      onSuccess: () => finishProgress(() => {}),
      onError:   () => cancelProgress(),
    })
  }

  const canUse = balance?.can_train ?? true

  if (n.installedLoading) return (
    <DashboardLayout>
      <div className="neo-loading">
        <Loader2 className="animate-spin" size={16} /> {t("neo.loading")}
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="neo-root">

        {/* ── Header ── */}
        <div className="neo-header">
          {view !== "grid" ? (
            <button className="neo-back-btn" onClick={() => setView("grid")}>
              <ArrowLeft size={12} /> {t("neo.back")}
            </button>
          ) : (
            <div className="neo-eyebrow">{t("settings.eyebrow")}</div>
          )}
        <h1 className="neo-title">
            {t("neo.title")}
            <span className="neo-title-badge">{t("neo.badge")}</span>
          </h1>
          <p className="neo-subtitle">{t("neo.subtitle")}</p>
        </div>

        {/* ── Blocked ── */}
        {!canUse && (
          <div className="neo-blocked">
            <p>{t("nav.insufficientSouls")}</p>
          </div>
        )}

        {/* ── Grid view ── */}
        {canUse && view === "grid" && (
          <div className="neo-full-body">
            <div className="neo-section-header">
              <span className="neo-slots-label">
                {t("neo.installedCount")
                  .replace("{n}", String(n.installedCount))
                  .replace("{max}", String(n.maxPackages))}
              </span>
              <button className="neo-section-action" onClick={() => {
                const emptySlot = n.slotsList.find(s => !s.pkg)
                n.openCustom(emptySlot?.slot || 1)
                setView("custom")
              }}>
                <FlaskConical size={11} /> {t("neo.customPackageBtn")}
              </button>
            </div>

            <div className="neo-slots-grid-full">
              {n.slotsList.map(({ slot, pkg }) => {

                // ── Installing animation slot ──
                if (installingSlot === slot) {
                  return (
                    <InstallingSlot
                      key={slot}
                      slotNum={slot}
                      pkgTitle={installingTitle}
                      progress={installProgress}
                      t={t}
                    />
                  )
                }

                // ── Filled slot ──
                if (pkg) {
                  return (
                    <FilledSlot
                      key={slot}
                      pkg={pkg}
                      onEdit={() => n.openEditInstr(pkg)}
                      onUninstall={() => n.uninstallMutation.mutate(pkg.id)}
                      isDeleting={n.uninstallMutation.isPending && n.editInstrTarget?.id === pkg.id}
                      t={t}
                    />
                  )
                }

                // ── Empty slot ──
                return (
                  <EmptySlot
                    key={slot}
                    slotNum={slot}
                    onInstall={() => { n.openInstall(slot); setView("install") }}
                    onCustom={() => { n.openCustom(slot); setView("custom") }}
                    t={t}
                  />
                )
              })}
            </div>

            <div className="neo-divider" />

            <div className="neo-info-block">
              <Info size={13} />
              <span>{t("neo.infoBlock")}</span>
            </div>
          </div>
        )}

        {/* ── Install view ── */}
        {canUse && view === "install" && (
          <InstallScreen
            slotNum={n.preSelectedSlot}
            slotsList={n.slotsList}
            systemPackages={n.systemPackages}
            installedKeys={n.installedKeys}
            onInstall={handleInstall}          // ← uses the new handler
            isPending={n.installMutation.isPending}
            t={t}
          />
        )}

        {/* ── Custom view ── */}
        {canUse && view === "custom" && (
          <CustomScreen
            slotsList={n.slotsList}
            selectedSlot={n.customSlot}
            setSelectedSlot={n.setCustomSlot}
            title={n.customTitle}
            setTitle={n.setCustomTitle}
            content={n.customContent}
            setContent={n.setCustomContent}
            onCreate={() => {
              n.customMutation.mutate({
                title:       n.customTitle,
                content:     n.customContent,
                slot_number: n.customSlot,
              }, {
                onSuccess: () => setView("grid"),
              })
            }}
            onAutoCreate={(title, slot) => n.handleAutoCreate(title, slot)}
            isAutoGenerating={n.autoGenerateMutation.isPending}
            autoError={n.autoError}
            isPending={n.customMutation.isPending}
            t={t}
          />
        )}

      </div>

      {/* ── Edit instructions modal ── */}
      {canUse && n.editInstrTarget && (
        <EditInstrModal
          pkg={n.editInstrTarget}
          text={n.editInstrText}
          setText={n.setEditInstrText}
          onClose={() => { n.setEditInstrTarget(null); n.setEditInstrText("") }}
          onSave={() => n.updateInstrMutation.mutate({
            id:   n.editInstrTarget!.id,
            text: n.editInstrText,
          })}
          onDelete={() => n.uninstallMutation.mutate(n.editInstrTarget!.id)}
          isPending={n.updateInstrMutation.isPending}
          isDeleting={n.uninstallMutation.isPending}
          t={t}
        />
      )}

    </DashboardLayout>
  )
}