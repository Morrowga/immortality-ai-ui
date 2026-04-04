import { Loader2, RotateCcw, Check, ChevronDown, ChevronUp, Star } from "lucide-react"

interface Extracted {
  what_happened:          string
  what_happened_original: string
  how_i_felt:             string
  why_it_mattered:        string
  what_i_learned:         string
  instinct_formed:        string
  section:                string
  is_core_memory:         boolean
  pattern_tags:           string[]
  suggested_weight:       number
}

interface Props {
  extracted:      Extracted
  weight:         number
  setWeight:      (v: number) => void
  showDetails:    boolean
  setShowDetails: (v: boolean) => void
  isPending:      boolean
  onConfirm:      () => void
  onReset:        () => void
  t:              (key: string) => string
}

export function TrainingReview({
  extracted, weight, setWeight,
  showDetails, setShowDetails,
  isPending, onConfirm, onReset, t,
}: Props) {
  const FIELDS = [
    { label: t("train.fieldWhatHappened"),  value: extracted.what_happened   },
    { label: t("train.fieldHowFelt"),       value: extracted.how_i_felt      },
    { label: t("train.fieldWhyMattered"),   value: extracted.why_it_mattered },
    { label: t("train.fieldWhatLearned"),   value: extracted.what_i_learned  },
    { label: t("train.fieldInstinct"),      value: extracted.instinct_formed },
  ]

  return (
    <>
      <div className="t-review-grid t-fu">

        {/* Left: captured fields */}
        <div className="t-capture-card">
          <div className="imm-label">{t("train.captured")}</div>
          {FIELDS.map(item => (
            <div className="t-capture-row" key={item.label}>
              <div className="t-capture-label">{item.label}</div>
              <div className="t-capture-value">{item.value}</div>
            </div>
          ))}

          {/* Original language toggle */}
          {extracted.what_happened_original !== extracted.what_happened && (
            <>
              <button
                className="t-original-toggle"
                onClick={() => setShowDetails(!showDetails)}
              >
                {t("train.originalVersion")}
                {showDetails
                  ? <ChevronUp style={{ width: 13, height: 13 }} />
                  : <ChevronDown style={{ width: 13, height: 13 }} />}
              </button>
              {showDetails && (
                <p className="t-original-text">{extracted.what_happened_original}</p>
              )}
            </>
          )}
        </div>

        {/* Right: weight + meta + tags */}
        <div className="t-side-panel">

          <div className="t-weight-card">
            <div className="t-weight-header">
              <span className="t-weight-title">{t("train.memoryWeight")}</span>
              <span className="t-weight-value">
                {weight.toFixed(1)}<span>/10</span>
              </span>
            </div>
            <input
              type="range"
              className="t-slider"
              min={1} max={10} step={0.1}
              value={weight}
              onChange={e => setWeight(parseFloat(e.target.value))}
            />
            <div className="t-slider-labels">
              <span>{t("train.minor")}</span>
              <span>{t("train.lifeDefining")}</span>
            </div>
            {weight >= 8.5 && (
              <div className="t-never-forget">
                <Star style={{ width: 12, height: 12 }} />
                {t("train.neverForget")}
              </div>
            )}
          </div>

          <div className="t-meta-card">
            <div className="t-meta-row">
              <span className="t-meta-key">{t("train.metaSection")}</span>
              <span className="t-meta-val">{extracted.section}</span>
            </div>
            {extracted.is_core_memory && (
              <div className="t-meta-row">
                <span className="t-meta-key">{t("train.metaType")}</span>
                <span className="t-meta-val core">{t("train.coreMemory")}</span>
              </div>
            )}
          </div>

          {extracted.pattern_tags?.length > 0 && (
            <div className="t-tags">
              {extracted.pattern_tags.map((tag: string) => (
                <span className="t-tag" key={tag}>{tag}</span>
              ))}
            </div>
          )}

        </div>
      </div>

      <div className="t-review-actions t-fu">
        <button className="t-btn-ghost" onClick={onReset}>
          <RotateCcw /> {t("train.startOver")}
        </button>
        <button className="t-btn-primary" onClick={onConfirm} disabled={isPending}>
          {isPending ? (
            <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> {t("train.saving")}</>
          ) : (
            <><Check style={{ width: 15, height: 15 }} /> {t("train.confirmSave")}</>
          )}
        </button>
      </div>
    </>
  )
}