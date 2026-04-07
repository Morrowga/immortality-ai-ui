/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { trainingAPI } from "@/lib/api"
import { toast } from "sonner"
import { TrainingSubmitResponse } from "@/types"

export type TrainingStep = "input" | "review" | "done"

export function useTraining() {
  const [step,         setStep]         = useState<TrainingStep>("input")
  const [text,         setText]         = useState("")
  const [submitResult, setSubmitResult] = useState<TrainingSubmitResponse | null>(null)
  const [weight,       setWeight]       = useState(5)
  const [doneResult,   setDoneResult]   = useState<any>(null)
  const [showDetails,  setShowDetails]  = useState(false)

  const submitMutation = useMutation({
    mutationFn: trainingAPI.submit,
    onSuccess: (res) => {
      setSubmitResult(res.data)
      setWeight(Math.round(res.data.extracted.suggested_weight))
      setStep("review")

      // Show souls deducted toast
      const souls = res.data.souls_deducted
      if (souls != null) {
        toast(`-${souls} Souls`, {
          description: "Deducted for training",
        })
      }
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail
      // Handle souls depleted (402)
      if (err.response?.status === 402) {
        const code = typeof detail === "object" ? detail?.code : null
        const msg  = typeof detail === "object" ? detail?.message : detail
        toast.error(msg || "Not enough Souls to train")
        return
      }
      toast.error(typeof detail === "string" ? detail : "Failed to process memory")
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
      session_id:     submitResult.session_id,
      feeling_weight: weight,
      extracted: submitResult.extracted as unknown as Record<string, unknown>,
    })
  }

  const handleReset = () => {
    setText("")
    setSubmitResult(null)
    setDoneResult(null)
    setStep("input")
    setShowDetails(false)
  }

  return {
    // state
    step, text, setText,
    submitResult, weight, setWeight,
    doneResult, showDetails, setShowDetails,
    // mutations
    submitMutation, confirmMutation,
    // handlers
    handleSubmit, handleConfirm, handleReset,
    // derived
    extracted:  submitResult?.extracted ?? null,
    stepIndex:  step === "input" ? 0 : step === "review" ? 1 : 2,
  }
}