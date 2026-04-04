import { Check, BookOpen } from "lucide-react"

interface DoneResult {
  duplicate:            boolean
  existing_memory?:     string
  reinforcement_count?: number
  new_weight?:          number
}

interface Props {
  doneResult: DoneResult
  onReset:    () => void
  t:          (key: string) => string
}

export function TrainingDone({ doneResult, onReset, t }: Props) {
  return (
    <div className="t-done-wrap t-fu">
      <div className="t-done-card">
        <div className="t-done-icon"><Check /></div>

        {doneResult.duplicate ? (
          <>
            <div className="t-done-label">{t("train.reinforced")}</div>
            <p className="t-reinforced-text">{doneResult.existing_memory}</p>
            <p className="t-reinforced-meta">
              {t("train.reinforcedMeta")
                .replace("{count}", String(doneResult.reinforcement_count))
                .replace("{weight}", doneResult.new_weight?.toFixed(1) ?? "")}
            </p>
          </>
        ) : (
          <div className="t-done-label">{t("train.savedSuccess")}</div>
        )}
      </div>

      <div className="t-done-actions">
        <button className="t-btn-primary" onClick={onReset}>
          <BookOpen style={{ width: 15, height: 15 }} /> {t("train.trainAnother")}
        </button>
      </div>
    </div>
  )
}