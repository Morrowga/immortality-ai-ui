import { AnimatePresence } from "framer-motion"
import { Plus, Trash2, ChevronRight, User, Users, Pencil,
         Check, Eye, EyeOff, Copy, ShieldOff, ShieldCheck,
         Power, RefreshCw, Loader2 } from "lucide-react"
import { RelType, Role, Person } from "@/types"

// ── Small helpers ──────────────────────────────────────────────────────────

export function SysTag() {
  return <span className="rs-sys-tag">system</span>
}

export function FormBadges({ forms }: { forms: { form: string; context: string }[] }) {
  if (!forms?.length) return null
  return (
    <div className="rs-pp-badges">
      {forms.map((f, i) => <span key={i} className="rs-badge" title={f.context}>{f.form}</span>)}
    </div>
  )
}

export function KeyBadge({
  hasKey, enabled, t,
}: { hasKey: boolean; enabled: boolean; t: (k: string) => string }) {
  if (!hasKey)  return <span className="rs-key-badge rs-key-badge-none">{t("relationships.keyNone")}</span>
  if (!enabled) return (
    <span className="rs-key-badge rs-key-badge-disabled">
      <ShieldOff style={{ width: 10, height: 10 }} /> {t("relationships.keyDisabled")}
    </span>
  )
  return (
    <span className="rs-key-badge rs-key-badge-active">
      <ShieldCheck style={{ width: 10, height: 10 }} /> {t("relationships.keyActive")}
    </span>
  )
}

// ── Column 1: Types ────────────────────────────────────────────────────────

interface TypeColumnProps {
  tree:              RelType[] | undefined
  selectedTypeId:    string | null
  onSelectType:      (id: string) => void
  onEditType:        (t: RelType) => void
  onDeleteType:      (id: string) => void
  onAddType:         () => void
  addTypeModal:      React.ReactNode
  editTypeModal:     React.ReactNode
  t:                 (key: string) => string
}

export function RelationshipTypeColumn({
  tree, selectedTypeId, onSelectType, onEditType, onDeleteType, onAddType,
  addTypeModal, editTypeModal, t,
}: TypeColumnProps) {
  return (
    <div className="rs-col">
      <div className="rs-col-header">
        <span className="rs-col-title">{t("relationships.colType")}</span>
        <button className="rs-add-btn" onClick={onAddType}><Plus /> {t("common.add")}</button>
      </div>
      <div className="rs-list">
        {tree?.map(type => (
          <button key={type.id}
            className={`rs-item ${selectedTypeId === type.id ? "selected" : ""}`}
            onClick={() => onSelectType(type.id)}>
            <div className="rs-item-main">
              <span className="rs-item-name">{type.name}</span>
              {type.name_local && <span className="rs-item-local">{type.name_local}</span>}
              {type.is_system_default && <SysTag />}
            </div>
            <div className="rs-item-right">
              <span className="rs-count">
                {t("relationships.countRoles").replace("{n}", String(type.roles.length))}
              </span>
              <ChevronRight className="rs-chevron" />
              <button className="rs-edit-btn"
                onClick={e => { e.stopPropagation(); onEditType(type) }}
                title={t("common.edit")}><Pencil /></button>
              {!type.is_system_default && (
                <button className="rs-del-btn"
                  onClick={e => { e.stopPropagation(); onDeleteType(type.id) }}>
                  <Trash2 />
                </button>
              )}
            </div>
          </button>
        ))}
      </div>
      <AnimatePresence>{addTypeModal}</AnimatePresence>
      <AnimatePresence>{editTypeModal}</AnimatePresence>
    </div>
  )
}

// ── Column 2: Roles ────────────────────────────────────────────────────────

interface RoleColumnProps {
  selectedType:   RelType | null
  selectedRoleId: string | null
  onSelectRole:   (id: string) => void
  onEditRole:     (r: Role) => void
  onDeleteRole:   (id: string) => void
  onAddRole:      () => void
  addRoleModal:   React.ReactNode
  editRoleModal:  React.ReactNode
  t:              (key: string) => string
}

