"use client"
import { useRef } from "react"
import { SendIcon } from "./SendIcon"
import { useBilling } from "@/hooks/useBilling"

interface Props {
  value:    string
  onChange: (v: string) => void
  onSend:   () => void
}

export function InputRow({ value, onChange, onSend }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const { balance } = useBilling()


  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
    if (ref.current) {
      ref.current.style.height = "auto"
      ref.current.style.height = Math.min(ref.current.scrollHeight, 120) + "px"
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) onSend()
    }
  }

  return (
    <div className="tc-input-row">
      <textarea
        ref={ref}
        className="tc-textarea"
        rows={1}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Share a memory..."
      />
        <button
          className="tc-send-btn"
          onClick={onSend}
          disabled={!value.trim() || !balance?.can_train}
        >
          <SendIcon />
        </button>
    </div>
  )
}