/* eslint-disable react/no-unescaped-entities */
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { AgentInfo } from "@/hooks/usePublicChat"
import { AgentAvatar } from "@/components/public-chat/AgentAvatar"

interface Props {
  agentInfo:     AgentInfo
  passphrase:    string
  setPassphrase: (v: string) => void
  showPass:      boolean
  setShowPass:   (v: boolean) => void
  passphraseErr: string | null
  isPending:     boolean
  onSubmit:      () => void
}

export function PublicChatPassphrase({
  agentInfo, passphrase, setPassphrase,
  showPass, setShowPass, passphraseErr, isPending, onSubmit,
}: Props) {
  return (
    <div className="pc-root">
      <div className="pc-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pc-card">

          <div className="pc-agent-badge">
            <AgentAvatar slug={agentInfo.slug} name={agentInfo.agent_name} size={48} />
            <div>
              <p className="pc-agent-name">{agentInfo.agent_name}</p>
              {agentInfo.owner_first_name && (
                <p className="pc-agent-sub">{agentInfo.owner_first_name}'s personal agent</p>
              )}
            </div>
          </div>

          <div className="pc-divider" />

          <div className="pc-field-group">
            <label className="pc-label">
              <Lock style={{ width: 11, height: 11 }} /> Access key
            </label>
            <div className="pc-pass-wrap">
              <input
                className="pc-input"
                type={showPass ? "text" : "password"}
                placeholder="Enter your passphrase…"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") onSubmit() }}
                autoFocus
                disabled={isPending}
              />
              <button className="pc-eye-btn" onClick={() => setShowPass(!showPass)} type="button">
                {showPass
                  ? <EyeOff style={{ width: 14, height: 14 }} />
                  : <Eye    style={{ width: 14, height: 14 }} />}
              </button>
            </div>
            {passphraseErr && <p className="pc-field-err">{passphraseErr}</p>}
            <p className="pc-hint">
              Your passphrase was given to you by {agentInfo.owner_first_name || "the owner"}.
            </p>
          </div>

          <button className="pc-primary-btn" onClick={onSubmit}
            disabled={!passphrase.trim() || isPending}>
            {isPending
              ? <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> Verifying…</>
              : <>Continue <ArrowRight style={{ width: 15, height: 15 }} /></>}
          </button>

        </motion.div>
      </div>
    </div>
  )
}