/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useEffect }    from "react"
import { Brain, Search, Trash2, Clock, Archive, Check, Eye, EyeOff } from "lucide-react"
import { useMemories, type Memory, type TrainingMode, type Section } from "@/hooks/useMemories"
import DashboardLayout            from "@/components/layout/DashboardLayout"
import { useAuthStore }           from "@/store/auth"
import { useTranslation }         from "@/locales"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import "@/styles/memories.css"

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function daysSince(iso: string | null): number {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

// ── Skeletons ──────────────────────────────────────────────────────────────

const SK: React.CSSProperties = {
  borderRadius: 5,
  backgroundColor: "var(--imm-brown-dark)",
  backgroundImage: "linear-gradient(90deg, transparent 25%, var(--imm-brown-dark) 50%, transparent 75%)",
  backgroundSize: "200% 100%",
  animation: "mem-shimmer 1.4s ease-in-out infinite",
  opacity: 0.22,
  flexShrink: 0,
}

function Sk({ w, h, style }: {
  w: number | string
  h: number
  style?: React.CSSProperties
}) {
  return <div style={{ ...SK, width: w, height: h, ...style }} />
}

function StatsSkeleton() {
  return (
    <div className="mem-stats">
      <style>{`
        @keyframes mem-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {[40, 50, 35, 45].map((w, i) => (
        <div key={i} className="mem-stat">
          <Sk w={w} h={20} style={{ marginBottom: 6 }} />
          <Sk w={w * 0.7} h={10} />
        </div>
      ))}
    </div>
  )
}

function MemoryCardsSkeleton() {
  return (
    <>
      <style>{`
        @keyframes mem-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {[80, 60, 70].map((w, i) => (
        <div key={i} className="mem-skeleton-card">
          {/* meta row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Sk w={64} h={10} />
            <Sk w={40} h={10} />
          </div>
          {/* body lines */}
          <Sk w={`${w}%`} h={14} style={{ marginBottom: 8 }} />
          <Sk w="50%" h={14} style={{ marginBottom: 12 }} />
          {/* footer */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <Sk w={48} h={10} />
              <Sk w={40} h={10} />
            </div>
            <Sk w={80} h={10} />
          </div>
        </div>
      ))}
    </>
  )
}

function ReviewDialogSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Sk w="100%" h={80} style={{ borderRadius: 8 }} />
      <Sk w="100%" h={80} style={{ borderRadius: 8 }} />
    </div>
  )
}

// ── Review card ────────────────────────────────────────────────────────────

function ReviewCard({
  memory,
  onKeep,
  onArchive,
  onDelete,
  isLoading,
  t,
}: {
  memory:    Memory
  onKeep:    (id: string) => void
  onArchive: (id: string) => void
  onDelete:  (id: string) => void
  isLoading: boolean
  t:         (key: string) => string
}) {
  const days = daysSince(memory.created_at)

  return (
    <div className="mem-review-card">
      <div className="mem-review-card-header">
        <span className="mem-card-section">{t("memories.reviewSection")}</span>
        <span className="mem-review-age">{t("memories.reviewDaysAgo").replace("{n}", String(days))}</span>
      </div>

      <p className="mem-review-body">
        {memory.what_happened || memory.how_i_felt || "—"}
      </p>

      {memory.instinct_formed && (
        <p className="mem-review-instinct">{memory.instinct_formed}</p>
      )}

      <div className="mem-review-actions">
        <button
          className="mem-review-btn keep"
          onClick={() => onKeep(memory.id)}
          disabled={isLoading}
          title={t("memories.reviewStillTrueTitle")}
        >
          <Check />
          {t("memories.reviewStillTrue")}
        </button>
        <button
          className="mem-review-btn archive"
          onClick={() => onArchive(memory.id)}
          disabled={isLoading}
          title={t("memories.reviewMovePastTitle")}
        >
          <Archive />
          {t("memories.reviewMovePast")}
        </button>
        <button
          className="mem-review-btn delete"
          onClick={() => onDelete(memory.id)}
          disabled={isLoading}
          title={t("memories.reviewRemoveTitle")}
        >
          <Trash2 />
          {t("memories.reviewRemove")}
        </button>
      </div>
    </div>
  )
}

// ── Memory card ────────────────────────────────────────────────────────────

function MemoryCard({
  memory,
  revealed,
  isDeleting,
  deleteLoading,
  onConfirmDelete,
  onCancelDelete,
  onExecuteDelete,
  t,
}: {
  memory:          Memory
  revealed:        boolean
  isDeleting:      boolean
  deleteLoading:   boolean
  onConfirmDelete: (id: string) => void
  onCancelDelete:  () => void
  onExecuteDelete: (id: string) => void
  t:               (key: string) => string
}) {
  const weightPct = `${(memory.feeling_weight / 10) * 100}%`

  function modeLabel(mode: string): string {
    if (mode === "conversation") return t("memories.modeChat")
    if (mode === "correction")   return t("memories.modeCorrection")
    return t("memories.modeManual")
  }

  return (
    <div className={`mem-card ${memory.never_forget ? "pinned" : ""}`}>

      {isDeleting && (
        <div className="mem-delete-confirm">
          <span className="mem-delete-msg">{t("memories.deleteConfirm")}</span>
          <button
            className="mem-delete-yes"
            onClick={() => onExecuteDelete(memory.id)}
            disabled={deleteLoading}
          >
            {deleteLoading ? t("memories.deleteRemoving") : t("memories.deleteRemove")}
          </button>
          <button className="mem-delete-no" onClick={onCancelDelete}>
            {t("memories.deleteCancel")}
          </button>
        </div>
      )}

      <div className="mem-card-header">
        <div className="mem-card-meta">
          {memory.never_forget && (
            <div className="mem-pin-dot" title={t("memories.neverForgetTitle")} />
          )}
          <span className="mem-card-section">{memory.section}</span>
          <span className={`mem-card-mode ${memory.training_mode || "manual"}`}>
            {modeLabel(memory.training_mode)}
          </span>
          {memory.reinforcement_count > 0 && (
            <span className="mem-tag">×{memory.reinforcement_count + 1}</span>
          )}
        </div>

        <div className="mem-card-weight">
          <div className="mem-weight-bar">
            <div className="mem-weight-fill" style={{ width: weightPct }} />
          </div>
          <span className="mem-weight-num">{memory.feeling_weight.toFixed(1)}</span>
          <div className="mem-card-actions">
            <button
              className="mem-action-btn danger"
              title={t("memories.removeTitle")}
              onClick={() => onConfirmDelete(memory.id)}
            >
              <Trash2 />
            </button>
          </div>
        </div>
      </div>

      <p
        className="mem-card-body"
        style={{
          filter:         revealed ? "none" : "blur(6px)",
          userSelect:     revealed ? "auto" : "none",
          transition:     "filter 0.2s ease",
        }}
      >
        {memory.what_happened || memory.how_i_felt || "—"}
      </p>

      <div className="mem-card-footer">
        <div className="mem-card-tags">
          {(memory.pattern_tags || []).slice(0, 4).map(tag => (
            <span key={tag} className="mem-tag">{tag}</span>
          ))}
        </div>
        <span className="mem-card-date">{formatDate(memory.created_at)}</span>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function MemoriesPage() {
  const { displayLanguage, darkMode } = useAuthStore()
  const themeClass = darkMode ? "dark-panel" : "dashboard"

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const lang = mounted ? displayLanguage : "en"
  const { t } = useTranslation(lang)

  const {
    mode, setMode,
    section, setSection,
    search, setSearch,
    memories, total, stats,
    isLoading, statsLoading,
    isSearching,
    offset, hasMore, hasPrev,
    loadMore, loadPrev,
    deletingId, deleteLoading,
    confirmDelete, cancelDelete, executeDelete,
    reviewOpen, openReview, closeReview,
    reviewMemories, reviewLoading,
    reviewCount,
    archiveMutation, reviewDeleteMutation,
    keepMemory,
  } = useMemories()

  const byMode = stats?.by_training_mode ?? {}
  const [revealed, setRevealed] = useState(false)


  function tabCount(key: TrainingMode): number {
    if (key === "all") return stats?.total ?? 0
    return byMode[key] ?? 0
  }

  const MODE_TABS: { key: TrainingMode; label: string }[] = [
    { key: "all",          label: t("memories.tabAll")        },
    { key: "manual",       label: t("memories.tabManual")     },
    { key: "conversation", label: t("memories.tabChat")       },
    { key: "correction",   label: t("memories.tabCorrection") },
  ]

  const SECTION_PILLS: { key: Section; label: string }[] = [
    { key: "all",     label: t("memories.sectionAll")     },
    { key: "BASIC",   label: t("memories.sectionBasic")   },
    { key: "PAST",    label: t("memories.sectionPast")    },
    { key: "PRESENT", label: t("memories.sectionPresent") },
    { key: "FUTURE",  label: t("memories.sectionFuture")  },
  ]

  const reviewActionLoading = archiveMutation.isPending || reviewDeleteMutation.isPending

  return (
    <DashboardLayout>
      <div className={`mem-root ${themeClass}`}>

        {/* ── Header ── */}
        <div className="mem-header">
          <h1 className="mem-title">{t("memories.title")}</h1>
          <p className="mem-subtitle">{t("memories.subtitle")}</p>

          {/* Review banner */}
          {!statsLoading && reviewCount > 0 && (
            <button className="mem-review-banner" onClick={openReview}>
              <Clock className="mem-review-banner-icon" />
              <span>
                <strong>
                  {reviewCount === 1
                    ? t("memories.reviewBannerSingular").replace("{n}", String(reviewCount))
                    : t("memories.reviewBannerPlural").replace("{n}", String(reviewCount))}
                </strong>
                {" "}{t("memories.reviewBannerSub")}
              </span>
              <span className="mem-review-banner-cta">{t("memories.reviewBannerCta")}</span>
            </button>
          )}

          {/* Stats row */}
          {statsLoading ? <StatsSkeleton /> : stats && (
            <div className="mem-stats">
              <div className="mem-stat">
                <span className="mem-stat-value">{stats.total}</span>
                <span className="mem-stat-label">{t("memories.statTotal")}</span>
              </div>
              <div className="mem-stat-divider" />
              <div className="mem-stat">
                <span className="mem-stat-value">{stats.never_forget_count}</span>
                <span className="mem-stat-label">{t("memories.statNeverForget")}</span>
              </div>
              <div className="mem-stat-divider" />
              <div className="mem-stat">
                <span className="mem-stat-value">{stats.avg_weight.toFixed(1)}</span>
                <span className="mem-stat-label">{t("memories.statAvgWeight")}</span>
              </div>
              <div className="mem-stat-divider" />
              <div className="mem-stat">
                <span className="mem-stat-value">{stats.wisdom_score.toFixed(1)}</span>
                <span className="mem-stat-label">{t("memories.statWisdom")}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Toolbar ── */}
        <div className="mem-toolbar">
          <div className="mem-tabs">
            {MODE_TABS.map(tab => (
              <button
                key={tab.key}
                className={`mem-tab ${mode === tab.key ? "active" : ""}`}
                onClick={() => setMode(tab.key)}
              >
                {tab.label}
                <span className="mem-tab-count">{tabCount(tab.key)}</span>
              </button>
            ))}
          </div>

          <div className="mem-search-wrap">
            <Search className="mem-search-icon" />
            <input
              className="mem-search"
              placeholder={t("memories.searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="mem-sections">
            {SECTION_PILLS.map(pill => (
              <button
                key={pill.key}
                className={`mem-section-btn ${section === pill.key ? "active" : ""}`}
                onClick={() => setSection(pill.key)}
              >
                {pill.label}
              </button>
            ))}
          </div>
          <button
            className={`mem-reveal-btn ${revealed ? "active" : ""}`}
            onClick={() => setRevealed(r => !r)}
            title={revealed ? t("memories.hideContent") : t("memories.showContent")}
          >
            {revealed ? <Eye style={{ width: 14, height: 14 }} /> : <EyeOff style={{ width: 14, height: 14 }} />}
          </button>
        </div>

        {/* ── List ── */}
        <div className="mem-list">
          {isLoading && <MemoryCardsSkeleton />}

          {!isLoading && memories.length === 0 && (
            <div className="mem-empty">
              <Brain className="mem-empty-icon" />
              {isSearching
                ? <>
                    <p className="mem-empty-title">{t("memories.emptySearchTitle")}</p>
                    <p className="mem-empty-hint">{t("memories.emptySearchHint")}</p>
                  </>
                : <>
                    <p className="mem-empty-title">{t("memories.emptyTitle")}</p>
                    <p className="mem-empty-hint">{t("memories.emptyHint")}</p>
                  </>
              }
            </div>
          )}

          {!isLoading && memories.map((memory: any) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              revealed={revealed} 
              isDeleting={deletingId === memory.id}
              deleteLoading={deleteLoading}
              onConfirmDelete={confirmDelete}
              onCancelDelete={cancelDelete}
              onExecuteDelete={executeDelete}
              t={t}
            />
          ))}

          {!isLoading && (hasMore || hasPrev) && (
            <div className="mem-load-more">
              {hasPrev && (
                <button className="mem-load-btn" onClick={loadPrev}>
                  {t("memories.pagePrev")}
                </button>
              )}
              {hasMore && (
                <button className="mem-load-btn" onClick={loadMore}>
                  {t("memories.pageLoadMore").replace("{n}", String(total - offset - memories.length))}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Review dialog ── */}
        <Dialog open={reviewOpen} onOpenChange={open => { if (!open) closeReview() }}>
          <DialogContent className="mem-review-dialog">
            <DialogHeader>
              <DialogTitle className="mem-review-dialog-title">
                {t("memories.dialogTitle")}
              </DialogTitle>
              <DialogDescription className="mem-review-dialog-desc">
                {t("memories.dialogDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="mem-review-list">
              {reviewLoading && <ReviewDialogSkeleton />}

              {!reviewLoading && reviewMemories.length === 0 && (
                <div className="mem-review-done">
                  <Check className="mem-review-done-icon" />
                  <p>{t("memories.dialogAllDone")}</p>
                </div>
              )}

              {!reviewLoading && reviewMemories.map((memory: Memory) => (
                <ReviewCard
                  key={memory.id}
                  memory={memory}
                  isLoading={reviewActionLoading}
                  onKeep={keepMemory}
                  onArchive={id => archiveMutation.mutate(id)}
                  onDelete={id => reviewDeleteMutation.mutate(id)}
                  t={t}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}