"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { authAPI, setToken } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { useTranslation } from "@/locales"
import { Loader2, ArrowLeft, LogIn } from "lucide-react"
import "@/styles/auth.css"

export default function LoginPage() {
  const router = useRouter()
  const { user: storedUser, setAuth } = useAuthStore()
  const { t } = useTranslation(storedUser?.language || "en")
  const [form, setForm] = useState({ email: "", password: "" })

  const mutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const loginRes = await authAPI.login(formData)
      setToken(loginRes.data.access_token)
      const meRes = await authAPI.me()
      return { ...loginRes.data, language: meRes.data.language }
    },
    onSuccess: (data) => {
      const { access_token, user_id, name, agent_id, language } = data
      setAuth(
        { id: user_id, name, email: form.email, language, agent_id },
        access_token
      )
      router.push("/dashboard")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Login failed")
    },
  })

  return (
    <main className="auth-shell">

      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-left-orb" />
        <div className="auth-left-orb2" />

        <div className="auth-brand">
          imm<span>or</span>tality
        </div>

        <div className="auth-left-body">
          <h2 className="auth-left-headline">
            Your memories,<br /><em>living on</em>
          </h2>
          <p className="auth-left-sub">
            Train an AI agent on everything that makes you — your feelings, stories, and instincts. So the people who love you can still feel your presence.
          </p>
          <div className="auth-left-quote">
            <p>
              "I want an AI that knows my feelings, my attitude, my problems — and still sounds like me."
            </p>
          </div>
        </div>

        <p className="auth-left-footer">
          Your memories are stored securely and never shared.
        </p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          <Link href="/" className="auth-back">
            <ArrowLeft /> Immortality
          </Link>

          <h1 className="auth-heading">
            Welcome <em>back</em>
          </h1>
          <p className="auth-subheading">{t("auth.loginSubtitle")}</p>

          <form
            className="auth-form"
            onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }}
          >
            <div className="auth-field">
              <label className="auth-label">{t("auth.email")}</label>
              <input
                className="auth-input"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">{t("auth.password")}</label>
              <input
                className="auth-input"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
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