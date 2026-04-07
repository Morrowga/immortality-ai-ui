"use client"
import { useRouter } from "next/navigation"
import { useBilling } from "@/hooks/useBilling"
import "@/styles/souls-widget.css"

export default function SoulsWidget() {
  const router = useRouter()
  const { balance, isPaid, isLow, isCritical, pct } = useBilling()

  if (!balance) return null

  return (
    <button
      className={`souls-widget ${isLow ? "souls-low" : ""} ${isCritical ? "souls-critical" : ""} ${isPaid ? "souls-paid" : ""}`}
      onClick={() => router.push("/settings/billing")}
      title="View your Souls balance"
    >
      <span className="souls-icon">✦</span>
      <span className="souls-count">{balance.souls_balance.toLocaleString()}</span>
      <span className="souls-label">Souls</span>
      <span className="souls-label"> / Billing</span>

      {!isPaid && (
        <span className="souls-bar-wrap">
          <span
            className="souls-bar-fill"
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        </span>
      )}

      {isCritical && !isPaid && (
        <span className="souls-warn">Low</span>
      )}
    </button>
  )
}