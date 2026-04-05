import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Loader2, Trash2 } from "lucide-react"
import { useAuthStore } from "@/store/auth"

interface Props {
  userName:         string | undefined
  deleteConfirm:    boolean
  deleteInput:      string
  isPending:        boolean
  setDeleteConfirm: (v: boolean) => void
  setDeleteInput:   (v: string) => void
  onDelete:         () => void
  t:                (key: string) => string
}

export function SettingsDangerZone({
  userName, deleteConfirm, deleteInput, isPending,
  setDeleteConfirm, setDeleteInput, onDelete, t,
}: Props) {
  const { darkMode } = useAuthStore()
  const themeClass = darkMode ? "dark-panel" : "dashboard"

  function handleClose() {
    setDeleteConfirm(false)
    setDeleteInput("")
  }

  return (
    <>
      <div className="st-card st-card-danger">
        <div className="st-card-title st-danger-title">
          <AlertTriangle style={{ width: 14, height: 14 }} /> {t("settings.dangerZone")}
        </div>
        <p className="st-card-sub">{t("settings.dangerSub")}</p>

        <button className="st-btn-danger" onClick={() => setDeleteConfirm(true)}>
          {t("settings.deleteAccount")}
        </button>
      </div>

      {createPortal(
        <div className={themeClass} style={{ display: "contents" }}>
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div
                className="neo-modal-overlay"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={handleClose}
              >
                <motion.div
                  className="neo-modal"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <p className="neo-modal-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={14} style={{ color: "#dc3545" }} /> {t("settings.dangerZone")}
                    </p>
                    <button
                      onClick={handleClose}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--imm-txt3)", padding: 4, flexShrink: 0,
                        display: "flex", alignItems: "center",
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Warning block */}
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 14px",
                    background: "rgba(220,53,69,0.06)",
                    border: "1px solid rgba(220,53,69,0.22)",
                    borderRadius: 10,
                  }}>
                    <AlertTriangle size={14} style={{ color: "#dc3545", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: "var(--imm-txt2)", lineHeight: 1.6 }}>
                      {t("settings.deleteConfirmLabel").replace("{name}", userName ?? "")}
                    </span>
                  </div>

                  {/* Input */}
                  <div>
                    <label className="neo-label">
                      {t("settings.deleteInputLabel") || "Type your name to confirm"}
                    </label>
                    <input
                      className="st-delete-input"
                      value={deleteInput}
                      onChange={e => setDeleteInput(e.target.value)}
                      placeholder={userName}
                      autoFocus
                    />
                  </div>

                  {/* Actions */}
                  <div className="neo-modal-actions" style={{ justifyContent: "flex-end" }}>
                    <button className="neo-btn-ghost" onClick={handleClose} disabled={isPending}>
                     {t("settings.deleteCancel")}
                    </button>
                    <button
                      className="neo-btn-danger"
                      onClick={onDelete}
                      disabled={deleteInput.trim() !== userName || isPending}
                    >
                      {isPending
                        ? <><Loader2 size={13} className="animate-spin" /> {t("settings.deleteConfirm")}</>
                        : <><Trash2 size={13} /> {t("settings.deleteConfirm")}</>
                      }
                    </button>
                  </div>

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </>
  )
}