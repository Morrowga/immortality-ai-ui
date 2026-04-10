/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Loader2, Key, Eye, EyeOff, RefreshCw } from "lucide-react"
import { AddressFormsEditor } from "../AddressFormsEditor"
import { ParticlesInput }     from "../ParticlesInput"
import { AddressForm, RelType, Role, Person } from "@/types"

// ── Shared modal wrapper ───────────────────────────────────────────────────

function ModalOverlay({ onClose, children, wide = false }: {
  onClose: () => void; children: React.ReactNode; wide?: boolean
}) {
  return (
    <motion.div className="rs-modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        className={`rs-modal ${wide ? "rs-modal-wide rs-modal-scroll" : ""}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// function ModalActions({ onClose, onSave, isPending, saveLabel, disabled = false }: {
//   onClose: () => void; onSave: () => void
//   isPending: boolean; saveLabel: string; disabled?: boolean
// }) {
//   return (
//     <div className="rs-modal-actions">
//       <button className="rs-btn-ghost" onClick={onClose}>{saveLabel /* cancel label passed via t */}</button>
//       <button className="rs-btn-primary" disabled={isPending || disabled} onClick={onSave}>
//         {isPending ? <Loader2 className="animate-spin" /> : <Check />} {saveLabel}
//       </button>
//     </div>
//   )
// }

// ── Shared ModalActions using explicit cancel / save labels ────────────────

function ModalButtons({ onClose, onSave, isPending, cancelLabel, saveLabel, disabled = false }: {
  onClose: () => void; onSave: () => void
  isPending: boolean; cancelLabel: string; saveLabel: string; disabled?: boolean
}) {
  return (
    <div className="rs-modal-actions">
      <button className="rs-btn-ghost" onClick={onClose}>{cancelLabel}</button>
      <button className="rs-btn-primary" disabled={isPending || disabled} onClick={onSave}>
        {isPending ? <Loader2 className="animate-spin" /> : <Check />} {saveLabel}
      </button>
    </div>
  )
}

// ── Add Type ──────────────────────────────────────────────────────────────

export function AddTypeModal({ name, nameLocal, setName, setNameLocal, onClose, onSave, isPending, t }: {
  name: string; nameLocal: string
  setName: (v: string) => void; setNameLocal: (v: string) => void
  onClose: () => void; onSave: () => void; isPending: boolean
  t: (k: string) => string
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="rs-modal-title">{t("relationships.addTypeTitle")}</div>
      <label className="rs-label">{t("relationships.nameEnglish")}</label>
      <input className="rs-input" value={name} onChange={e => setName(e.target.value)}
        placeholder="e.g. Mentor" autoFocus />
      <label className="rs-label">{t("relationships.nameLocal")}</label>
      <input className="rs-input" value={nameLocal} onChange={e => setNameLocal(e.target.value)}
        placeholder="e.g. လမ်းညွှန်ဆရာ" />
      <ModalButtons
        onClose={onClose} onSave={onSave} isPending={isPending}
        cancelLabel={t("relationships.modalCancel")}
        saveLabel={t("relationships.modalCreate")}
        disabled={!name.trim()}
      />
    </ModalOverlay>
  )
}

// ── Edit Type ─────────────────────────────────────────────────────────────

export function EditTypeModal({ type: tp, onClose, onSave, isPending, t }: {
  type: RelType; onClose: () => void; onSave: (data: object) => void; isPending: boolean
  t: (k: string) => string
}) {
  const [name,      setName]      = useState(tp.name)
  const [nameLocal, setNameLocal] = useState(tp.name_local || "")

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rs-modal-title">
        {t("relationships.editTypeTitle").replace("{name}", tp.name)}
      </div>
      {!tp.is_system_default && (
        <div>
          <label className="rs-label">{t("relationships.nameEnglish")}</label>
          <input className="rs-input" value={name} onChange={e => setName(e.target.value)} />
        </div>
      )}
      <div>
        <label className="rs-label">{t("relationships.localName")}</label>
        <input className="rs-input" value={nameLocal} onChange={e => setNameLocal(e.target.value)}
          placeholder="e.g. မိသားစု" />
      </div>
      {tp.is_system_default && (
        <p className="rs-forms-hint">{t("relationships.systemTypeHint")}</p>
      )}
      <ModalButtons
        onClose={onClose} isPending={isPending}
        cancelLabel={t("relationships.modalCancel")}
        saveLabel={t("relationships.modalSaveChanges")}
        onSave={() => onSave({
          name:       tp.is_system_default ? undefined : name || undefined,
          name_local: nameLocal || null,
        })}
      />
    </ModalOverlay>
  )
}

// ── Add Role ──────────────────────────────────────────────────────────────

export function AddRoleModal({ typeName, name, nameLocal, addrForms, selfForms, forbidden, tone,
  setName, setNameLocal, setAddrForms, setSelfForms, setForbidden, setTone,
  onClose, onSave, isPending, t }: {
  typeName: string; name: string; nameLocal: string
  addrForms: AddressForm[]; selfForms: AddressForm[]
  forbidden: string; tone: string
  setName: (v: string) => void; setNameLocal: (v: string) => void
  setAddrForms: (v: AddressForm[]) => void; setSelfForms: (v: AddressForm[]) => void
  setForbidden: (v: string) => void; setTone: (v: string) => void
  onClose: () => void; onSave: () => void; isPending: boolean
  t: (k: string) => string
}) {
  return (
    <ModalOverlay onClose={onClose} wide>
      <div className="rs-modal-title">
        {t("relationships.newRoleTitle").replace("{typeName}", typeName)}
      </div>
      <div className="rs-modal-grid">
        <div>
          <label className="rs-label">{t("relationships.roleName")}</label>
          <input className="rs-input" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Older cousin" autoFocus />
        </div>
        <div>
          <label className="rs-label">{t("relationships.localName")}</label>
          <input className="rs-input" value={nameLocal} onChange={e => setNameLocal(e.target.value)}
            placeholder="e.g. ဒေါ်လေး" />
        </div>
      </div>
      <AddressFormsEditor label={t("relationships.addressThem")}   forms={addrForms} onChange={setAddrForms} />
      <AddressFormsEditor label={t("relationships.referSelf")}     forms={selfForms} onChange={setSelfForms} />
      <label className="rs-label">{t("relationships.forbiddenParticles")}</label>
      <input className="rs-input" value={forbidden} onChange={e => setForbidden(e.target.value)}
        placeholder={t("relationships.particlesPlaceholder")} />
      <label className="rs-label">{t("relationships.toneDescription")}</label>
      <textarea className="rs-textarea" value={tone} onChange={e => setTone(e.target.value)}
        placeholder="e.g. Respectful and warm. Never peer-level casual." rows={2} />
      <ModalButtons
        onClose={onClose} onSave={onSave} isPending={isPending}
        cancelLabel={t("relationships.modalCancel")}
        saveLabel={t("relationships.modalCreateRole")}
        disabled={!name.trim()}
      />
    </ModalOverlay>
  )
}

// ── Edit Role ─────────────────────────────────────────────────────────────

export function EditRoleModal({ role, onClose, onSave, isPending, t }: {
  role: Role; onClose: () => void; onSave: (data: object) => void; isPending: boolean
  t: (k: string) => string
}) {
  const [name,      setName]      = useState(role.name)
  const [nameLocal, setNameLocal] = useState(role.name_local || "")
  const [addrForms, setAddrForms] = useState<AddressForm[]>(role.address_forms || [])
  const [selfForms, setSelfForms] = useState<AddressForm[]>(role.self_address_forms || [])
  const [forbidden, setForbidden] = useState<string[]>(role.forbidden_particles || [])
  const [required,  setRequired]  = useState<string[]>(role.required_particles  || [])
  const [endings,   setEndings]   = useState<string[]>(role.allowed_endings     || [])
  const [tone,      setTone]      = useState(role.tone_description || "")

  return (
    <ModalOverlay onClose={onClose} wide>
      <div className="rs-modal-title">
        {t("relationships.editRoleTitle").replace("{name}", role.name)}
      </div>
      <div className="rs-modal-grid">
        <div>
          <label className="rs-label">{t("relationships.roleName")}</label>
          <input className="rs-input" value={name} onChange={e => setName(e.target.value)}
            disabled={role.is_system_default} />
        </div>
        <div>
          <label className="rs-label">{t("relationships.localName")}</label>
          <input className="rs-input" value={nameLocal} onChange={e => setNameLocal(e.target.value)}
            placeholder="e.g. မေမေ" />
        </div>
      </div>
      <div>
        <label className="rs-label">{t("relationships.toneDescription")}</label>
        <textarea className="rs-textarea" value={tone} onChange={e => setTone(e.target.value)}
          placeholder="How should the agent sound with people in this group?" rows={2} />
      </div>
      <AddressFormsEditor label={t("relationships.addressThem")}  forms={addrForms} onChange={setAddrForms} />
      <AddressFormsEditor label={t("relationships.referSelf")}    forms={selfForms} onChange={setSelfForms} />
      <ParticlesInput
        label={t("relationships.forbidden")}
        hint={t("relationships.forbiddenParticles")}
        value={forbidden} onChange={setForbidden} />
      <ParticlesInput
        label="Required particles"
        hint="Comma-separated."
        value={required}  onChange={setRequired} />
      <ParticlesInput
        label="Allowed endings"
        hint="Comma-separated."
        value={endings}   onChange={setEndings} />
      {role.is_system_default && (
        <p className="rs-forms-hint">{t("relationships.systemRoleHint")}</p>
      )}
      <ModalButtons
        onClose={onClose} isPending={isPending}
        cancelLabel={t("relationships.modalCancel")}
        saveLabel={t("relationships.modalSaveChanges")}
        onSave={() => onSave({
          name:                role.is_system_default ? undefined : name || undefined,
          name_local:          nameLocal || null,
          address_forms:       addrForms.filter(f => f.form.trim()),
          self_address_forms:  selfForms.filter(f => f.form.trim()),
          forbidden_particles: forbidden,
          required_particles:  required,
          allowed_endings:     endings,
          tone_description:    tone || null,
        })}
      />
    </ModalOverlay>
  )
}

// ── Add Person ────────────────────────────────────────────────────────────

export function AddPersonModal({ roleName, name, gender, age, addrForms, selfForms,
  samples, passphrase, passphraseVisible,
  setName, setGender, setAge, setAddrForms, setSelfForms,
  setSamples, setPassphrase, setPassphraseVisible,
  onClose, onSave, onFetchSuggestion, isPending, t }: {
  roleName: string; name: string; gender: string; age: string
  addrForms: AddressForm[]; selfForms: AddressForm[]
  samples: string; passphrase: string; passphraseVisible: boolean
  setName: (v: string) => void; setGender: (v: string) => void; setAge: (v: string) => void
  setAddrForms: (v: AddressForm[]) => void; setSelfForms: (v: AddressForm[]) => void
  setSamples: (v: string) => void; setPassphrase: (v: string) => void
  setPassphraseVisible: (v: boolean) => void
  onClose: () => void; onSave: () => void
  onFetchSuggestion: () => void; isPending: boolean
  t: (k: string) => string
}) {
  return (
    <ModalOverlay onClose={onClose} wide>
      <div className="rs-modal-title">
        {t("relationships.addPersonTitle").replace("{roleName}", roleName)}
      </div>
      <label className="rs-label">{t("relationships.fieldName")}</label>
      <input className="rs-input" value={name} onChange={e => setName(e.target.value)}
        placeholder="e.g. Ma Khin" autoFocus />
      <div className="rs-modal-grid">
        <div>
          <label className="rs-label">{t("relationships.fieldGender")}</label>
          <select className="rs-input rs-select" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">{t("relationships.genderNotSpecified")}</option>
            <option value="male">{t("relationships.genderMale")}</option>
            <option value="female">{t("relationships.genderFemale")}</option>
            <option value="other">{t("relationships.genderOther")}</option>
          </select>
        </div>
        <div>
          <label className="rs-label">{t("relationships.fieldAge")}</label>
          <input className="rs-input" type="number" min={1} max={120}
            value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 55" />
        </div>
      </div>
      <p className="rs-label" style={{ marginBottom: 4 }}>
        {t("relationships.addrFormsOverride")}
        <span style={{ fontWeight: 300, opacity: 0.6 }}> {t("relationships.addrFormsOverrideSub")}</span>
      </p>
      <AddressFormsEditor label={t("relationships.addressThem")} forms={addrForms} onChange={setAddrForms} />
      <AddressFormsEditor label={t("relationships.referSelf")}   forms={selfForms} onChange={setSelfForms} />
      <label className="rs-label">
        {t("relationships.realMessages")}
        <span style={{ fontWeight: 300, opacity: 0.6 }}> {t("relationships.realMessagesSub")}</span>
      </label>
      <textarea className="rs-textarea" value={samples} onChange={e => setSamples(e.target.value)}
        placeholder={"မေမေ ကောင်းနေလား\nဒီနေ့ ဘာစားမလဲ"} rows={3} />
      <div className="rs-key-section">
        <div className="rs-key-section-header">
          <Key style={{ width: 12, height: 12 }} />
          <span>{t("relationships.accessKey")}</span>
          <span className="rs-key-section-hint">{t("relationships.accessKeySub")}</span>
        </div>
        <div className="rs-key-input-wrap">
          <input className="rs-input rs-key-input"
            type={passphraseVisible ? "text" : "password"}
            value={passphrase} onChange={e => setPassphrase(e.target.value)}
            placeholder="e.g. blue-river-42" />
          <button className="rs-key-input-btn" onClick={() => setPassphraseVisible(!passphraseVisible)} type="button">
            {passphraseVisible
              ? <EyeOff style={{ width: 13, height: 13 }} />
              : <Eye    style={{ width: 13, height: 13 }} />}
          </button>
          <button className="rs-key-input-btn" onClick={onFetchSuggestion} type="button"
            title={t("relationships.keyRegen")}>
            <RefreshCw style={{ width: 13, height: 13 }} />
          </button>
        </div>
        <p className="rs-key-section-sub">
          {t("relationships.accessKeyHint").replace("{name}", name || "this person")}
        </p>
      </div>
      <ModalButtons
        onClose={onClose} onSave={onSave} isPending={isPending}
        cancelLabel={t("relationships.modalCancel")}
        saveLabel={t("relationships.modalAddPerson")}
        disabled={!name.trim()}
      />
    </ModalOverlay>
  )
}

// ── Edit Person ───────────────────────────────────────────────────────────

export function EditPersonModal({ person, onClose, onSave, isPending, t }: {
  person: Person; onClose: () => void; onSave: (data: object) => void; isPending: boolean
  t: (k: string) => string
}) {
  const [name,      setName]      = useState(person.person_name)
  const [aliases,   setAliases]   = useState((person.person_aliases || []).join(", "))
  const [gender,    setGender]    = useState(person.gender || "")
  const [age,       setAge]       = useState(person.age != null ? String(person.age) : "")
  const [addrForms, setAddrForms] = useState<AddressForm[]>(person.address_forms || [])
  const [selfForms, setSelfForms] = useState<AddressForm[]>(person.self_address_forms || [])
  const [tone,      setTone]      = useState(person.tone_description || "")
  const [forbidden, setForbidden] = useState<string[]>(person.forbidden_particles || [])
  const [required,  setRequired]  = useState<string[]>(person.required_particles  || [])
  const [endings,   setEndings]   = useState<string[]>(person.allowed_endings     || [])

  return (
    <ModalOverlay onClose={onClose} wide>
      <div className="rs-modal-title">
        {t("relationships.editPersonTitle").replace("{name}", person.person_name)}
      </div>
      <p className="rs-forms-hint">{t("relationships.fieldsInheritHint")}</p>
      <div className="rs-modal-grid">
        <div>
          <label className="rs-label">{t("relationships.fieldName")} *</label>
          <input className="rs-input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="rs-label">{t("relationships.fieldAliases")}</label>
          <input className="rs-input" value={aliases} onChange={e => setAliases(e.target.value)}
            placeholder={t("relationships.aliasesPlaceholder")} />
        </div>
      </div>
      <div className="rs-modal-grid">
        <div>
          <label className="rs-label">{t("relationships.fieldGender")}</label>
          <select className="rs-input rs-select" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">{t("relationships.genderNotSpecified")}</option>
            <option value="male">{t("relationships.genderMale")}</option>
            <option value="female">{t("relationships.genderFemale")}</option>
            {/* <option value="other">{t("relationships.genderOther")}</option> */}
          </select>
          <p className="rs-forms-hint py-2">{t("relationships.autoPickHint")}</p>
        </div>
        <div>
          <label className="rs-label">{t("relationships.fieldAge")}</label>
          <input className="rs-input" type="number" min={1} max={120}
            value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 55" />
          <p className="rs-forms-hint py-2">{t("relationships.autoPickHint")}</p>
        </div>
      </div>
      <AddressFormsEditor label={t("relationships.addressThem")} forms={addrForms} onChange={setAddrForms} />
      <AddressFormsEditor label={t("relationships.referSelf")}   forms={selfForms} onChange={setSelfForms} />
      <div>
        <label className="rs-label">{t("relationships.toneDescription")}</label>
        <textarea className="rs-textarea" value={tone} onChange={e => setTone(e.target.value)}
          placeholder={t("relationships.tonePersonPlaceholder")} rows={2} />
      </div>
      <ParticlesInput
        label={t("relationships.forbidden")}
        hint={t("relationships.forbiddenParticles")}
        value={forbidden} onChange={setForbidden} />
      <ParticlesInput label="Required particles" hint="Leave empty to use the role's list."
        value={required}  onChange={setRequired} />
      <ParticlesInput label="Allowed endings"    hint="Leave empty to use the role's list."
        value={endings}   onChange={setEndings} />
      <ModalButtons
        onClose={onClose} isPending={isPending} disabled={!name.trim()}
        cancelLabel={t("relationships.modalCancel")}
        saveLabel={t("relationships.modalSaveChanges")}
        onSave={() => onSave({
          person_name:         name,
          person_aliases:      aliases.split(",").map((s:any) => s.trim()).filter(Boolean),
          gender:              gender || null,
          age:                 age ? parseInt(age) : null,
          address_forms:       addrForms.filter(f => f.form.trim()),
          self_address_forms:  selfForms.filter(f => f.form.trim()),
          tone_description:    tone || null,
          forbidden_particles: forbidden,
          required_particles:  required,
          allowed_endings:     endings,
        })}
      />
    </ModalOverlay>
  )
}