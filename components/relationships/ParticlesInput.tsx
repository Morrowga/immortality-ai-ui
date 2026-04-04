import { useState } from "react"

interface Props {
  label:    string
  hint?:    string
  value:    string[]
  onChange: (v: string[]) => void
}

export function ParticlesInput({ label, hint, value, onChange }: Props) {
  const [raw, setRaw] = useState(value.join(", "))

  const commit = () => {
    onChange(raw.split(",").map(s => s.trim()).filter(Boolean))
  }

  return (
    <div>
      <label className="rs-label">{label}</label>
      {hint && <p className="rs-forms-hint">{hint}</p>}
      <input className="rs-input" value={raw}
        onChange={e => setRaw(e.target.value)} onBlur={commit}
        placeholder="comma-separated, e.g. နင်, မင်း" />
    </div>
  )
}