import { motion } from "framer-motion"
import { ShieldCheck, ArrowRight } from "lucide-react"
import { SessionData, Gender } from "@/hooks/usePublicChat"

interface Props {
  session:      SessionData
  nameInput:    string
  setNameInput: (v: string) => void
  gender:       Gender | null
  setGender:    (g: Gender) => void
  ageInput:     string
  setAgeInput:  (v: string) => void
  identityErr:  string | null
  setIdentityErr: (e: string | null) => void
  onSubmit:     () => void
}

export function PublicChatIdentity({
  session, nameInput, setNameInput,
  gender, setGender, ageInput, setAgeInput,
  identityErr, setIdentityErr, onSubmit,
}: Props) {
  return (
    <div className="pc-root">
      <div className="pc-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pc-card">

          <div className="pc-verified-badge">
            <ShieldCheck style={{ width: 14, height: 14 }} />
            Verified · {session.role_name_local || session.role_name}
          </div>

          <p className="pc-card-title">A little about you</p>
          <p className="pc-card-sub">The agent uses this to address you correctly.</p>

          {/* Name */}
          <div className="pc-field-group">
            <label className="pc-label">Your name <span className="pc-required">*</span></label>
            <input
              className="pc-input"
              type="text"
              placeholder="e.g. Aung Kyaw"
              value={nameInput}
              onChange={e => { setNameInput(e.target.value); setIdentityErr(null) }}
              onKeyDown={e => { if (e.key === "Enter") onSubmit() }}
              autoFocus
            />
          </div>

          {/* Gender */}
          <div className="pc-field-group">
            <label className="pc-label">
              Your gender{" "}
              {!session.person_gender
                ? <span className="pc-required">*</span>
                : <span style={{ color: "var(--imm-green)", fontSize: 11 }}>· pre-filled</span>}
            </label>
            <div className="pc-chip-row">
              {(["male", "female", "other"] as Gender[]).map(g => (
                <button key={g}
                  className={`pc-chip ${gender === g ? "selected" : ""}`}
                  onClick={() => { setGender(g); setIdentityErr(null) }}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div className="pc-field-group">
            <label className="pc-label">
              Your age{" "}
              {!session.person_age
                ? <span className="pc-required">*</span>
                : <span style={{ color: "var(--imm-green)", fontSize: 11 }}>· pre-filled</span>}
            </label>
            <input
              className="pc-input pc-age-input"
              type="number"
              min={1}
              max={120}
              placeholder="e.g. 28"
              value={ageInput}
              onChange={e => { setAgeInput(e.target.value); setIdentityErr(null) }}
            />
            <p className="pc-hint">Used to pick the right honorific — e.g. အကို vs ဦးလေး in Burmese.</p>
          </div>

          {identityErr && <p className="pc-field-err">{identityErr}</p>}

          <button className="pc-primary-btn" onClick={onSubmit}>
            Start chatting <ArrowRight style={{ width: 15, height: 15 }} />
          </button>

        </motion.div>
      </div>
    </div>
  )
}