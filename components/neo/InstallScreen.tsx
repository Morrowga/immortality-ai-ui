import { useState, useMemo } from "react"
import { Loader2, Zap, AlertTriangle, Info, Check, Search } from "lucide-react"
import { NeoPackage, SystemPackageDef } from "@/lib/api"
import { PkgIcon } from "./PkgIcon"

interface Props {
  slotNum:        number
  slotsList:      { slot: number; pkg: NeoPackage | null }[]
  systemPackages: SystemPackageDef[]
  installedKeys:  string[]
  onInstall:      (data: { package_key: string; slot_number: number; custom_instructions?: string }) => void
  isPending:      boolean
  t:              (key: string) => string
}

export function InstallScreen({
  slotNum, slotsList, systemPackages, installedKeys,
  onInstall, isPending, t,
}: Props) {
  const [selectedPkg, setSelectedPkg]               = useState<SystemPackageDef | null>(null)
  const [selectedSlot, setSelectedSlot]             = useState<number>(slotNum)
  const [customInstructions, setCustomInstructions] = useState("")
  const [search, setSearch]                         = useState("")

  const MAX = 2000
  const count = customInstructions.length
  const countClass = count > MAX ? "over" : count > MAX * 0.85 ? "warn" : ""
  const occupying = slotsList.find(s => s.slot === selectedSlot)?.pkg ?? null

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return systemPackages
    return systemPackages.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.example_topics?.some(tp => tp.toLowerCase().includes(q))
    )
  }, [search, systemPackages])

  return (
    <div className="neo-full-body" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 4, flexShrink: 0 }}>
        <Search size={12} style={{
          position: "absolute", left: 12, top: "50%",
          transform: "translateY(-50%)",
          color: "var(--imm-txt3)", pointerEvents: "none",
        }} />
        <input
          className="neo-input"
          style={{ paddingLeft: 34 }}
          placeholder={t("neo.searchPlaceholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Package list */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0,
        display: "flex", flexDirection: "column", gap: 6,
        paddingRight: 2, marginBottom: 16,
        boxSizing: "border-box", width: "100%",
      }}>
        {filtered.length === 0 ? (
          <div className="neo-empty" style={{ padding: "24px 0" }}>
            {t("neo.noPackagesMatch").replace("{search}", search)}
          </div>
        ) : (
          filtered.map(pkg => {
            const alreadyInstalled = installedKeys.includes(pkg.package_key)
            const isSelected       = selectedPkg?.package_key === pkg.package_key

            return (
              <button
                key={pkg.package_key}
                className={`neo-pkg-row${isSelected ? " selected" : ""}`}
                onClick={() => !alreadyInstalled && setSelectedPkg(isSelected ? null : pkg)}
                disabled={alreadyInstalled}
              >
                <div className="neo-slot-pkg-icon" style={{ flexShrink: 0, marginTop: 1 }}>
                  <PkgIcon packageKey={pkg.package_key} size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--imm-txt)" }}>
                      {pkg.title}
                    </span>
                    {alreadyInstalled && (
                      <span style={{
                        fontSize: 8, fontWeight: 600, letterSpacing: "0.10em",
                        textTransform: "uppercase", color: "var(--imm-txt2)",
                        background: "rgba(59,130,246,0.10)",
                        border: "1px solid rgba(59,130,246,0.20)",
                        borderRadius: 4, padding: "1px 6px",
                      }}>{t("neo.installedBadge")}</span>
                    )}
                    {pkg.sensitive && !alreadyInstalled && (
                      <span className="neo-sensitive-tag">
                        <AlertTriangle size={8} /> {t("neo.sensitiveBadge")}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: "var(--imm-txt3)", fontWeight: 300, margin: 0, lineHeight: 1.6 }}>
                    {pkg.description}
                  </p>
                  {pkg.example_topics && pkg.example_topics.length > 0 && (
                    <p style={{ fontSize: 9, color: "var(--imm-txt3)", margin: "4px 0 0", opacity: 0.55, fontWeight: 300 }}>
                      e.g. {pkg.example_topics.slice(0, 3).join(", ")}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <Check size={13} style={{ color: "var(--imm-matrix)", flexShrink: 0, marginTop: 2 }} />
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Bottom panel */}
      {selectedPkg && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>

          {selectedPkg.sensitive && (
            <div className="neo-warn-block">
              <AlertTriangle size={13} />
              {t("neo.sensitiveWarning")}
            </div>
          )}

          <div>
            <p className="neo-slot-picker-label">{t("neo.chooseSlot")}</p>
            <div className="neo-slot-picker">
              {slotsList.map(({ slot, pkg: existing }) => (
                <button
                  key={slot}
                  className={`neo-slot-pick-btn${selectedSlot === slot ? " selected" : ""}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <span className="neo-slot-pick-num">{String(slot).padStart(2,"0")}</span>
                  <span className="neo-slot-pick-status">
                    {existing ? existing.title.slice(0, 7) + "…" : t("neo.slotEmpty")}
                  </span>
                </button>
              ))}
            </div>
            {occupying && (
              <div className="neo-warn-block" style={{ marginTop: 8 }}>
                <AlertTriangle size={13} />
                {t("neo.slotWillReplace")
                  .replace("{n}", String(selectedSlot))
                  .replace("{title}", occupying.title)}
              </div>
            )}
          </div>

          <div>
            <label className="neo-label">
              {t("neo.customInstructions")}{" "}
              <span style={{ opacity: 0.45, fontWeight: 300, textTransform: "none", letterSpacing: 0 }}>
                {t("neo.customInstrOptional")}
              </span>
            </label>
            <textarea
              className="neo-textarea"
              placeholder={t("neo.customInstrPlaceholder").replace("{title}", selectedPkg.title)}
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              rows={2}
            />
            <p className={`neo-char-count${countClass ? " " + countClass : ""}`} style={{ paddingTop: 4 }}>
              {count} / {MAX}
            </p>
          </div>

          <div className="neo-info-block">
            <Info size={13} />
            {t("neo.customInstrInfo").replace("{title}", selectedPkg.title)}
          </div>

          <div className="neo-modal-actions">
            <button
              className="neo-btn-primary"
              onClick={() => onInstall({
                package_key:         selectedPkg!.package_key,
                slot_number:         selectedSlot,
                custom_instructions: customInstructions || undefined,
              })}
              disabled={isPending || count > MAX}
            >
              {isPending
                ? <><Loader2 size={12} className="animate-spin" /> {t("neo.installing")}</>
                : <><Zap size={12} /> {t("neo.installPackage")}</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}