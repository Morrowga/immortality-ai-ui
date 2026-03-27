"use client"
import { useState } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useMutation } from "@tanstack/react-query"
import { trainingAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { ExtractedMemory, TrainingSubmitResponse } from "@/types"
import { Loader2, RotateCcw, Check, ChevronDown, ChevronUp, Star, BookOpen } from "lucide-react"
import { useTranslation } from "@/locales"
import "@/styles/train.css"

type Step = "input" | "review" | "done"

export default function TrainPage() {
  const { user, displayLanguage } = useAuthStore()
  const { t } = useTranslation(displayLanguage)
  const [step, setStep]               = useState<Step>("input")
  const [text, setText]               = useState("")
  const [submitResult, setSubmitResult] = useState<TrainingSubmitResponse | null>(null)
  const [weight, setWeight]           = useState(5)
  const [doneResult, setDoneResult]   = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  const submitMutation = useMutation({
    mutationFn: trainingAPI.submit,
    onSuccess: (res) => {
      setSubmitResult(res.data)
      setWeight(Math.round(res.data.extracted.suggested_weight))
      setStep("review")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to process memory")
    },
  })

  const confirmMutation = useMutation({
    mutationFn: trainingAPI.confirm,
    onSuccess: (res) => {
      setDoneResult(res.data)
      setStep("done")
      if (res.data.duplicate) {
        toast.success("Memory reinforced — you've shared this before")
      } else {
        toast.success("Memory saved")
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to save memory")
    },
  })

  const handleSubmit = () => {
    if (!text.trim()) return
    submitMutation.mutate({ text, mode: "free" })
  }

  const handleConfirm = () => {
    if (!submitResult) return
    confirmMutation.mutate({
      session_id: submitResult.session_id,
      feeling_weight: weight,
      extracted: submitResult.extracted,
    })
  }

  const handleReset = () => {
    setText("")
    setSubmitResult(null)
    setDoneResult(null)
    setStep("input")
    setShowDetails(false)
  }

  const extracted = submitResult?.extracted

  // Step indicator helper
  const stepIndex = step === "input" ? 0 : step === "review" ? 1 : 2
  const steps = ["Write", "Review", "Saved"]

  return (
    <DashboardLayout>
      <div className="t-root">

        {/* ── Header ── */}
        <div className="t-header t-fu">
          <div className="t-eyebrow">Training</div>
          <h1 className="t-title">
            Share a <em>memory</em>
          </h1>
          <p className="t-subtitle">
            Tell your agent something real. A feeling, a belief, a moment that shaped you.
          </p>
        </div>

        {/* ── Step indicator ── */}
        <div className="t-steps t-fu">
          {steps.map((label, i) => {
            const isDone   = step === "done" || i < stepIndex
            const isActive = step !== "done" && i === stepIndex
            return (
              <>
                <div
                  key={label}
                  className={`t-step ${isActive ? "active" : isDone ? "done" : ""}`}
                >
                  <div className="t-step-dot">
                    {isDone ? <Check style={{ width: 10, height: 10 }} /> : i + 1}
                  </div>
                  {label}
                </div>
                {i < steps.length - 1 && (
                  <div
                    key={`line-${i}`}
                    className="t-step-line"
                    style={{ background: isDone ? "var(--imm-green)" : "var(--imm-bdr)" }}
                  />
                )}
              </>
            )
          })}
        </div>

        {/* ────────────────────────────────
            STEP 1 — INPUT
            ──────────────────────────────── */}
        {step === "input" && (
          <div className="t-input-wrap t-fu">
            <div className="t-textarea-card">
              <textarea
                className="t-textarea"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Tell me something about yourself. A memory, a belief, how you feel about something. Speak naturally — like you're talking to someone who wants to understand you."
                rows={9}
              />
              <div className="t-textarea-footer">
                <span className="t-char-count">{text.length} characters</span>
                <button
                  className="t-btn-primary"
                  onClick={handleSubmit}
                  disabled={!text.trim() || submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> Processing…</>
                  ) : (
                    <><BookOpen style={{ width: 15, height: 15 }} /> Process Memory</>
                  )}
                </button>
              </div>
            </div>

            <p className="t-hint">
              You can write in any language. The system handles translation automatically.
            </p>
          </div>
        )}

        {/* ────────────────────────────────
            STEP 2 — REVIEW
            ──────────────────────────────── */}
        {step === "review" && extracted && (
          <>
            <div className="t-review-grid t-fu">

              {/* Left: captured feelings */}
              <div className="t-capture-card">
                <div className="imm-label">What the system captured</div>

                {[
                  { label: "What happened",  value: extracted.what_happened },
                  { label: "How you felt",   value: extracted.how_i_felt },
                  { label: "Why it mattered",value: extracted.why_it_mattered },
                  { label: "What you learned",value: extracted.what_i_learned },
                  { label: "Instinct formed", value: extracted.instinct_formed },
                ].map(item => (
                  <div className="t-capture-row" key={item.label}>
                    <div className="t-capture-label">{item.label}</div>
                    <div className="t-capture-value">{item.value}</div>
                  </div>
                ))}

                {/* Original language toggle */}
                {extracted.what_happened_original !== extracted.what_happened && (
                  <>
                    <button
                      className="t-original-toggle"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      Original language version
                      {showDetails
                        ? <ChevronUp style={{ width: 13, height: 13 }} />
                        : <ChevronDown style={{ width: 13, height: 13 }} />}
                    </button>
                    {showDetails && (
                      <p className="t-original-text">{extracted.what_happened_original}</p>
                    )}
                  </>
                )}
              </div>

              {/* Right: weight + meta */}
              <div className="t-side-panel">

                {/* Weight slider */}
                <div className="t-weight-card">
                  <div className="t-weight-header">
                    <span className="t-weight-title">Memory weight</span>
                    <span className="t-weight-value">
                      {weight.toFixed(1)}<span>/10</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    className="t-slider"
                    min={1}
                    max={10}
                    step={0.1}
                    value={weight}
                    onChange={e => setWeight(parseFloat(e.target.value))}
                  />
                  <div className="t-slider-labels">
                    <span>Minor</span>
                    <span>Life-defining</span>
                  </div>
                  {weight >= 8.5 && (
                    <div className="t-never-forget">
                      <Star style={{ width: 12, height: 12 }} />
                      Marked as never forget
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="t-meta-card">
                  <div className="t-meta-row">
                    <span className="t-meta-key">Section</span>
                    <span className="t-meta-val">{extracted.section}</span>
                  </div>
                  {extracted.is_core_memory && (
                    <div className="t-meta-row">
                      <span className="t-meta-key">Type</span>
                      <span className="t-meta-val core">Core memory</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {extracted.pattern_tags?.length > 0 && (
                  <div className="t-tags">
                    {extracted.pattern_tags.map((tag: string) => (
                      <span className="t-tag" key={tag}>{tag}</span>
                    ))}
                  </div>
                )}

              </div>
            </div>

            {/* Actions */}
            <div className="t-review-actions t-fu">
              <button className="t-btn-ghost" onClick={handleReset}>
                <RotateCcw /> Start over
              </button>
              <button
                className="t-btn-primary"
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? (
                  <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> Saving…</>
                ) : (
                  <><Check style={{ width: 15, height: 15 }} /> Confirm & save</>
                )}
              </button>
            </div>
          </>
        )}

        {/* ────────────────────────────────
            STEP 3 — DONE
            ──────────────────────────────── */}
        {step === "done" && doneResult && (
          <div className="t-done-wrap t-fu">
            <div className="t-done-card">
              <div className="t-done-icon">
                <Check />
              </div>

              {doneResult.duplicate ? (
                <>
                  <div className="t-done-label">Memory reinforced</div>
                  <p className="t-reinforced-text">{doneResult.existing_memory}</p>
                  <p className="t-reinforced-meta">
                    You've shared this {doneResult.reinforcement_count} time{doneResult.reinforcement_count > 1 ? "s" : ""} now.
                    Weight increased to {doneResult.new_weight?.toFixed(1)}.
                  </p>
                </>
              ) : (
                <>
                  <div className="t-done-label">Your agent says</div>
                  <p className="t-acknowledgment">"{doneResult.acknowledgment}"</p>
                </>
              )}
            </div>

            <div className="t-done-actions">
              <button className="t-btn-primary" onClick={handleReset}>
                <BookOpen style={{ width: 15, height: 15 }} /> Train another memory
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}