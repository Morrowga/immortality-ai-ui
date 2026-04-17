"use client"
import { useBilling } from "@/hooks/useBilling"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useAuthStore } from "@/store/auth"
import { useTranslation } from "@/locales"
import { useState, useEffect } from "react"
import "@/styles/billing.css"

const REASON_LABELS: Record<string, string> = {
  signup_tester:            "Free plan — welcome gift",
  signup_paid:              "Paid plan — credit included",
  refill_pack:              "Refill pack purchased",
  training_submit:          "Training session",
  chat_message_en:          "Chat message",
  chat_message_intl:        "Chat message",
  chat_message_conv_memory: "Chat message",
  admin_grant:              "Admin credit",
  refund:                   "Refund",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function BillingPage() {
  const { displayLanguage, darkMode } = useAuthStore()
  const themeClass = darkMode ? "dark-panel" : "dashboard"

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const lang = mounted ? displayLanguage : "en"
  const { t } = useTranslation(lang)

  const {
    balance,
    transactions,
    balanceLoading,
    isPaid,
    pct,
    upgrade,
    refill,
    upgrading,
    refilling,
  } = useBilling()

  return (
    <DashboardLayout>
      <div className={`billing-root ${themeClass}`}>

        {/* ── Header ── */}
        <div className="billing-header">
          <div className="billing-eyebrow">{t("settings.eyebrow")}</div>
          <h1 className="billing-title">Souls</h1>
          <p className="billing-sub">Your usage currency for Immortality</p>
        </div>

        {/* ── Scrollable body ── */}
        <div className="billing-body">

          {/* Balance card */}
          <div className="billing-balance-card">
            <div className="billing-balance-left">
              <div className="billing-soul-icon">✦</div>
              <div>
                <div className="billing-balance-num">
                  {balanceLoading ? "—" : balance?.souls_balance.toLocaleString()}
                </div>
                <div className="billing-balance-label">Souls remaining</div>
              </div>
            </div>
            <div className="billing-plan-badge" data-plan={balance?.plan ?? "tester"}>
              {isPaid ? "Paid" : "Tester"}
            </div>
          </div>

          {/* Tester progress bar */}
          {!isPaid && balance && (
            <div>
              <div className="billing-progress-wrap">
                <div
                  className="billing-progress-fill"
                  style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                />
              </div>
              <div className="billing-progress-labels">
                <span>{balance.souls_balance} remaining</span>
                <span>{balance.tester_cap} total</span>
              </div>
            </div>
          )}

          {/* Cost reference */}
          {balance && (
            <div className="billing-costs">
              <div className="billing-cost-item">
                <span className="billing-cost-label">Training submit</span>
                <span className="billing-cost-val">✦ {balance.cost_training} Souls</span>
              </div>
              <div className="billing-cost-item">
                <span className="billing-cost-label">Chat message (EN)</span>
                <span className="billing-cost-val">✦ {balance.cost_chat_en} Souls</span>
              </div>
              <div className="billing-cost-item">
                <span className="billing-cost-label">Chat message (MY/TH/KO)</span>
                <span className="billing-cost-val">✦ {balance.cost_chat_intl} Souls</span>
              </div>
            </div>
          )}

          {/* Plans */}
          <div className="billing-plans">
            <div className={`billing-plan-card ${!isPaid ? "billing-plan-current" : ""}`}>
              <div className="billing-plan-name">Tester</div>
              <div className="billing-plan-price">Free</div>
              <ul className="billing-plan-features">
                <li>600 Souls on signup</li>
                <li>Up to ~21 training sessions</li>
                <li>Up to ~12 chat messages</li>
                <li>No refill available</li>
                <li>Public chat sharing</li>
              </ul>
              {!isPaid && <div className="billing-plan-current-tag">Current plan</div>}
            </div>

            <div className={`billing-plan-card billing-plan-featured ${isPaid ? "billing-plan-current" : ""}`}>
              <div className="billing-plan-name">Paid</div>
              <div className="billing-plan-price">
                $14.99 <span className="billing-plan-period">one-time</span>
              </div>
              <ul className="billing-plan-features">
                <li>1000 Souls included</li>
                <li>Unlimited memories</li>
                <li>Neo Mode enabled</li>
                <li>Refill packs: 1,000 Souls / $3.99</li>
                <li>Everything in Tester</li>
              </ul>
              {isPaid ? (
                <div className="billing-plan-current-tag">Current plan</div>
              ) : (
                <button
                  className="billing-upgrade-btn"
                  onClick={upgrade}
                  // disabled={upgrading}
                  disabled={true}
                >
                  {upgrading ? "Upgrading…" : "Upgrade — $14.99"}
                </button>
              )}
            </div>
          </div>

          {/* Refill (paid only) */}
          {isPaid && balance && (
            <div className="billing-refill-section">
              <div className="billing-refill-info">
                <div className="billing-refill-title">Need more Souls?</div>
                <div className="billing-refill-desc">
                  1,000 Souls for ${balance.refill_price_usd} — ~47 chat messages or ~34 training sessions
                </div>
              </div>
              <button
                className="billing-refill-btn"
                onClick={refill}
                disabled={refilling}
              >
                {refilling ? "Adding…" : `Buy 1,000 Souls — $${balance.refill_price_usd}`}
              </button>
            </div>
          )}

          {/* Transaction history */}
          <div className="billing-history">
            <h2 className="billing-history-title">Transaction history</h2>
            {!transactions.length ? (
              <p className="billing-history-empty">No transactions yet.</p>
            ) : (
              <div className="billing-txn-list">
                {transactions.map(txn => (
                  <div key={txn.id} className="billing-txn-row">
                    <div className="billing-txn-left">
                      <div className="billing-txn-reason">
                        {REASON_LABELS[txn.reason] ?? txn.reason}
                      </div>
                      <div className="billing-txn-date">{formatDate(txn.created_at)}</div>
                    </div>
                    <div className={`billing-txn-amount ${txn.amount > 0 ? "billing-txn-credit" : "billing-txn-debit"}`}>
                      {txn.amount > 0 ? "+" : ""}{txn.amount} ✦
                    </div>
                    <div className="billing-txn-balance">
                      {txn.balance_after.toLocaleString()} left
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>{/* end billing-body */}
      </div>
    </DashboardLayout>
  )
}