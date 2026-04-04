/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion"
import { Plus, X, Check } from "lucide-react"
import { Step } from "@/hooks/useSurveyWizard"

interface Props {
  current:        Step
  inputRef:       React.RefObject<HTMLInputElement | HTMLSelectElement | null>
  getValue:       (id: string) => any
  setValue:       (id: string, val: any) => void
  handleKeyDown:  (e: React.KeyboardEvent) => void
  goNext:         () => void
  getList:        () => string[]
  updateListItem: (idx: number, val: string) => void
  addListItem:    () => void
  removeListItem: (idx: number) => void
  t:              (key: string) => string
}

export function SurveyStepInput({
  current, inputRef, getValue, setValue,
  handleKeyDown, goNext,
  getList, updateListItem, addListItem, removeListItem,
  t,
}: Props) {
  return (
    <div className="sv-wiz-input-wrap">

      {/* Text / Number */}
      {(current.type === "text" || current.type === "number") && (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          className="sv-wiz-input"
          type={current.type === "number" ? "number" : "text"}
          value={getValue(current.id)}
          onChange={e => setValue(current.id, e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={current.placeholder || ""}
          min={current.type === "number" ? 1 : undefined}
          max={current.type === "number" ? 120 : undefined}
          autoComplete="off"
        />
      )}

      {/* Select */}
      {current.type === "select" && (
        <div className="sv-wiz-select-wrap">
          {current.options?.map(opt => (
            <button
              key={opt}
              className={`sv-wiz-option ${getValue(current.id) === opt ? "selected" : ""}`}
              onClick={() => { setValue(current.id, opt); setTimeout(goNext, 280) }}
            >
              <span>{opt}</span>
              <span
                className="sv-wiz-option-check"
                style={{
                  opacity:    getValue(current.id) === opt ? 1 : 0,
                  transform:  getValue(current.id) === opt ? "scale(1)" : "scale(0)",
                  transition: "opacity 0.15s, transform 0.15s",
                }}
              >
                <Check style={{ width: 12, height: 12 }} />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Multi-text */}
      {current.type === "multi_text" && (
        <div className="sv-wiz-multitext">
          {getList().map((val, idx) => (
            <motion.div
              key={idx}
              className="sv-wiz-multitext-row"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <input
                ref={idx === 0 ? inputRef as React.RefObject<HTMLInputElement> : undefined}
                className="sv-wiz-input"
                value={val}
                onChange={e => updateListItem(idx, e.target.value)}
                placeholder={current.placeholder}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    if (idx === getList().length - 1 && val.trim()) addListItem()
                  }
                }}
              />
              {getList().length > 1 && (
                <button className="sv-wiz-remove" onClick={() => removeListItem(idx)} type="button">
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
            </motion.div>
          ))}
          <button className="sv-wiz-add-row" onClick={addListItem} type="button">
            <Plus style={{ width: 12, height: 12 }} /> {t("survey.addAnotherPlace")}
          </button>
        </div>
      )}

    </div>
  )
}