/* eslint-disable react/no-unescaped-entities */
import { motion, AnimatePresence } from "framer-motion"
import { ThumbsUp, ThumbsDown, Check, X } from "lucide-react"
import { PublicChatMessage, AgentInfo } from "@/hooks/usePublicChat"
import { AgentAvatar } from "@/components/public-chat/AgentAvatar"

interface Props {
  agentName:       string
  agentInfo:       AgentInfo
  messages:        PublicChatMessage[]
  correcting:      string | null
  correctionTxt:   string
  isPending:       boolean
  feedbackPending: boolean
  bottomRef:       React.RefObject<HTMLDivElement>
  setCorrecting:    (id: string | null) => void
  setCorrectionTxt: (v: string) => void
  onLike:          (responseId: string) => void
  onCorrect:       (responseId: string, text: string) => void
}

export function PublicChatMessages({
  agentName, agentInfo, messages, correcting, correctionTxt,
  isPending, feedbackPending, bottomRef,
  setCorrecting, setCorrectionTxt,
  onLike, onCorrect,
}: Props) {
  return (
    <div className="pc-messages">

      {/* ── Messenger-style welcome header ── */}
      <div className="pc-welcome">
        <AgentAvatar slug={agentInfo.slug} name={agentName} size={72} />
        <p className="pc-welcome-name">{agentName}</p>
        <p className="pc-welcome-sub">{agentInfo.owner_first_name}'s personal agent</p>
        {messages.length === 0 && (
          <p className="pc-welcome-prompt">Say hello to get started ↓</p>
        )}
      </div>

      <AnimatePresence initial={false}>
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`pc-msg-row ${msg.role}`}
          >
            {/* Agent side */}
            {msg.role === "agent" && (
              <AgentAvatar slug={agentInfo.slug} name={agentName} size={28} />
            )}

            {msg.role === "agent" ? (
              <div style={{ minWidth: 0 }}>
                <div className="pc-bubble agent">{msg.content}</div>
                <div className="pc-meta">
                  {/* {msg.memories_used !== undefined && (
                    <p className="pc-memories-used">{msg.memories_used} memories used</p>
                  )} */}
                  {msg.response_id && correcting !== msg.response_id && (
                    <div className="pc-feedback">
                      <button className="pc-fb-btn like" onClick={() => onLike(msg.response_id!)}>
                        <ThumbsUp /> That's right
                      </button>
                      <button className="pc-fb-btn dislike" onClick={() => setCorrecting(msg.response_id!)}>
                        <ThumbsDown /> Correct it
                      </button>
                    </div>
                  )}
                  {correcting === msg.response_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pc-correction"
                    >
                      <textarea
                        autoFocus
                        className="pc-correction-textarea"
                        value={correctionTxt}
                        onChange={e => setCorrectionTxt(e.target.value)}
                        placeholder="How would they actually say it?"
                        rows={2}
                      />
                      <div className="pc-correction-actions">
                        <button
                          className="pc-correction-submit"
                          onClick={() => onCorrect(msg.response_id!, correctionTxt)}
                          disabled={!correctionTxt.trim() || feedbackPending}
                        >
                          <Check /> Save correction
                        </button>
                        <button
                          className="pc-correction-cancel"
                          onClick={() => { setCorrecting(null); setCorrectionTxt("") }}
                        >
                          <X /> Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              /* User side — bubble + avatar together */
              <>
                <div className="pc-bubble user">{msg.content}</div>
                <div className="pc-speaker-avatar">
                  {(msg.speaker_name || "?").charAt(0)}
                </div>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isPending && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pc-typing">
          <AgentAvatar slug={agentInfo.slug} name={agentName} size={28} />
          <div className="pc-typing-bubble">
            <div className="pc-typing-dot" />
            <div className="pc-typing-dot" />
            <div className="pc-typing-dot" />
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}