/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { useState, useEffect, memo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useMutation } from "@tanstack/react-query"
import { authAPI, setToken } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { useTranslation } from "@/locales"
import { Loader2, ArrowLeft, LogIn } from "lucide-react"
import { GlitchTitle } from "@/components/landing/GlitchTitle"
import "@/styles/home.css"

const RainCanvas = memo(dynamic(
  () => import("@/components/landing/RainCanvas").then(m => ({ default: m.RainCanvas })),
  { ssr: false }
))

const MemoryStack = memo(dynamic(
  () => import("@/components/landing/MemoryStack").then(m => ({ default: m.MemoryStack })),
  { ssr: false }
))

export default function LoginPage() {
  const router = useRouter()
  const { user, isLoading, setAuth } = useAuthStore()
  const { t } = useTranslation(user?.language ?? "en")

  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (!isLoading && user) router.push("/dashboard")
  }, [user, isLoading])

  const mutation = useMutation({
    mutationFn: async () => {
      const loginRes = await authAPI.login({ email, password })
      setToken(loginRes.data.access_token)
      const meRes = await authAPI.me()
      return { ...loginRes.data, language: meRes.data.language }
    },
    onSuccess: (data) => {
      const { access_token, user_id, name, agent_id, language } = data
      setAuth(
        { id: user_id, name, email, language, agent_id },
        access_token
      )
      router.push("/dashboard")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Login failed")
    },
  })

  if (isLoading) return null

  return (
    <main className="auth-shell">
      <RainCanvas />

      {/* ── Left ── */}
      <div className="auth-left">
        <div className="title-block">
          <GlitchTitle text="IMMORTAL AI" speed={200} />
        </div>
        <MemoryStack />
        <div className="auth-corner auth-corner-tl" />
        <div className="auth-corner auth-corner-bl" />
      </div>

      {/* ── Right: form ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          <Link href="/" className="auth-back">
            <ArrowLeft /> <img src="/logo/logo-light.png" alt="Immortality" style={{ width: '100px', height: 'auto' }} />
          </Link>
          
          <h1 className="auth-heading">
            Welcome <em>back</em>
          </h1>
          <p className="auth-subheading">{t("auth.loginSubtitle")}</p>

          <form
            className="auth-form"
            onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}
          >
            <div className="auth-field">
              <label className="auth-label">{t("auth.email")}</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">{t("auth.password")}</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> {t("auth.signingIn")}</>
                : <><LogIn style={{ width: 15, height: 15 }} /> {t("auth.signIn")}</>
              }
            </button>
          </form>

          <p className="auth-footer">
            {t("auth.noAccount")}{" "}
            <Link href="/register">{t("auth.beginJourney")}</Link>
          </p>

        </div>
      </div>

    </main>
  )
}