export function RelationshipRoleColumn({
  selectedType, selectedRoleId, onSelectRole, onEditRole, onDeleteRole, onAddRole,
  addRoleModal, editRoleModal, t,
}: RoleColumnProps) {
  const selectedRole = selectedType?.roles.find(r => r.id === selectedRoleId) ?? null

  if (!selectedType) return (
    <div className="rs-col rs-col-empty">
      <div className="rs-empty-state"><Users /><p>{t("relationships.selectTypeEmpty")}</p></div>
    </div>
  )

  return (
    <div className="rs-col">
      <div className="rs-col-header">
        <span className="rs-col-title">{selectedType.name} · {t("relationships.colRoles")}</span>
        <button className="rs-add-btn" onClick={onAddRole}><Plus /> {t("common.add")}</button>
      </div>
      <div className="rs-list">
        {selectedType.roles.map(r => (
          <button key={r.id}
            className={`rs-item ${selectedRoleId === r.id ? "selected" : ""}`}
            onClick={() => onSelectRole(r.id)}>
            <div className="rs-item-main">
              <span className="rs-item-name">{r.name}</span>
              {r.name_local && <span className="rs-item-local">{r.name_local}</span>}
              {r.is_system_default && <SysTag />}
            </div>
            <div className="rs-item-right">
              <span className="rs-count">
                {t("relationships.countPeople").replace("{n}", String(r.people.length))}
              </span>
              <ChevronRight className="rs-chevron" />
              <button className="rs-edit-btn"
                onClick={e => { e.stopPropagation(); onEditRole(r) }}
                title={t("common.edit")}><Pencil /></button>
              {!r.is_system_default && (
                <button className="rs-del-btn"
                  onClick={e => { e.stopPropagation(); onDeleteRole(r.id) }}>
                  <Trash2 />
                </button>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Pronoun preview */}
      {selectedRole && (
        <div className="rs-pronoun-preview">
          <div className="rs-pp-title">{t("relationships.pronounRules")}</div>
          {selectedRole.address_forms?.length > 0 && (
            <div className="rs-pp-section">
              <span className="rs-pp-key">{t("relationships.addressThem")}</span>
              <div className="rs-pp-forms">
                {selectedRole.address_forms.map((f, i) => (
                  <div key={i} className="rs-pp-form-row">
                    <span className="rs-badge">{f.form}</span>
                    {f.context && <span className="rs-pp-context">{f.context}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedRole.self_address_forms?.length > 0 && (
            <div className="rs-pp-section">
              <span className="rs-pp-key">{t("relationships.referSelf")}</span>
              <div className="rs-pp-forms">
                {selectedRole.self_address_forms.map((f, i) => (
                  <div key={i} className="rs-pp-form-row">
                    <span className="rs-badge">{f.form}</span>
                    {f.context && <span className="rs-pp-context">{f.context}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedRole.forbidden_particles?.length > 0 && (
            <div className="rs-pp-row">
              <span className="rs-pp-key rs-pp-danger">{t("relationships.forbidden")}</span>
              <div className="rs-pp-badges">
                {selectedRole.forbidden_particles.map(p => (
                  <span key={p} className="rs-badge rs-badge-danger">{p}</span>
                ))}
              </div>
            </div>
          )}
          {selectedRole.tone_description && (
            <p className="rs-pp-tone">{selectedRole.tone_description}</p>
          )}
        </div>
      )}

      <AnimatePresence>{addRoleModal}</AnimatePresence>
      <AnimatePresence>{editRoleModal}</AnimatePresence>
    </div>
  )
}

// ── Column 3: People ───────────────────────────────────────────────────────

interface PeopleColumnProps {
  selectedRole:    Role | null
  people:          Person[]
  revealedKeys:    Record<string, boolean>
  copiedKeys:      Record<string, boolean>
  onEditPerson:    (p: Person) => void
  onDeletePerson:  (id: string) => void
  onAddPerson:     () => void
  onToggleReveal:  (id: string) => void
  onCopyKey:       (id: string, plain: string | null | undefined) => void
  onSaveKey:       (profileId: string) => void
  onToggleKey:     (profileId: string) => void
  onRevokeKey:     (p: Person) => void
  saveKeyPending:  boolean
  toggleKeyPending:boolean
  revokeKeyPending:boolean
  addPersonModal:  React.ReactNode
  editPersonModal: React.ReactNode
  t:               (key: string) => string
}

export function RelationshipPeopleColumn({
  selectedRole, people, revealedKeys, copiedKeys,
  onEditPerson, onDeletePerson, onAddPerson,
  onToggleReveal, onCopyKey,
  onSaveKey, onToggleKey, onRevokeKey,
  saveKeyPending, toggleKeyPending, revokeKeyPending,
  addPersonModal, editPersonModal, t,
}: PeopleColumnProps) {
  if (!selectedRole) return (
    <div className="rs-col rs-col-empty">
      <div className="rs-empty-state"><User /><p>{t("relationships.selectRoleEmpty")}</p></div>
    </div>
  )

  return (
    <div className="rs-col">
      <div className="rs-col-header">
        <span className="rs-col-title">{selectedRole.name} · {t("relationships.colPeople")}</span>
        <button className="rs-add-btn" onClick={onAddPerson}><Plus /> {t("common.add")}</button>
      </div>
      <div className="rs-list">
        {people.length === 0 && (
          <div className="rs-empty-people">{t("relationships.noPeople")}</div>
        )}
        {people.map(p => (
          <div key={p.id} className="rs-person-item">
            <div className="rs-person-avatar">{p.person_name.charAt(0).toUpperCase()}</div>
            <div className="rs-person-info">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="rs-person-name">{p.person_name}</div>
                <button className="rs-edit-btn" onClick={() => onEditPerson(p)} title={t("common.edit")}>
                  <Pencil />
                </button>
              </div>
              {p.person_role && <div className="rs-person-role">{p.person_role}</div>}
              {(p.gender || p.age) && (
                <div className="rs-person-pronouns" style={{ marginTop: 3 }}>
                  {p.gender && <span className="rs-badge">{p.gender}</span>}
                  {p.age    && (
                    <span className="rs-badge">
                      {t("relationships.ageBadge").replace("{n}", String(p.age))}
                    </span>
                  )}
                </div>
              )}
              {p.address_forms?.length > 0 && (
                <div className="rs-person-pronouns">
                  <span className="rs-pp-key" style={{ fontSize: 10 }}>{t("relationships.addressPrefix")}</span>
                  <FormBadges forms={p.address_forms} />
                </div>
              )}
              {p.self_address_forms?.length > 0 && (
                <div className="rs-person-pronouns">
                  <span className="rs-pp-key" style={{ fontSize: 10 }}>{t("relationships.selfPrefix")}</span>
                  <FormBadges forms={p.self_address_forms} />
                </div>
              )}

              {/* Access key row */}
              <div className="rs-person-key-row">
                <KeyBadge hasKey={p.has_key ?? false} enabled={p.key_enabled ?? false} t={t} />
                {p.has_key && p.key_plain && (
                  <div className="rs-key-preview-row">
                    <span className="rs-key-preview-text">
                      {revealedKeys[p.id] ? p.key_plain : "·········"}
                    </span>
                    <button className="rs-key-icon-btn" onClick={() => onToggleReveal(p.id)}
                      title={revealedKeys[p.id] ? t("relationships.keyHide") : t("relationships.keyReveal")}>
                      {revealedKeys[p.id]
                        ? <EyeOff style={{ width: 11, height: 11 }} />
                        : <Eye    style={{ width: 11, height: 11 }} />}
                    </button>
                    <button className="rs-key-icon-btn" onClick={() => onCopyKey(p.id, p.key_plain)}
                      title={t("relationships.keyCopy")}>
                      {copiedKeys[p.id]
                        ? <Check style={{ width: 11, height: 11, color: "#4aaa72" }} />
                        : <Copy  style={{ width: 11, height: 11 }} />}
                    </button>
                  </div>
                )}
                <div className="rs-person-key-actions">
                  <button className="rs-key-action-btn" onClick={() => onSaveKey(p.id)}
                    disabled={saveKeyPending}>
                    {saveKeyPending
                      ? <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
                      : <RefreshCw style={{ width: 11, height: 11 }} />}
                    {p.has_key ? t("relationships.keyRegen") : t("relationships.keyGenerate")}
                  </button>
                  {p.has_key && (
                    <button className="rs-key-action-btn" onClick={() => onToggleKey(p.id)}
                      disabled={toggleKeyPending}>
                      <Power style={{ width: 11, height: 11 }} />
                      {p.key_enabled ? t("relationships.keyDisableAction") : t("relationships.keyEnableAction")}
                    </button>
                  )}
                  {p.has_key && (
                    <button className="rs-key-action-btn rs-key-action-danger"
                      onClick={() => onRevokeKey(p)} disabled={revokeKeyPending}>
                      <ShieldOff style={{ width: 11, height: 11 }} /> {t("relationships.keyRevoke")}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button className="rs-del-btn" onClick={() => onDeletePerson(p.id)}><Trash2 /></button>
          </div>
        ))}
      </div>
      <AnimatePresence>{addPersonModal}</AnimatePresence>
      <AnimatePresence>{editPersonModal}</AnimatePresence>
    </div>
  )
}