import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Loader2, Check, Trash2, AlertTriangle, X } from "lucide-react"
import { NeoPackage } from "@/lib/api"
import { useAuthStore } from "@/store/auth"

interface EditInstrModalProps {
  pkg:         NeoPackage
  text:        string
  setText:     (s: string) => void
  onClose:     () => void
  onSave:      () => void
  onDelete?:   () => void
  isPending:   boolean
  isDeleting?: boolean
  t:           (key: string) => string
}

export function EditInstrModal({
  pkg, text, setText, onClose, onSave, onDelete,
  isPending, isDeleting, t,
}: EditInstrModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { darkMode } = useAuthStore()

  const themeClass = darkMode ? "dark-panel" : "dashboard"

  const MAX = pkg.package_type === "custom" ? 8000 : 2000
  const count = text.length
  const countClass = count > MAX ? "over" : count > MAX * 0.85 ? "warn" : ""
  const anyPending = isPending || isDeleting

  return createPortal(
    <div className={themeClass} style={{ display: "contents" }}>
      <motion.div
        className="neo-modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="neo-modal neo-modal-wide"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <p className="neo-modal-title" style={{ margin: 0 }}>
              {pkg.package_type === "custom" ? t("neo.editContent") : t("neo.editInstructions")} — {pkg.title}
            </p>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--imm-txt3)", padding: 4, flexShrink: 0,
                display: "flex", alignItems: "center",
              }}
            >
              <X size={15} />
            </button>
          </div>

          {pkg.package_type === "system" && (
            <p className="neo-modal-sub">
              {t("neo.domainWarning").replace("{title}", pkg.title)}
            </p>
          )}

          {/* Textarea */}
          <div>
            <label className="neo-label">
              {pkg.package_type === "custom" ? t("neo.knowledgeContent") : t("neo.customInstructions")}
            </label>
            <textarea
              className="neo-textarea"
              style={{ minHeight: 140 }}
              placeholder={
                pkg.package_type === "custom"
                  ? t("neo.knowledgeContentPlaceholder")
                  : t("neo.instrPlaceholder").replace("{title}", pkg.title)
              }
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              autoFocus
            />
            <p className={`neo-char-count ${countClass}`} style={{ paddingTop: 4 }}>{count} / {MAX}</p>
          </div>

          {/* Delete confirm — inline */}
          <AnimatePresence>
            {confirmDelete && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "rgba(220,53,69,0.06)",
                  border: "1px solid rgba(220,53,69,0.22)",
                  borderRadius: 10,
                }}>
                  <AlertTriangle size={14} style={{ color: "#dc3545", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--imm-txt2)", flex: 1, lineHeight: 1.5 }}>
                    {t("neo.uninstallConfirm").replace("{title}", pkg.title)}
                  </span>
                  <button
                    className="neo-btn-ghost"
                    style={{ padding: "5px 12px", fontSize: 12 }}
                    onClick={() => setConfirmDelete(false)}
                    disabled={anyPending}
                  >
                    {t("neo.keep")}
                  </button>
                  <button
                    className="neo-btn-danger"
                    style={{ padding: "5px 12px", fontSize: 12 }}
                    onClick={onDelete}
                    disabled={anyPending}
                  >
                    {isDeleting
                      ? <><Loader2 size={12} className="animate-spin" /> {t("neo.removing")}</>
                      : <><Trash2 size={12} /> {t("neo.uninstall")}</>
                    }
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="neo-modal-actions" style={{ justifyContent: "space-between" }}>
            {onDelete && !confirmDelete && (
              <button
                className="neo-btn-danger"
                style={{ padding: "7px 14px", fontSize: 12 }}
                onClick={() => setConfirmDelete(true)}
                disabled={anyPending}
              >
                <Trash2 size={12} /> {t("neo.uninstall")}
              </button>
            )}
            {confirmDelete && <div />}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="neo-btn-ghost" onClick={onClose} disabled={anyPending}>
                {t("neo.cancel")}
              </button>
              <button
                className="neo-btn-primary"
                onClick={onSave}
                disabled={anyPending || count > MAX}
              >
                {isPending
                  ? <><Loader2 size={13} className="animate-spin" /> {t("neo.saving")}</>
                  : <><Check size={13} /> {t("neo.save")}</>
                }
              </button>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </div>,
    document.body
  )
}