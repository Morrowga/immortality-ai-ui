/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { agentAPI, authAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"

export function useSettings() {
  const { user, logout } = useAuthStore()
  const qc = useQueryClient()

  const [editingSlug,   setEditingSlug]   = useState(false)
  const [slugInput,     setSlugInput]     = useState("")
  const [slugErr,       setSlugErr]       = useState<string | null>(null)
  const [copiedSlug,    setCopiedSlug]    = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteInput,   setDeleteInput]   = useState("")

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent"],
    queryFn:  () => agentAPI.me().then(r => r.data),
    enabled:  !!user,
  })

  const publicUrl = agent?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${agent.slug}`
    : null

  const updateSlug = useMutation({
    mutationFn: (slug: string) => agentAPI.updateSlug(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent"] })
      setEditingSlug(false)
      setSlugErr(null)
      toast.success("Public URL updated")
    },
    onError: (e: any) => setSlugErr(e.response?.data?.detail || "Failed to update slug"),
  })

  const deleteAccount = useMutation({
    mutationFn: () => authAPI.deleteAccount(),
    onSuccess:  () => { logout(); window.location.href = "/login" },
    onError:    () => toast.error("Failed to delete account. Try again."),
  })

  const handleSlugSave = () => {
    const val = slugInput.trim().toLowerCase()
    if (!val)           { setSlugErr("Slug cannot be empty"); return }
    if (val.length < 3) { setSlugErr("Minimum 3 characters"); return }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(val)) {
      setSlugErr("Letters, numbers and hyphens only. No leading/trailing hyphens.")
      return
    }
    setSlugErr(null)
    updateSlug.mutate(val)
  }

  const openSlugEdit = () => {
    setSlugInput(agent?.slug || "")
    setSlugErr(null)
    setEditingSlug(true)
  }

  const copyUrl = () => {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl)
    setCopiedSlug(true)
    setTimeout(() => setCopiedSlug(false), 2000)
  }

  return {
    user, agent, isLoading, publicUrl,
    // slug
    editingSlug, setEditingSlug,
    slugInput, setSlugInput,
    slugErr, setSlugErr,
    copiedSlug,
    updateSlug,
    handleSlugSave, openSlugEdit, copyUrl,
    // delete
    deleteConfirm, setDeleteConfirm,
    deleteInput, setDeleteInput,
    deleteAccount,
  }
}