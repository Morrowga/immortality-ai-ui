"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { neoAPI, NeoPackage } from "@/lib/api"
import { toast } from "sonner"

export function useNeo() {
  const qc = useQueryClient()

  const [installModalOpen, setInstallModalOpen] = useState(false)
  const [customModalOpen, setCustomModalOpen]   = useState(false)
  const [editInstrTarget, setEditInstrTarget]   = useState<NeoPackage | null>(null)

  const [customTitle, setCustomTitle]     = useState("")
  const [customContent, setCustomContent] = useState("")
  const [customSlot, setCustomSlot]       = useState<number>(1)
  const [autoError, setAutoError]         = useState<string | null>(null)

  const [editInstrText, setEditInstrText] = useState("")
  const [preSelectedSlot, setPreSelectedSlot] = useState<number>(1)

  // ── Uninstall confirm state (replaces alert) ─────────────────────────────
  const [uninstallTarget, setUninstallTarget] = useState<NeoPackage | null>(null)

  const { data: installedData, isLoading: installedLoading } = useQuery({
    queryKey: ["neo-installed"],
    queryFn:  () => neoAPI.installed().then(r => r.data),
  })

  const { data: systemData, isLoading: systemLoading } = useQuery({
    queryKey: ["neo-system"],
    queryFn:  () => neoAPI.systemPackages().then(r => r.data),
  })

  const slots     = installedData?.slots || {}
  const slotsList = [1, 2, 3, 4].map(n => ({
    slot: n,
    pkg:  slots[n] as NeoPackage | null,
  }))

  const installedCount  = installedData?.installed_count || 0
  const maxPackages     = installedData?.max_packages || 4
  const slotsAvailable  = installedData?.slots_available || 4
  const systemPackages  = systemData?.packages || []

  const installedKeys = slotsList
    .filter(s => s.pkg?.package_key)
    .map(s => s.pkg!.package_key!)

  const installMutation = useMutation({
    mutationFn: (data: { package_key: string; slot_number: number; custom_instructions?: string }) =>
      neoAPI.install(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["neo-installed"] })
      toast.success(`Package installed in slot ${vars.slot_number}`)
      setInstallModalOpen(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to install package")
    },
  })

  const customMutation = useMutation({
    mutationFn: (data: { title: string; content: string; slot_number: number }) =>
      neoAPI.createCustom(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["neo-installed"] })
      toast.success(`Package installed in slot ${vars.slot_number}`)
      setCustomModalOpen(false)
      setCustomTitle("")
      setCustomContent("")
      setAutoError(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to create package")
    },
  })

  const autoGenerateMutation = useMutation({
    mutationFn: (data: { title: string; slot_number: number }) =>
      neoAPI.generateCustom(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["neo-installed"] })
      toast.success(`"${vars.title}" generated and installed in slot ${vars.slot_number}`)
      setCustomModalOpen(false)
      setCustomTitle("")
      setAutoError(null)
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
      if (err?.response?.status === 400 && detail) {
        setAutoError(detail)
      } else {
        toast.error(detail || "Failed to generate package")
      }
    },
  })

  const updateInstrMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      neoAPI.update(id, { custom_instructions: text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["neo-installed"] })
      toast.success("Instructions updated")
      setEditInstrTarget(null)
      setEditInstrText("")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Instructions rejected — check they match the package domain")
    },
  })

  const uninstallMutation = useMutation({
    mutationFn: (id: string) => neoAPI.uninstall(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["neo-installed"] })
      toast.success(`Package removed from slot ${data.data.slot_freed}`)
      setUninstallTarget(null)
      setEditInstrTarget(null)
      setEditInstrText("")
    },
    onError: () => toast.error("Failed to remove package"),
  })

  function openInstall(slot: number) {
    setPreSelectedSlot(slot)
    setInstallModalOpen(true)
  }

  function openEditInstr(pkg: NeoPackage) {
    setEditInstrTarget(pkg)
    setEditInstrText(pkg.custom_instructions || "")
  }

  function openCustom(slot: number) {
    setCustomSlot(slot)
    setCustomTitle("")
    setCustomContent("")
    setAutoError(null)
    setCustomModalOpen(true)
  }

  function handleAutoCreate(title: string, slot: number) {
    setAutoError(null)
    autoGenerateMutation.mutate({ title, slot_number: slot })
  }

  return {
    slotsList,
    systemPackages,
    installedCount,
    maxPackages,
    slotsAvailable,
    installedKeys,
    installedLoading,
    systemLoading,

    installModalOpen, setInstallModalOpen,
    preSelectedSlot,
    openInstall,
    installMutation,

    customModalOpen, setCustomModalOpen,
    customTitle, setCustomTitle,
    customContent, setCustomContent,
    customSlot, setCustomSlot,
    autoError,
    customMutation,
    autoGenerateMutation,
    openCustom,
    handleAutoCreate,

    editInstrTarget, setEditInstrTarget,
    editInstrText, setEditInstrText,
    updateInstrMutation,
    openEditInstr,

    uninstallTarget, setUninstallTarget,
    uninstallMutation,
  }
}