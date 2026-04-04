import { Plus, FlaskConical } from "lucide-react"

interface EmptySlotProps {
  slotNum:   number
  onInstall: () => void
  onCustom:  () => void
  t:         (key: string) => string
}

export function EmptySlot({ slotNum, onInstall, onCustom, t }: EmptySlotProps) {
  return (
    <div className="neo-slot">
      <span className="neo-slot-number">
        {t("neo.slotLabel").replace("{n}", String(slotNum))}
      </span>
      <div className="neo-slot-empty-content">
        <div className="neo-slot-empty-icon">
          <Plus size={14} />
        </div>
        <span className="neo-slot-empty-text">{t("neo.emptySlot")}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="neo-slot-install-btn" onClick={onInstall}>
            <Plus size={10} /> {t("neo.browse")}
          </button>
          <button className="neo-slot-install-btn" onClick={onCustom}>
            <FlaskConical size={10} /> {t("neo.custom")}
          </button>
        </div>
      </div>
    </div>
  )
}