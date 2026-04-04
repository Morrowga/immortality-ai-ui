import { motion } from "framer-motion"
import { Loader2, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react"
import { IdentityFields } from "./IdentityFields"
import { TypeOption, RoleOption, GateStep, Gender } from "@/hooks/useChat"

interface GateProps {
  gateStep:           GateStep
  selectedType:       TypeOption | null
  selectedRole:       RoleOption | null
  typesData:          TypeOption[]
  isPending:          boolean
  nameInput:          string
  setNameInput:       (v: string) => void
  gender:             Gender | null
  setGender:          (g: Gender) => void
  speakerAgeInput:    string
  setSpeakerAgeInput: (v: string) => void
  fieldErr:           string | null
  setFieldErr:        (e: string | null) => void
  onTypeSelect:       (t: TypeOption) => void
  onRoleSelect:       (r: RoleOption) => void
  onNameContinue:     () => void
  onStrangerContinue: () => void
  onBackToType:       () => void
  onBackToRole:       () => void
  t:                  (key: string) => string
}

export function ChatGate({
  gateStep, selectedType, selectedRole, typesData, isPending,
  nameInput, setNameInput, gender, setGender,
  speakerAgeInput, setSpeakerAgeInput, fieldErr, setFieldErr,
  onTypeSelect, onRoleSelect, onNameContinue, onStrangerContinue,
  onBackToType, onBackToRole, t,
}: GateProps) {

  const identityFieldProps = {
    nameInput, setNameInput, gender, setGender,
    speakerAgeInput, setSpeakerAgeInput,
    fieldErr, setFieldErr, isPending,
  }

  // ── Type ──────────────────────────────────────────────────────────────
  if (gateStep === "type") return (
    <div className="c-identity-wrap">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="c-gate-card">
        <div className="c-gate-step-label">{t("chat.gateSelectType")}</div>
        <div className="c-type-grid">
          {typesData.map(type => (
            <button key={type.type_id} className="c-type-btn"
              onClick={() => onTypeSelect(type)} disabled={isPending}>
              <div className="c-type-text">
                <span className="c-type-name">{type.type_name}</span>
                {type.type_name_local && <span className="c-type-local mx-2">{type.type_name_local}</span>}
              </div>
              {type.access_mode === "open"
                ? <span className="c-type-open-badge">{t("chat.gateEnterDirectly")}</span>
                : <ChevronRight className="c-type-arrow" />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )

  // ── Stranger ──────────────────────────────────────────────────────────
  if (gateStep === "stranger_info" && selectedType) return (
    <div className="c-identity-wrap">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="c-gate-card">
        <button className="c-back-btn" onClick={onBackToType}>
          <ChevronLeft style={{ width: 14, height: 14 }} /> {t("chat.gateBack")}
        </button>
        <IdentityFields {...identityFieldProps} onEnter={onStrangerContinue} />
        <button className="c-id-start" onClick={onStrangerContinue} disabled={isPending}>
          {isPending
            ? <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> {t("chat.loading")}</>
            : <>{t("chat.gateStartConversation")} <ArrowRight style={{ width: 15, height: 15 }} /></>}
        </button>
      </motion.div>
    </div>
  )

  // ── Role ──────────────────────────────────────────────────────────────
  if (gateStep === "role" && selectedType) return (
    <div className="c-identity-wrap">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="c-gate-card">
        <button className="c-back-btn" onClick={onBackToType}>
          <ChevronLeft style={{ width: 14, height: 14 }} /> {t("chat.gateBack")}
        </button>
        <div className="c-gate-step-label">
          {selectedType.type_name_local || selectedType.type_name} — {t("chat.gateSelectRole")}
        </div>
        <div className="c-role-list">
          {selectedType.roles.map(role => (
            <button key={role.id} className="c-role-btn" onClick={() => onRoleSelect(role)}>
              <div>
                <span className="c-role-name">{role.name}</span>
                {role.name_local && <span className="c-role-local">{role.name_local}</span>}
              </div>
              <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )

  // ── Name ──────────────────────────────────────────────────────────────
  if (gateStep === "name" && selectedType && selectedRole) return (
    <div className="c-identity-wrap">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="c-gate-card">
        <button className="c-back-btn" onClick={onBackToRole}>
          <ChevronLeft style={{ width: 14, height: 14 }} /> {t("chat.gateBack")}
        </button>
        <IdentityFields {...identityFieldProps} onEnter={onNameContinue} />
        {selectedType.access_mode === "closed" && (
          <p className="c-name-hint" style={{ marginTop: -8 }}>
            {t("chat.gateKnownPersonHint")}
          </p>
        )}
        <button className="c-id-start" onClick={onNameContinue} disabled={isPending}>
          {isPending
            ? <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> {t("chat.loading")}</>
            : <>{t("chat.gateStartConversation")} <ArrowRight style={{ width: 15, height: 15 }} /></>}
        </button>
      </motion.div>
    </div>
  )

  return null
}