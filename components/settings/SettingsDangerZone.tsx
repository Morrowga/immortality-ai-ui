import { motion } from "framer-motion"
import { AlertTriangle, X, Loader2 } from "lucide-react"

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
  return (
    <div className="st-card st-card-danger">
      <div className="st-card-title st-danger-title">
        <AlertTriangle style={{ width: 14, height: 14 }} /> {t("settings.dangerZone")}
      </div>
      <p className="st-card-sub">{t("settings.dangerSub")}</p>

      {!deleteConfirm ? (
        <button className="st-btn-danger" onClick={() => setDeleteConfirm(true)}>
          {t("settings.deleteAccount")}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="st-delete-confirm"
        >
          <p className="st-delete-label">
            {t("settings.deleteConfirmLabel").replace("{name}", userName ?? "")}
          </p>
          <input
            className="st-delete-input"
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            placeholder={userName}
            autoFocus
          />
          <div className="st-slug-edit-actions">
            <button className="st-btn-ghost"
              onClick={() => { setDeleteConfirm(false); setDeleteInput("") }}>
              <X style={{ width: 13, height: 13 }} /> {t("settings.deleteCancel")}
            </button>
            <button
              className="st-btn-danger"
              onClick={onDelete}
              disabled={deleteInput.trim() !== userName || isPending}
            >
              {isPending && <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />}
              {t("settings.deleteConfirm")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}