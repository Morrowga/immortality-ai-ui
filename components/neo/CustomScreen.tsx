import { useState } from "react"
import { Loader2, FlaskConical, Info, Sparkles } from "lucide-react"
import { NeoPackage } from "@/lib/api"

interface Props {
  slotsList:        { slot: number; pkg: NeoPackage | null }[]
  selectedSlot:     number
  setSelectedSlot:  (n: number) => void
  title:            string
  setTitle:         (s: string) => void
  content:          string
  setContent:       (s: string) => void
  onCreate:         () => void
  onAutoCreate:     (title: string, slot: number) => void
  isAutoGenerating: boolean
  autoError:        string | null
  isPending:        boolean
  t:                (key: string) => string
}

export function CustomScreen({
  slotsList, selectedSlot, setSelectedSlot,
  title, setTitle, content, setContent,
  onCreate, onAutoCreate, isAutoGenerating, autoError,
  isPending, t,
}: Props) {
  const [autoMode, setAutoMode] = useState(false)

  const MAX = 8000
  const MIN = 300
  const count = content.length
  const countClass = count > MAX ? "over" : count > MAX * 0.85 ? "warn" : ""
  const manualValid = title.trim().length > 0 && count >= MIN && count <= MAX
  const autoValid   = title.trim().length >= 3
  const anyPending  = isPending || isAutoGenerating

  return (
    <div className="neo-full-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Title + Auto Instruction toggle */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, alignItems: "flex-end" }}>
        <div>
          <label className="neo-label">{t("neo.packageTitle")}</label>
          <input
            className="neo-input"
            placeholder="e.g. Muay Thai Training, Stoic Philosophy…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 40,
          padding: "0 12px",
          borderRadius: 10,
          border: autoMode ? "1px solid rgba(0,255,65,0.3)" : "1px solid var(--imm-bdr)",
          background: autoMode ? "rgba(0,255,65,0.05)" : "transparent",
          cursor: "pointer",
          userSelect: "none",
          transition: "all 0.18s",
        }}>
          <input
            type="checkbox"
            checked={autoMode}
            onChange={e => setAutoMode(e.target.checked)}
            style={{ accentColor: "var(--imm-matrix)", width: 13, height: 13, cursor: "pointer" }}
          />
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: autoMode ? "var(--imm-matrix)" : "var(--imm-txt3)",
            fontFamily: "'Oxanium', sans-serif",
            whiteSpace: "nowrap",
          }}>
            {t("neo.autoInstruction")}
          </span>
        </label>
      </div>

      {autoMode && autoError && (
        <p style={{ fontSize: 11, color: "#dc3545", marginTop: -8, paddingLeft: 2, lineHeight: 1.5 }}>
          ⚠ {autoError}
        </p>
      )}
      {autoMode && !autoError && title.trim().length > 0 && (
        <p style={{ fontSize: 11, color: "var(--imm-txt3)", marginTop: -8, paddingLeft: 2, fontWeight: 300 }}>
          {t("neo.autoInstrHint")}
        </p>
      )}

      {/* Slot picker */}
      <div>
        <p className="neo-slot-picker-label">{t("neo.chooseSlot")}</p>
        <div className="neo-slot-picker">
          {slotsList.map(({ slot, pkg }) => (
            <button
              key={slot}
              className={`neo-slot-pick-btn ${selectedSlot === slot ? "selected" : ""}`}
              onClick={() => setSelectedSlot(slot)}
            >
              <span className="neo-slot-pick-num">{slot}</span>
              <span className="neo-slot-pick-status">
                {pkg ? t("neo.slotReplace") : t("neo.slotEmpty")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual content */}
      {!autoMode && (
        <div>
          <label className="neo-label">
            {t("neo.knowledgeLabel")}
            <span style={{ opacity: 0.5, fontWeight: 300, textTransform: "none", marginLeft: 6 }}>
              {t("neo.knowledgeCharRange")
                .replace("{min}", String(MIN))
                .replace("{max}", String(MAX))}
            </span>
          </label>
          <textarea
            className="neo-textarea"
            style={{ minHeight: 200 }}
            placeholder={t("neo.knowledgePlaceholder")}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={10}
          />
          <p className={`neo-char-count ${countClass}`} style={{ paddingTop: 4 }}>
            {count} / {MAX}
            {count < MIN && count > 0 && (
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                {t("neo.needMoreChars").replace("{n}", String(MIN - count))}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="neo-info-block">
        <Info size={14} />
        {autoMode ? t("neo.autoInfo") : t("neo.manualInfo")}
      </div>

      {/* Actions */}
      <div className="neo-modal-actions" style={{ justifyContent: "flex-end" }}>
        {autoMode ? (
          <button
            className="neo-btn-primary"
            onClick={() => onAutoCreate(title, selectedSlot)}
            disabled={anyPending || !autoValid}
          >
            {isAutoGenerating
              ? <><Loader2 size={13} className="animate-spin" /> {t("neo.generating")}</>
              : <><Sparkles size={13} /> {t("neo.generateInstall")}</>
            }
          </button>
        ) : (
          <button
            className="neo-btn-primary"
            onClick={onCreate}
            disabled={anyPending || !manualValid}
          >
            {isPending
              ? <><Loader2 size={13} className="animate-spin" /> {t("neo.creating")}</>
              : <><FlaskConical size={13} /> {t("neo.createPackage")}</>
            }
          </button>
        )}
      </div>

    </div>
  )
}