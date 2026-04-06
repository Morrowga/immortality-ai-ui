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

function buildReviewHtml(extracted: NonNullable<ReturnType<typeof useTraining>["extracted"]>) {
  const rows = [
    ["What happened",   extracted.what_happened  ],
    ["How I felt",      extracted.how_i_felt     ],
    ["Why it mattered", extracted.why_it_mattered],
    ["What I learned",  extracted.what_i_learned ],
    ["Instinct formed", extracted.instinct_formed],
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
    <p class="tc-review-question">Should I install this into my memory?</p>
  `
}

const INITIAL_MESSAGES: Message[] = [
  { who: "agent", text: "What memory would you like to share with me?" },
]

export function TrainingChat({ training, t }: Props) {
  const [phase, setPhase]           = useState<Phase>("input")
  const [messages, setMessages]     = useState<Message[]>(INITIAL_MESSAGES)
  const [inputVal, setInputVal]     = useState("")
  const [agentImg, setAgentImg]     = useState<string | null>(null)
  const bottomRef                   = useRef<HTMLDivElement>(null)

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
      pushAgent("", buildReviewHtml(training.extracted))
    }
  }, [training.step, training.extracted])

  // Watch for step → done (triggered after saving)
  useEffect(() => {
    if (training.step === "done" && training.doneResult) {
      setPhase("done")
      if (training.doneResult.duplicate) {
        pushAgent(
          `This memory has been reinforced — strengthened ${training.doneResult.reinforcement_count} times now. Would you like to tell me more?`
        )
      } else {
        pushAgent("Your memory is successfully installed in my brain. Would you like to tell me more?")
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
    pushUser("Yes, save it")
    setPhase("saving")
    training.handleConfirm()
  }

  function handleNo() {
    pushUser("No, let me re-enter")
    pushAgent("Of course — please tell me what you'd like to say.")
    training.handleReset()
    setPhase("input")
  }

  function handleMore() {
    pushUser("Yes, I have more to share")
    pushAgent("What memory would you like to share with me?")
    training.handleReset()
    setPhase("input")
  }

  function handleDone() {
    training.handleReset()
    setMessages(INITIAL_MESSAGES)
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
            Saving to memory...
          </div>
        )}

        {phase === "done" && (
          <YesNoRow
            yesLabel="Yes, tell more"
            noLabel="No, I'm done"
            onYes={handleMore}
            onNo={handleDone}
          />
        )}
      </div>

    </div>
  )
}