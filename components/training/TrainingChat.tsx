/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { useState, useRef, useEffect }  from "react"
import { useTraining }                  from "@/hooks/useTraining"
import { TypingIndicator }              from "@/components/training/TrainingIndicator"
import { InputRow }                     from "@/components/training/InputRow"
import { WeightSlider }                 from "@/components/training/WeightSlider"
import { YesNoRow }                     from "@/components/training/YesNoRow"
import { agentAPI }                     from "@/lib/api"

type Phase = "input" | "processing" | "review" | "saving" | "done"

interface Message {
  who:   "agent" | "user"
  text:  string
  html?: string
}

interface Props {
  training: ReturnType<typeof useTraining>
  t:        (k: string) => string
}

function buildReviewHtml(
  extracted: NonNullable<ReturnType<typeof useTraining>["extracted"]>,
  t: (k: string) => string
) {
  const rows = [
    [t("train.reviewFieldWhatHappened"),   extracted.what_happened  ],
    [t("train.reviewFieldHowIFelt"),        extracted.how_i_felt     ],
    [t("train.reviewFieldWhyItMattered"),   extracted.why_it_mattered],
    [t("train.reviewFieldWhatILearned"),    extracted.what_i_learned ],
    [t("train.reviewFieldInstinctFormed"),  extracted.instinct_formed],
  ]

  const fields = rows
    .map(([label, value]) => `
      <div class="tc-review-row">
        <span class="tc-review-label">${label}</span>
        <span class="tc-review-value">${value}</span>
      </div>
    `)
    .join("")

  const tags = (extracted.pattern_tags ?? [])
    .map(tag => `<span class="tc-tag">${tag}</span>`)
    .join("")

  return `
    <div class="tc-review-fields">${fields}</div>
    ${tags ? `<div class="tc-tags">${tags}</div>` : ""}
    <p class="tc-review-question">${t("train.reviewQuestion")}</p>
  `
}

export function TrainingChat({ training, t }: Props) {
  const [phase, setPhase]           = useState<Phase>("input")
  const [messages, setMessages]     = useState<Message[]>([])
  const [inputVal, setInputVal]     = useState("")
  const [agentImg, setAgentImg]     = useState<string | null>(null)
  const bottomRef                   = useRef<HTMLDivElement>(null)

  // Init messages with translation
  useEffect(() => {
    setMessages([{ who: "agent", text: t("train.chatInitialMessage") }])
  }, [t])

  // Fetch the agent image once on mount
  useEffect(() => {
    agentAPI.fetchImage().then(setAgentImg)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, phase])

  // Watch for step → review
  useEffect(() => {
    if (training.step === "review" && training.extracted) {
      setPhase("review")
      pushAgent("", buildReviewHtml(training.extracted, t))
    }
  }, [training.step, training.extracted])

  // Watch for step → done (triggered after saving)
  useEffect(() => {
    if (training.step === "done" && training.doneResult) {
      setPhase("done")
      if (training.doneResult.duplicate) {
        pushAgent(
          t("train.chatReinforcedMessage").replace("{count}", String(training.doneResult.reinforcement_count))
        )
      } else {
        pushAgent(t("train.chatSavedMessage"))
      }
    }
  }, [training.step, training.doneResult])

  function pushAgent(text: string, html?: string) {
    setMessages(prev => [...prev, { who: "agent", text, html }])
  }

  function pushUser(text: string) {
    setMessages(prev => [...prev, { who: "user", text }])
  }

  async function handleSend() {
    const val = inputVal.trim()
    if (!val) return
    pushUser(val)
    setInputVal("")
    setPhase("processing")
    training.setText(val)
    training.submitMutation.mutate({ text: val, mode: "manual" })
  }

  function handleYes() {
    pushUser(t("train.chatUserYesSave"))
    setPhase("saving")
    training.handleConfirm()
  }

  function handleNo() {
    pushUser(t("train.chatUserNoReenter"))
    pushAgent(t("train.chatReenterMessage"))
    training.handleReset()
    setPhase("input")
  }

  function handleMore() {
    pushUser(t("train.chatUserYesMore"))
    pushAgent(t("train.chatInitialMessage"))
    training.handleReset()
    setPhase("input")
  }

  function handleDone() {
    training.handleReset()
    setMessages([{ who: "agent", text: t("train.chatInitialMessage") }])
    setInputVal("")
    setPhase("input")
  }

  // Reusable agent avatar: image if available, fallback to "AI" text
  const AgentAvatar = () => (
    <div className="tc-avatar">
      {agentImg
        ? <img src={agentImg} alt="Agent" className="tc-avatar-img" />
        : "AI"
      }
    </div>
  )

  return (
    <div className="tc-root">

      <div className="tc-messages">
        {messages.map((m, i) => (
          <div key={i} className={`tc-row ${m.who}`}>
            {m.who === "agent" && <AgentAvatar />}
            <div
              className={`tc-bubble ${m.who}`}
              dangerouslySetInnerHTML={m.html ? { __html: m.html } : undefined}
            >
              {!m.html ? m.text : undefined}
            </div>
          </div>
        ))}

        {(phase === "processing" || phase === "saving") && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="tc-footer">
        {phase === "input" && (
          <InputRow
            value={inputVal}
            onChange={setInputVal}
            onSend={handleSend}
          />
        )}

        {phase === "review" && (
          <>
            <WeightSlider
              weight={training.weight}
              setWeight={training.setWeight}
              t={t}
            />
            <YesNoRow
              onYes={handleYes}
              onNo={handleNo}
            />
          </>
        )}

        {phase === "saving" && (
          <div className="tc-saving-hint">
            {t("train.chatSavingHint")}
          </div>
        )}

        {phase === "done" && (
          <YesNoRow
            yesLabel={t("train.chatYesTellMore")}
            noLabel={t("train.chatNoDone")}
            onYes={handleMore}
            onNo={handleDone}
          />
        )}
      </div>

    </div>
  )
}