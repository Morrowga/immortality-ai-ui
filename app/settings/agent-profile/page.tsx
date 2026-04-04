/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter }           from "next/navigation"
import Image                   from "next/image"
import { useAuthStore }        from "@/store/auth"
import DashboardLayout         from "@/components/layout/DashboardLayout"
import { agentAPI, authAPI }   from "@/lib/api"
import { useTranslation }      from "@/locales"
import "@/styles/agent-profile.css"

interface SaveState {
  email:      "idle" | "saving" | "saved" | "error"
  agentName:  "idle" | "saving" | "saved" | "error"
  image:      "idle" | "saving" | "saved" | "error"
}

export default function AgentProfilePage() {
  const router                    = useRouter()
  const { user, displayLanguage } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const lang  = mounted ? displayLanguage : "en"
  const { t } = useTranslation(lang)

  const [email,     setEmail]     = useState("")
  const [agentName, setAgentName] = useState("")
  const [imageUrl,  setImageUrl]  = useState<string | null>(null)
  const [imagePrev, setImagePrev] = useState<string | null>(null)
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [save,      setSave]      = useState<SaveState>({
    email: "idle", agentName: "idle", image: "idle",
  })

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.email) setEmail(user.email)
    agentAPI.me().then(async res => {
      setAgentName(res.data.agent_name || "")
      if (res.data.image_url) {
        const blobUrl = await agentAPI.fetchImage()
        if (blobUrl) setImageUrl(blobUrl)
      }
    }).catch(() => {})
  }, [user])

  // ── Save email ──────────────────────────────────────────────────────────
  const handleSaveEmail = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors(e => ({ ...e, email: t("agentProfile.emailErrorInvalid") }))
      return
    }
    setSave(s => ({ ...s, email: "saving" }))
    try {
      await authAPI.updateMe({ email: email.trim() })
      setSave(s => ({ ...s, email: "saved" }))
      setTimeout(() => setSave(s => ({ ...s, email: "idle" })), 2000)
    } catch (err: any) {
      setErrors(e => ({ ...e, email: err?.response?.data?.detail || t("agentProfile.emailErrorFailed") }))
      setSave(s => ({ ...s, email: "error" }))
      setTimeout(() => setSave(s => ({ ...s, email: "idle" })), 2500)
    }
  }

  // ── Save agent name ─────────────────────────────────────────────────────
  const handleSaveAgentName = async () => {
    if (!agentName.trim()) {
      setErrors(e => ({ ...e, agentName: t("agentProfile.nameErrorEmpty") }))
      return
    }
    setSave(s => ({ ...s, agentName: "saving" }))
    try {
      await agentAPI.updateName(agentName.trim())
      setSave(s => ({ ...s, agentName: "saved" }))
      setTimeout(() => setSave(s => ({ ...s, agentName: "idle" })), 2000)
    } catch (err: any) {
      setErrors(e => ({ ...e, agentName: err?.response?.data?.detail || t("agentProfile.nameErrorFailed") }))
      setSave(s => ({ ...s, agentName: "error" }))
      setTimeout(() => setSave(s => ({ ...s, agentName: "idle" })), 2500)
    }
  }

  // ── Image pick ──────────────────────────────────────────────────────────
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setErrors(err => ({ ...err, image: t("agentProfile.imageErrorSize") }))
      return
    }
    setImagePrev(URL.createObjectURL(file))
    setErrors(err => ({ ...err, image: "" }))
    setSave(s => ({ ...s, image: "saving" }))
    agentAPI.uploadImage(file)
      .then(async () => {
        const blobUrl = await agentAPI.fetchImage()
        if (blobUrl) setImageUrl(blobUrl)
        setImagePrev(null)
        setSave(s => ({ ...s, image: "saved" }))
        setTimeout(() => setSave(s => ({ ...s, image: "idle" })), 2000)
      })
      .catch((err: any) => {
        setErrors(e => ({ ...e, image: err?.response?.data?.detail || t("agentProfile.imageErrorUpload") }))
        setImagePrev(null)
        setSave(s => ({ ...s, image: "error" }))
        setTimeout(() => setSave(s => ({ ...s, image: "idle" })), 2500)
      })
  }

  // ── Image remove ────────────────────────────────────────────────────────
  const handleImageRemove = async () => {
    setSave(s => ({ ...s, image: "saving" }))
    try {
      await agentAPI.deleteImage()
      setImageUrl(null)
      setImagePrev(null)
      setSave(s => ({ ...s, image: "saved" }))
      setTimeout(() => setSave(s => ({ ...s, image: "idle" })), 2000)
    } catch {
      setSave(s => ({ ...s, image: "error" }))
      setTimeout(() => setSave(s => ({ ...s, image: "idle" })), 2500)
    }
  }

  const displayImage = imagePrev || imageUrl

  return (
    <DashboardLayout>
      <div className="pp-root">

        {/* ── Header ── */}
        <div className="pp-header">
          <button className="pp-back" onClick={() => router.back()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            {t("agentProfile.back")}
          </button>
          <h1 className="pp-title">{t("agentProfile.title")}</h1>
          <p className="pp-subtitle">{t("agentProfile.subtitle")}</p>
        </div>

        {/* ── Two-column body ── */}
        <div className="pp-body">

          {/* ── LEFT: Agent Image ── */}
          <section className="pp-card pp-card-image">
            <div className="pp-card-head">
              <div className="pp-card-label">{t("agentProfile.imageSectionLabel")}</div>
              <div className="pp-card-hint">{t("agentProfile.imageSectionHint")}</div>
            </div>

            <div className="pp-image-centered">
              <div
                className="pp-avatar"
                onClick={() => fileRef.current?.click()}
                title={t("agentProfile.imageChange")}
              >
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt="Agent"
                    width={120}
                    height={120}
                    unoptimized
                    className="pp-avatar-img"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div className="pp-avatar-placeholder">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )}
                <div className="pp-avatar-overlay">
                  {save.image === "saving" ? (
                    <div className="pp-spinner" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  )}
                </div>
              </div>

              <div className="pp-image-actions">
                <button
                  className="pp-btn pp-btn-secondary"
                  onClick={() => fileRef.current?.click()}
                  disabled={save.image === "saving"}
                >
                  {save.image === "saving" ? t("agentProfile.imageUploading") :
                   save.image === "saved"  ? t("agentProfile.imageUploaded")  :
                   displayImage            ? t("agentProfile.imageChange")     :
                                            t("agentProfile.imageUpload")}
                </button>

                {displayImage && (
                  <button
                    className="pp-btn pp-btn-ghost pp-btn-danger"
                    onClick={handleImageRemove}
                    disabled={save.image === "saving"}
                  >
                    {t("agentProfile.imageRemove")}
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={handleImagePick}
                />

                <span className="pp-hint-small">{t("agentProfile.imageHint")}</span>
                {errors.image && <div className="pp-field-error">{errors.image}</div>}
              </div>
            </div>
          </section>

          {/* ── RIGHT TOP: Agent Name ── */}
          <section className="pp-card pp-card-name">
            <div className="pp-card-head">
              <div className="pp-card-label">{t("agentProfile.nameSectionLabel")}</div>
              <div className="pp-card-hint">{t("agentProfile.nameSectionHint")}</div>
            </div>

            <div className="pp-field-group">
              <input
                className={`pp-input ${errors.agentName ? "pp-input-err" : ""}`}
                type="text"
                value={agentName}
                onChange={e => {
                  setAgentName(e.target.value)
                  setErrors(err => ({ ...err, agentName: "" }))
                }}
                onKeyDown={e => e.key === "Enter" && handleSaveAgentName()}
                placeholder={t("agentProfile.namePlaceholder")}
                maxLength={255}
              />
              {errors.agentName && <div className="pp-field-error">{errors.agentName}</div>}
              <button
                className="pp-btn pp-btn-primary"
                onClick={handleSaveAgentName}
                disabled={save.agentName === "saving"}
              >
                {save.agentName === "saving" ? t("agentProfile.nameSaving") :
                 save.agentName === "saved"  ? t("agentProfile.nameSaved")  :
                                              t("agentProfile.nameSave")}
              </button>
            </div>
          </section>

          {/* ── RIGHT BOTTOM: Email ── */}
          <section className="pp-card pp-card-email">
            <div className="pp-card-head">
              <div className="pp-card-label">{t("agentProfile.emailSectionLabel")}</div>
              <div className="pp-card-hint">{t("agentProfile.emailSectionHint")}</div>
            </div>

            <div className="pp-field-group">
              <input
                className={`pp-input ${errors.email ? "pp-input-err" : ""}`}
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setErrors(err => ({ ...err, email: "" }))
                }}
                onKeyDown={e => e.key === "Enter" && handleSaveEmail()}
                placeholder={t("agentProfile.emailPlaceholder")}
              />
              {errors.email && <div className="pp-field-error">{errors.email}</div>}
              <button
                className="pp-btn pp-btn-primary"
                onClick={handleSaveEmail}
                disabled={save.email === "saving"}
              >
                {save.email === "saving" ? t("agentProfile.emailSaving") :
                 save.email === "saved"  ? t("agentProfile.emailSaved")  :
                                          t("agentProfile.emailSave")}
              </button>
            </div>
          </section>

        </div>
      </div>
    </DashboardLayout>
  )
}