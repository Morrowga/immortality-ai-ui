import { motion } from "framer-motion"
import { Mic, Square, CheckCircle2, Loader2, X } from "lucide-react"
import { RecordState, TemplateSection, formatDuration } from "@/hooks/useVoice"

interface Props {
  panelRef:       React.RefObject<HTMLDivElement>
  activeTemplate: TemplateSection
  recordState:    RecordState
  duration:       number
  audioUrl:       string | null
  removeBg:       boolean
  setRemoveBg:    (v: boolean) => void
  isPending:      boolean
  onStart:        () => void
  onStop:         () => void
  onReset:        () => void
  onClose:        () => void
  onSubmit:       () => void
}

export function VoiceRecordPanel({
  panelRef, activeTemplate, recordState, duration, audioUrl,
  removeBg, setRemoveBg, isPending,
  onStart, onStop, onReset, onClose, onSubmit,
}: Props) {
  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="v-panel"
    >
      <div className="v-panel-header">
        <span className="v-panel-title">
          {recordState === "done"
            ? "Voice cloned successfully"
            : `Training — ${activeTemplate.language_name} voice`}
        </span>
        <button className="v-btn-ghost" onClick={onClose} style={{ padding: "5px 8px" }}>
          <X />
        </button>
      </div>

      <div className="v-panel-body">
        <div className="v-template-block">
          <div className="v-template-instruction">{activeTemplate.instruction}</div>
          <p className="v-template-text">{activeTemplate.text}</p>
        </div>

        <div className="v-record-area">
          {(recordState === "idle" || recordState === "recording") && (
            <button
              className={`v-record-btn ${recordState === "recording" ? "recording" : ""}`}
              onClick={recordState === "idle" ? onStart : onStop}
            >
              {recordState === "recording" ? <Square /> : <Mic />}
            </button>
          )}
          {recordState === "recording" && (
            <div className="v-duration">
              <div className="v-duration-dot" />
              <span className="v-duration-time">{formatDuration(duration)}</span>
            </div>
          )}
          <p className="v-state-label">
            {recordState === "idle"      && "Tap the mic to start recording"}
            {recordState === "recording" && "Recording… tap to stop"}
            {recordState === "recorded"  && `${formatDuration(duration)} recorded — ready to clone`}
            {recordState === "cloning"   && "Cloning your voice…"}
            {recordState === "done"      && "Your agent will now speak in your voice"}
          </p>
          {(recordState === "recorded" || recordState === "done") && audioUrl && (
            <audio controls src={audioUrl} className="v-audio-preview" />
          )}
        </div>

        {recordState === "recorded" && (
          <div className="v-panel-footer">
            <label className="v-noise-toggle">
              <input type="checkbox" checked={removeBg} onChange={e => setRemoveBg(e.target.checked)} />
              Remove background noise
            </label>
            <div className="v-panel-submit-row">
              <button className="v-rerecord-btn" onClick={onReset}>Re-record</button>
              <button className="v-btn-primary" onClick={onSubmit}
                disabled={isPending || duration < 30}>
                {isPending
                  ? <><Loader2 className="animate-spin" /> Cloning…</>
                  : <><CheckCircle2 /> Clone my voice</>}
              </button>
            </div>
          </div>
        )}

        {recordState === "done" && (
          <div className="v-panel-footer">
            <span />
            <div className="v-panel-submit-row">
              <button className="v-rerecord-btn" onClick={onReset}>Record again to improve</button>
              <button className="v-btn-ghost" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}