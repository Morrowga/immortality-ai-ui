import { useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Pencil, Trash2, FlaskConical, AlertTriangle, Loader2 } from "lucide-react"
import { NeoPackage } from "@/lib/api"
import { PkgIcon } from "./PkgIcon"
import { useAuthStore } from "@/store/auth"

interface FilledSlotProps {
  pkg:         NeoPackage
  onEdit:      () => void
  onUninstall: () => void
  isDeleting?: boolean
  t:           (key: string) => string
}

export function FilledSlot({ pkg, onEdit, onUninstall, isDeleting, t }: FilledSlotProps) {
  const [confirm, setConfirm] = useState(false)
  const { darkMode } = useAuthStore()
  const themeClass = darkMode ? "dark-panel" : "dashboard"

  return (
    <>
      <div className="neo-slot filled">
        <span className="neo-slot-number">
          {t("neo.slotLabel").replace("{n}", String(pkg.slot_number))}
        </span>

        <div className="neo-slot-pkg-header">
          <div className="neo-slot-pkg-icon">
            <PkgIcon packageKey={pkg.package_key} />
          </div>
          <div className="neo-slot-pkg-info">
            <p className="neo-slot-pkg-title">{pkg.title}</p>
            <p className={`neo-slot-pkg-type ${pkg.package_type === "custom" ? "custom" : ""}`}>
              {pkg.package_type === "custom" ? t("neo.typeCustom") : t("neo.typeSystem")}
            </p>
          </div>
          <div className="neo-slot-pkg-actions">
            <button
              className="neo-slot-action-btn"
              onClick={onEdit}
              title={t("neo.editInstrTitle")}
              disabled={isDeleting}
            >
              <Pencil size={11} />
            </button>
            <button
              className="neo-slot-action-btn danger"
              onClick={() => setConfirm(true)}
              title={t("neo.removeTitle")}
              disabled={isDeleting}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {pkg.description && (
          <p className="neo-slot-pkg-desc">{pkg.description}</p>
        )}

        {pkg.custom_instructions && pkg.package_type === "system" && (
          <div className="neo-instr-section" style={{ padding: "8px 10px", marginTop: 2 }}>
            <p className="neo-instr-title" style={{ fontSize: 9, marginBottom: 4 }}>
              {t("neo.customFocus")}
            </p>
            <p className="neo-instr-text" style={{ fontSize: 11 }}>
              {pkg.custom_instructions.slice(0, 80)}
              {pkg.custom_instructions.length > 80 ? "…" : ""}
            </p>
          </div>
        )}

        {pkg.package_type === "custom" && (
          <div className="neo-slot-custom-tag">
            <FlaskConical size={9} /> {t("neo.yourKnowledge")}
          </div>
        )}
      </div>

      {/* Delete confirm portal */}
      {confirm && createPortal(
        <div className={themeClass} style={{ display: "contents" }}>
          <AnimatePresence>
            <motion.div
              className="neo-modal-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setConfirm(false)}
            >
              <motion.div
                className="neo-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: "rgba(220,53,69,0.08)",
                    border: "1px solid rgba(220,53,69,0.22)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Trash2 size={15} style={{ color: "#dc3545" }} />
                  </div>
                  <div>
                    <p className="neo-modal-title" style={{ margin: "0 0 6px" }}>
                      {t("neo.uninstallTitle")}
                    </p>
                    <p className="neo-modal-sub" style={{ margin: 0 }}>
                      {t("neo.uninstallBody")
                        .replace("{title}", pkg.title)
                        .replace("{n}", String(pkg.slot_number))}
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: "10px 13px",
                  background: "rgba(220,53,69,0.05)",
                  border: "1px solid rgba(220,53,69,0.15)",
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <AlertTriangle size={13} style={{ color: "#dc3545", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--imm-txt3)", lineHeight: 1.5 }}>
                    {t("neo.uninstallWarning")}
                  </span>
                </div>

                <div className="neo-modal-actions">
                  <button
                    className="neo-btn-ghost"
                    onClick={() => setConfirm(false)}
                    disabled={isDeleting}
                  >
                    {t("neo.keepIt")}
                  </button>
                  <button
                    className="neo-btn-danger"
                    onClick={() => { onUninstall(); setConfirm(false) }}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? <><Loader2 size={13} className="animate-spin" /> {t("neo.removing")}</>
                      : <><Trash2 size={13} /> {t("neo.uninstall")}</>
                    }
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </>
  )
}