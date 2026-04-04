// components/public-chat/PublicChatInputBar.tsx
import { Send, Loader2, Zap } from "lucide-react"

interface Props {
  input:      string
  setInput:   (v: string) => void
  isPending:  boolean
  onSend:     () => void
  onKeyDown:  (e: React.KeyboardEvent) => void
  neoMode:    boolean
  setNeoMode: (v: boolean) => void
}

export function PublicChatInputBar({
  input, setInput, isPending, onSend, onKeyDown,
  neoMode, setNeoMode,
}: Props) {
  return (
    <div className="pc-input-bar">
      <div className="pc-input-row">
        <textarea
          className="pc-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          rows={1}
        />

        {/* Neo toggle — before send */}
        <button
          onClick={() => setNeoMode(!neoMode)}
          className={`pc-neo-toggle ${neoMode ? "active" : ""}`}
          title={neoMode ? "Neo Mode on — memories + knowledge" : "Neo Mode off — memories only"}
        >
          <Zap size={11} className={neoMode ? "pc-neo-zap-on" : ""} />
          Neo
          {neoMode && <span className="pc-neo-dot" />}
        </button>

        <button className="pc-send-btn" onClick={onSend} disabled={!input.trim() || isPending}>
          {isPending
            ? <Loader2 style={{ width: 18, height: 18, color: "#fff" }} className="animate-spin" />
            : <Send />}
        </button>
      </div>

      <p className="pc-input-hint">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}