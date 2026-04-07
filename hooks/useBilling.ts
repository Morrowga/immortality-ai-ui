"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useBillingContext } from "@/contexts/BillingContext"

export interface BillingBalance {
  plan:             string
  souls_balance:    number
  tester_cap:       number | null
  balance_pct:      number | null
  can_refill:       boolean
  can_train:        boolean
  can_chat:         boolean
  cost_training:    number
  cost_chat_en:     number
  cost_chat_intl:   number
  refill_souls:     number
  refill_price_usd: number
}

export interface Transaction {
  id:            string
  amount:        number
  reason:        string
  balance_after: number
  meta:          Record<string, unknown> | null
  created_at:    string
}

export interface UpgradeResult {
  message: string
  plan:    string
  balance: number
  granted: number
}

export interface RefillResult {
  message:  string
  balance:  number
  credited: number
}

export const BILLING_KEYS = {
  balance: ["billing", "balance"] as const,
  history: ["billing", "history"] as const,
}

// Pages exempt from dialog checks
// const EXEMPT_PATHS = ["/settings/billing", "/login", "/register", "/setup"]

// function isExempt(pathname: string): boolean {
//   return EXEMPT_PATHS.some(p => pathname.startsWith(p))
// }

export function useBilling() {
  const qc       = useQueryClient()
  const router   = useRouter()

  const { soulsDialogOpen, setSoulsDialogOpen } = useBillingContext()

  const {
    data:      balance,
    isLoading: balanceLoading,
    refetch:   refetchBalance,
  } = useQuery<BillingBalance>({
    queryKey:  BILLING_KEYS.balance,
    queryFn:   () => api.get("/api/billing/balance").then(r => r.data),
    staleTime: 1000 * 30,
    gcTime:    1000 * 60 * 5,
  })

  const {
    data:      historyData,
    isLoading: historyLoading,
    refetch:   refetchHistory,
  } = useQuery<{ transactions: Transaction[] }>({
    queryKey:  BILLING_KEYS.history,
    queryFn:   () => api.get("/api/billing/history").then(r => r.data),
    staleTime: 1000 * 60,
    gcTime:    1000 * 60 * 10,
  })

  const invalidateBalance = () =>
    qc.invalidateQueries({ queryKey: BILLING_KEYS.balance })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: BILLING_KEYS.balance })
    qc.invalidateQueries({ queryKey: BILLING_KEYS.history })
  }

  const upgradeMutation = useMutation<UpgradeResult>({
    mutationFn: () => api.post("/api/billing/upgrade").then(r => r.data),
    onSuccess:  () => invalidateAll(),
  })

  const refillMutation = useMutation<RefillResult>({
    mutationFn: () => api.post("/api/billing/refill").then(r => r.data),
    onSuccess:  () => invalidateAll(),
  })

  const goToBilling = () => {
    setSoulsDialogOpen(false)
    router.push("/settings/billing")
  }

  const isPaid     = balance?.plan === "paid"
  const isLow      = (balance?.souls_balance ?? 999) < 100
  const isCritical = (balance?.souls_balance ?? 999) < 30
  const pct        = balance?.balance_pct ?? 100

  return {
    balance,
    transactions:    historyData?.transactions ?? [],
    balanceLoading,
    historyLoading,
    isPaid,
    isLow,
    isCritical,
    pct,
    soulsDialogOpen,
    setSoulsDialogOpen,
    goToBilling,
    upgrade:          () => upgradeMutation.mutate(),
    refill:           () => refillMutation.mutate(),
    invalidateBalance,
    invalidateAll,
    refetchBalance,
    refetchHistory,
    upgrading:    upgradeMutation.isPending,
    refilling:    refillMutation.isPending,
    upgradeError: upgradeMutation.error,
    refillError:  refillMutation.error,
    upgradeData:  upgradeMutation.data,
    refillData:   refillMutation.data,
  }
}