"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { authAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { useTranslation } from "@/locales"
import { Loader2, ArrowLeft, Sparkles, Circle } from "lucide-react"
import "@/styles/auth.css"

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "my", label: "Burmese" },
  { code: "th", label: "Thai" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "ar", label: "Arabic" },
  { code: "id", label: "Indonesian" },
]

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    language: "en",
  })

  // Use selected language in real time as user picks it
  const { t } = useTranslation(form.language)

  const mutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (res) => {
      const { access_token, user_id, name, agent_id } = res.data
      setAuth(
        { id: user_id, name, email: form.email, language: form.language, agent_id },
        access_token
      )
      router.push("/survey")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Registration failed")
    },
  })

  const fields = [
    { key: "name",     label: t("auth.name"),     type: "text",     placeholder: t("auth.namePlaceholder") },
    { key: "email",    label: t("auth.email"),    type: "email",    placeholder: t("auth.emailPlaceholder") },
    { key: "password", label: t("auth.password"), type: "password", placeholder: t("auth.passwordPlaceholder") },
  ]

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
            Begin your<br /><em>legacy</em>
          </h2>
          <p className="auth-left-sub">
            Share your memories, feelings, and stories. Your agent learns what makes you — so the people who love you never have to say goodbye.
          </p>
          <div className="auth-left-quote">
            <p>
              "Every memory you share becomes a part of something that will outlast you."
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
            Create your <em>agent</em>
          </h1>
          <p className="auth-subheading">{t("auth.registerSubtitle")}</p>

          <form
            className="auth-form"
            onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }}
          >
            {/* Language selector first — so UI switches immediately */}
            <div className="auth-field">
              <label className="auth-label">{t("auth.primaryLanguage")}</label>
              <select
                className="auth-select"
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="auth-divider" />

            {fields.map(field => (
              <div key={field.key} className="auth-field">
                <label className="auth-label">{field.label}</label>
                <input
                  className="auth-input"
                  type={field.type}
                  value={(form as any)[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              className="auth-submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> {t("auth.creatingAgent")}</>
                : <><Circle style={{ width: 15, height: 15 }} /> {t("auth.createAgent")}</>
              }
            </button>
          </form>

          <p className="auth-footer">
            {t("auth.alreadyStarted")}{" "}
            <Link href="/login">{t("auth.signInLink")}</Link>
          </p>

        </div>
      </div>

    </main>
  )
}