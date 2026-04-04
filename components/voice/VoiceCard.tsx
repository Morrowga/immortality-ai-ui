/* eslint-disable @typescript-eslint/no-unused-vars */
import { motion } from "framer-motion"
import { Mic, Trash2, CheckCircle2, Loader2, RotateCcw } from "lucide-react"
import { Slot, SlotStatus, formatDuration } from "@/hooks/useVoice"

interface Props {
  slot:          Slot
  label:         string
  status:        SlotStatus
  isOptional:    boolean
  onTrain:       () => void
  onRetrain:     () => void
  onDelete:      () => void
  deleteLoading: boolean
}

export function VoiceCard({ slot, label, status, isOptional, onTrain, onRetrain, onDelete, deleteLoading }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`v-card ${status.trained ? "trained" : ""} ${isOptional && !status.trained ? "optional" : ""}`}
    >
      <div className="v-card-header">
        <div className="v-card-lang">
          <span className="v-card-lang-name">{label}</span>
        </div>
        {status.trained ? (
          <span className="v-card-badge trained"><CheckCircle2 /> Trained</span>
        ) : isOptional ? (
          <span className="v-card-badge optional">Optional</span>
        ) : null}
      </div>

      {status.trained ? (
        <div className="v-card-trained-info">
          <p className="v-card-duration">
            Sample: <strong>{status.duration_seconds ? formatDuration(Math.round(status.duration_seconds)) : "—"}</strong>
            {status.created_at && <> · {new Date(status.created_at).toLocaleDateString()}</>}
          </p>
          <div className="v-card-actions">
            <button className="v-btn-ghost" onClick={onRetrain}><RotateCcw /> Retrain</button>
            <button className="v-btn-danger" onClick={onDelete} disabled={deleteLoading}>
              {deleteLoading ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="v-card-empty">
          <p className="v-card-empty-text">
            {isOptional
              ? "Add an English voice sample so your agent sounds like you in English too."
              : "Record your voice so your agent can speak exactly like you."}
          </p>
          <button className="v-btn-primary" onClick={onTrain}>
            <Mic /> Train {label} voice
          </button>
        </div>
      )}
    </motion.div>
  )
}