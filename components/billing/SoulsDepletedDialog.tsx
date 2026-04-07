"use client"
import { useBilling } from "@/hooks/useBilling"

export default function SoulsDepletedDialog() {
  const { balance, soulsDialogOpen, setSoulsDialogOpen, goToBilling, isPaid } = useBilling()

  if (!soulsDialogOpen) return null

  return (
    <div className="souls-dialog-overlay" onClick={() => setSoulsDialogOpen(false)}>
      <div className="souls-dialog" onClick={e => e.stopPropagation()}>

        <h2 className="souls-dialog-title">
          {isPaid ? "Out of Souls" : "Free Souls used up"}
        </h2>

        <p className="souls-dialog-body">
          {isPaid
            ? "You've run out of Souls. Buy a refill pack to keep training and chatting."
            : "You've used all your free Souls. Upgrade to the paid plan to continue."
          }
        </p>

        <div className="souls-dialog-balance">
          <span className="souls-dialog-balance-num">
            {balance?.souls_balance ?? 0}
          </span>
          <span className="souls-dialog-balance-label">Souls remaining</span>
        </div>

        <div className="souls-dialog-actions">
          <button className="souls-dialog-primary" onClick={goToBilling}>
            {isPaid ? "Buy refill — $3.99" : "Upgrade — $14.99"}
          </button>
          <button className="souls-dialog-secondary" onClick={() => setSoulsDialogOpen(false)}>
            Maybe later
          </button>
        </div>

      </div>
    </div>
  )
}