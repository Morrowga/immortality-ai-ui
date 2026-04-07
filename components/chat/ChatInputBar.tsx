import { Send, Loader2 } from "lucide-react"
import { useBilling } from "@/hooks/useBilling"

interface Props {
  input:       string
  setInput:    (v: string) => void
  isPending:   boolean
  placeholder: string
  hint:        string
  onSend:      () => void
  onKeyDown:   (e: React.KeyboardEvent) => void
}

export function ChatInputBar({ input, setInput, isPending, placeholder, hint, onSend, onKeyDown }: Props) {
  const { balance } = useBilling()
  const canChat = balance?.can_chat ?? true

  return (
    <div className="c-input-bar">
      <div className="c-input-row">
        <textarea
          className="c-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={!canChat}
        />
        <button
          className="c-send-btn"
          onClick={onSend}
          disabled={!input.trim() || isPending || !canChat}
        >
          {isPending
            ? <Loader2 style={{ width: 18, height: 18, color: "#fff" }} className="animate-spin" />
            : <Send />}
        </button>
      </div>
      <p className="c-input-hint">{hint}</p>
    </div>
  )
}