"use client"
import DashboardLayout      from "@/components/layout/DashboardLayout"
import { AnimatePresence }  from "framer-motion"
import { Loader2 }          from "lucide-react"
import { useVoice }         from "@/hooks/useVoice"
import { VoiceCard }        from "@/components/voice/VoiceCard"
import { VoiceRecordPanel } from "@/components/voice/VoiceRecordPanel"
import { VoiceNotEnabled }  from "@/components/voice/VoiceNotEnabled"
import "@/styles/voice.css"

export default function VoicePage() {
  const v = useVoice()

  return (
    <DashboardLayout>
      <div className="v-page">

        <div className="v-header">
          <div className="v-eyebrow">Settings</div>
          <h1 className="v-title"><em>My Voice</em></h1>
          <p className="v-subtitle">Train your agent to speak in your own voice.</p>
        </div>

        {/* Loading */}
        {v.statusLoading && (
          <div className="v-body">
            <div className="v-content">
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--imm-txt3)", fontSize: 14 }}>
                <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> Loading…
              </div>
            </div>
          </div>
        )}

        {/* Not enabled */}
        {!v.statusLoading && v.status?.enabled === false && <VoiceNotEnabled />}

        {/* Enabled */}
        {!v.statusLoading && v.status?.enabled === true && (
          <div className="v-body">
            <div className="v-content">

              <div className="v-cards">
                <VoiceCard
                  slot          = "native"
                  label         = {v.template?.native?.language_name ?? "Native Language"}
                  status        = {v.nativeStatus}
                  isOptional    = {false}
                  onTrain       = {() => v.openPanel("native")}
                  onRetrain     = {() => v.openPanel("native")}
                  onDelete      = {() => v.deleteMutation.mutate("native")}
                  deleteLoading = {v.deleteMutation.isPending && v.deleteMutation.variables === "native"}
                />
                {v.showEnglish && (
                  <VoiceCard
                    slot          = "en"
                    label         = "English"
                    status        = {v.englishStatus}
                    isOptional    = {true}
                    onTrain       = {() => v.openPanel("en")}
                    onRetrain     = {() => v.openPanel("en")}
                    onDelete      = {() => v.deleteMutation.mutate("en")}
                    deleteLoading = {v.deleteMutation.isPending && v.deleteMutation.variables === "en"}
                  />
                )}
              </div>

              <AnimatePresence>
                {v.activeSlot && v.activeTemplate && (
                  <VoiceRecordPanel
                    key            = {v.activeSlot}
                    panelRef       = {v.panelRef}
                    activeTemplate = {v.activeTemplate}
                    recordState    = {v.recordState}
                    duration       = {v.duration}
                    audioUrl       = {v.audioUrl}
                    removeBg       = {v.removeBg}
                    setRemoveBg    = {v.setRemoveBg}
                    isPending      = {v.cloneMutation.isPending}
                    onStart        = {v.startRecording}
                    onStop         = {v.stopRecording}
                    onReset        = {v.resetRecording}
                    onClose        = {v.closePanel}
                    onSubmit       = {v.submitRecording}
                  />
                )}
              </AnimatePresence>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}