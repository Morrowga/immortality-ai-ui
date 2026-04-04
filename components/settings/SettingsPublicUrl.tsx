import { motion } from "framer-motion"
import { Copy, Check, ExternalLink, Pencil, X, Loader2 } from "lucide-react"

interface Props {
  agent:          { slug?: string } | null
  publicUrl:      string | null
  editingSlug:    boolean
  slugInput:      string
  slugErr:        string | null
  copiedSlug:     boolean
  isPending:      boolean
  setSlugInput:   (v: string) => void
  setSlugErr:     (v: string | null) => void
  setEditingSlug: (v: boolean) => void
  openSlugEdit:   () => void
  copyUrl:        () => void
  handleSlugSave: () => void
  t:              (key: string) => string
}

export function SettingsPublicUrl({
  agent, publicUrl,
  editingSlug, slugInput, slugErr, copiedSlug, isPending,
  setSlugInput, setSlugErr, setEditingSlug,
  openSlugEdit, copyUrl, handleSlugSave, t,
}: Props) {
  const origin = typeof window !== "undefined" ? window.location.origin : ""

  return (
    <div className="st-card">
      <div className="st-card-title">{t("settings.publicLinkTitle")}</div>
      <p className="st-card-sub">{t("settings.publicLinkSub")}</p>

      {!editingSlug ? (
        <div className="st-slug-row">
          <div className="st-slug-display">
            <span className="st-slug-origin">{origin}/</span>
            <span className="st-slug-value">{agent?.slug || "—"}</span>
          </div>
          <div className="st-slug-actions">
            {publicUrl && (
              <>
                <button className="st-icon-btn" onClick={copyUrl} title={t("settings.copyLink")}>
                  {copiedSlug
                    ? <Check style={{ width: 14, height: 14, color: "#4aaa72" }} />
                    : <Copy  style={{ width: 14, height: 14 }} />}
                </button>
                <a className="st-icon-btn" href={publicUrl} target="_blank"
                  rel="noopener noreferrer" title={t("settings.openNewTab")}>
                  <ExternalLink style={{ width: 14, height: 14 }} />
                </a>
              </>
            )}
            <button className="st-icon-btn" onClick={openSlugEdit} title={t("settings.editSlug")}>
              <Pencil style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="st-slug-edit"
        >
          <div className="st-slug-edit-row">
            <span className="st-slug-prefix">{origin}/</span>
            <input
              className="st-slug-input"
              value={slugInput}
              onChange={e => { setSlugInput(e.target.value.toLowerCase()); setSlugErr(null) }}
              onKeyDown={e => {
                if (e.key === "Enter")  handleSlugSave()
                if (e.key === "Escape") setEditingSlug(false)
              }}
              placeholder={t("settings.slugPlaceholder")}
              autoFocus
              spellCheck={false}
            />
          </div>
          {slugErr && <p className="st-field-err">{slugErr}</p>}
          <p className="st-slug-hint">{t("settings.slugHint")}</p>
          <div className="st-slug-edit-actions">
            <button className="st-btn-ghost"
              onClick={() => { setEditingSlug(false); setSlugErr(null) }}>
              <X style={{ width: 13, height: 13 }} /> {t("settings.cancel")}
            </button>
            <button className="st-btn-primary" onClick={handleSlugSave}
              disabled={!slugInput.trim() || isPending}>
              {isPending
                ? <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />
                : <Check style={{ width: 13, height: 13 }} />}
              {t("settings.save")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}