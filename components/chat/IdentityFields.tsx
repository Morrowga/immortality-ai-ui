import { Gender } from "@/hooks/useChat"

interface Props {
  nameInput:          string
  setNameInput:       (v: string) => void
  gender:             Gender | null
  setGender:          (g: Gender) => void
  speakerAgeInput:    string
  setSpeakerAgeInput: (v: string) => void
  fieldErr:           string | null
  setFieldErr:        (e: string | null) => void
  isPending:          boolean
  onEnter:            () => void
}

export function IdentityFields({
  nameInput, setNameInput,
  gender, setGender,
  speakerAgeInput, setSpeakerAgeInput,
  fieldErr, setFieldErr,
  isPending, onEnter,
}: Props) {
  return (
    <>
      <div className="c-id-section">
        <div className="c-id-label">Your name <span className="c-required">*</span></div>
        <input
          className="c-id-input"
          type="text"
          placeholder="e.g. Ko Aung"
          value={nameInput}
          onChange={e => { setNameInput(e.target.value); setFieldErr(null) }}
          onKeyDown={e => { if (e.key === "Enter") onEnter() }}
          autoFocus
          disabled={isPending}
        />
      </div>

      <div className="c-id-section">
        <div className="c-id-label">Your gender <span className="c-required">*</span></div>
        <div className="c-chip-row">
          {(["male", "female", "other"] as Gender[]).map(g => (
            <button
              key={g}
              className={`c-chip ${gender === g ? "selected" : ""}`}
              onClick={() => { setGender(g); setFieldErr(null) }}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="c-id-section">
        <div className="c-id-label">Your age <span className="c-required">*</span></div>
        <input
          className="c-id-input c-age-input"
          type="number"
          min={1}
          max={120}
          placeholder="e.g. 28"
          value={speakerAgeInput}
          onChange={e => { setSpeakerAgeInput(e.target.value); setFieldErr(null) }}
          disabled={isPending}
        />
        <p className="c-name-hint">
          Helps choose the right honorific — e.g. အကို vs ဦးလေး in Burmese, พี่ vs ลุง in Thai.
        </p>
      </div>

      {fieldErr && <p className="c-field-err">{fieldErr}</p>}
    </>
  )
}