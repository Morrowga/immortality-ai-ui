import { Plus, X } from "lucide-react"
import { AddressForm, CONTEXT_PRESETS, parseContext, buildContext } from "@/types"

interface Props {
  label:    string
  forms:    AddressForm[]
  onChange: (f: AddressForm[]) => void
}

export function AddressFormsEditor({ label, forms, onChange }: Props) {
  const add    = () => onChange([...forms, { form: "", context: "always" }])
  const remove = (i: number) => onChange(forms.filter((_, idx) => idx !== i))
  const update = (i: number, patch: Partial<AddressForm>) =>
    onChange(forms.map((f, idx) => idx === i ? { ...f, ...patch } : f))

  return (
    <div className="rs-forms-editor">
      <div className="rs-forms-label">
        {label}
        <button className="rs-forms-add" onClick={add} type="button">
          <Plus style={{ width: 11, height: 11 }} /> Add
        </button>
      </div>
      {forms.length === 0 && <p className="rs-forms-empty">No forms — click Add to start.</p>}
      {forms.map((f, i) => {
        const { preset, custom } = parseContext(f.context)
        return (
          <div key={i} className="rs-form-row-wrap">
            <div className="rs-form-row">
              <input className="rs-input rs-form-input" value={f.form}
                onChange={e => update(i, { form: e.target.value })} placeholder="e.g. ညီမ" />
              <select className="rs-select rs-form-select" value={preset}
                onChange={e => {
                  const p = e.target.value
                  update(i, { context: buildContext(p, p === "custom" ? (custom || "") : "") })
                }}>
                {CONTEXT_PRESETS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button className="rs-del-btn" onClick={() => remove(i)} type="button">
                <X style={{ width: 11, height: 11 }} />
              </button>
            </div>
            {preset === "custom" && (
              <input className="rs-input rs-form-custom"
                value={custom === "__custom__" ? "" : custom}
                onChange={e => update(i, { context: e.target.value === "" ? "__custom__" : e.target.value })}
                placeholder="In English — e.g. younger female, older male 1-15 years"
                autoFocus />
            )}
          </div>
        )
      })}
    </div>
  )
}