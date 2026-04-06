/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { useState, useEffect, memo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useMutation } from "@tanstack/react-query"
import { authAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { useTranslation } from "@/locales"
import { Loader2, ArrowLeft, Circle } from "lucide-react"
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

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "my", label: "Burmese" },
  { code: "th", label: "Thai" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "ar", label: "Arabic" },
  { code: "vi", label: "Vietnamese" },
  { code: "ru", label: "Russia" },
]

const GENDERS = [
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
]

export default function RegisterPage() {
  const router = useRouter()
  const { user, isLoading, setAuth } = useAuthStore()

  useEffect(() => {
    if (!isLoading && user) router.push("/dashboard")
  }, [user, isLoading])

  // Split state so useTranslation only re-runs when language changes, not on every keystroke
  const [language, setLanguage] = useState("en")
  const [gender, setGender]     = useState("male")
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")

  const { t } = useTranslation(language)

  const mutation = useMutation({
    mutationFn: () => authAPI.register({ name, email, password, language, gender }),
    onSuccess: (res) => {
      const { access_token, user_id, name: resName, agent_id } = res.data
      setAuth(
        { id: user_id, name: resName, email, language, agent_id },
        access_token
      )
      router.push("/setup/survey")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Registration failed")
    },
  })

  if (isLoading) return null

  return (
    <main className="auth-shell">
      <RainCanvas />

      {/* ── Left ── */}
      <div className="auth-left">
        <div className="title-block">
          <GlitchTitle text="IMMORTAL AI" speed={80} />
        </div>
        <MemoryStack />
        <div className="auth-corner auth-corner-tl" />
        <div className="auth-corner auth-corner-bl" />
      </div>

      {/* ── Right: form ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          <Link href="/" className="auth-back">
            <ArrowLeft /> Immortality
          </Link>

          <h1 className="auth-heading">Create your <em>agent</em></h1>
          <p className="auth-subheading">{t("auth.registerSubtitle")}</p>

          <form
            className="auth-form"
            onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}
          >
            {/* Name + Language on same line */}
            <div className="auth-field-row">
              <div className="auth-field">
                <label className="auth-label">{t("auth.name")}</label>
                <input
                  className="auth-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t("auth.namePlaceholder")}
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">{t("auth.primaryLanguage")}</label>
                <select
                  className="auth-select"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Gender</label>
              <div className="auth-gender-row">
                {GENDERS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    className={`auth-gender-btn ${gender === g.value ? "selected" : ""}`}
                    onClick={() => setGender(g.value)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-divider" />

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