import { Loader2, BookOpen } from "lucide-react"

interface Props {
  text:      string
  setText:   (v: string) => void
  isPending: boolean
  onSubmit:  () => void
  t:         (key: string) => string
}

export function TrainingInput({ text, setText, isPending, onSubmit, t }: Props) {
  return (
    <div className="t-input-wrap t-fu">
      <div className="t-textarea-card">
        <textarea
          className="t-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t("train.placeholder")}
          rows={9}
        />
        <div className="t-textarea-footer">
          <span className="t-char-count">
            {t("train.characters").replace("{n}", String(text.length))}
          </span>
          <button
            className="t-btn-primary"
            onClick={onSubmit}
            disabled={!text.trim() || isPending}
          >
            {isPending ? (
              <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> {t("train.processing")}</>
            ) : (
              <><BookOpen style={{ width: 15, height: 15 }} /> {t("train.processMemory")}</>
            )}
          </button>
        </div>
      </div>
      <p className="t-hint">{t("train.languageNote")}</p>
    </div>
  )
}