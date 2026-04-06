// hooks/useOnboardingGuard.ts

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery }  from "@tanstack/react-query"
import { surveyAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"

export function useOnboardingGuard() {
  const router = useRouter()
  const user   = useAuthStore(s => s.user)

  const { data: status, isLoading } = useQuery({
    queryKey:        ["survey-status"],
    queryFn:         () => surveyAPI.me().then(r => r.data),
    enabled:         !!user,
    // Don't cache stale data — we need the real current step
    staleTime:       0,
    // Retry quickly; this is a blocking check
    retry:           1,
    retryDelay:      500,
  })

  useEffect(() => {
    if (!status) return

    if (!status.is_completed) {
      router.replace("/setup/survey")
      return
    }

    if (status.onboarding_step === "pronoun_setup") {
      router.replace("/setup/pronouns")
      return
    }

    // onboarding_step === "ready" — let the page render
  }, [status, router])

  // Still checking: either waiting for the user to load or the query to resolve
  const checking = !user || isLoading || (
    // status came back but we haven't redirected yet (effect fires async)
    !!status && (
      !status.is_completed ||
      status.onboarding_step === "pronoun_setup"
    )
  )

  return { checking }
}