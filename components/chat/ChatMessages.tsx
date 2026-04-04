import { motion, AnimatePresence } from "framer-motion"
import { ThumbsUp, ThumbsDown, X, Check, MessageSquareText } from "lucide-react"
import { ChatMessage } from "@/types"

interface Props {
  messages:              ChatMessage[]
  correcting:            string | null
  correctionText:        string
  setCorrecting:         (id: string | null) => void
  setCorrectionText:     (v: string) => void
  isPending:             boolean
  feedbackPending:       boolean
  bottomRef:             React.RefObject<HTMLDivElement>
  emptyTitle:            string
  emptySubtitle:         string
  memoriesLabel:         string
  thumbsUpLabel:         string
  thumbsDownLabel:       string
  correctionPlaceholder: string
  submitCorrectionLabel: string
  cancelLabel:           string
  onLike:                (responseId: string) => void
  onCorrect:             (responseId: string, text: string) => void
}

export function ChatMessages({
  messages, correcting, correctionText,
  setCorrecting, setCorrectionText,
  isPending, feedbackPending, bottomRef,
  emptyTitle, emptySubtitle, memoriesLabel,
  thumbsUpLabel, thumbsDownLabel,
  correctionPlaceholder, submitCorrectionLabel, cancelLabel,
  onLike, onCorrect,
}: Props) {
  return (
    <div className="c-messages">
      {messages.length === 0 && (
        <div className="c-empty">
          <div className="c-empty-icon"><MessageSquareText /></div>
          <div>
            <p className="c-empty-title">{emptyTitle}</p>
            <p className="c-empty-sub">{emptySubtitle}</p>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }} className={`c-msg-row ${msg.role}`}>
            <div className={`c-bubble ${msg.role}`}>{msg.content}</div>

            {msg.role === "agent" && (
              <div className="c-meta">
                {msg.memories_used !== undefined && (
                  <p className="c-memories-used">{msg.memories_used} {memoriesLabel}</p>
                )}
                {msg.response_id && correcting !== msg.response_id && (
                  <div className="c-feedback">
                    <button className="c-fb-btn like" onClick={() => onLike(msg.response_id!)}>
                      <ThumbsUp /> {thumbsUpLabel}
                    </button>
                    <button className="c-fb-btn dislike" onClick={() => setCorrecting(msg.response_id!)}>
                      <ThumbsDown /> {thumbsDownLabel}
                    </button>
                  </div>
                )}
                {correcting === msg.response_id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="c-correction">
                    <textarea autoFocus className="c-correction-textarea" value={correctionText}
                      onChange={e => setCorrectionText(e.target.value)}
                      placeholder={correctionPlaceholder} rows={2} />
                    <div className="c-correction-actions">
                      <button className="c-correction-submit"
                        onClick={() => onCorrect(msg.response_id!, correctionText)}
                        disabled={!correctionText.trim() || feedbackPending}>
                        <Check /> {submitCorrectionLabel}
                      </button>
                      <button className="c-correction-cancel"
                        onClick={() => { setCorrecting(null); setCorrectionText("") }}>
                        <X /> {cancelLabel}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {isPending && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="c-typing">
          <div className="c-typing-bubble">
            <div className="c-typing-dot" />
            <div className="c-typing-dot" />
            <div className="c-typing-dot" />
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}