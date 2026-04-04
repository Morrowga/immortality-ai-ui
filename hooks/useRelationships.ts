import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { relationshipsAPI, accessKeysAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { AddressForm, RelType, Role, Person, KeyStatus } from "@/types"

export function useRelationships() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  // ── Selection ─────────────────────────────────────────────────────────
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  // ── Modal open states ─────────────────────────────────────────────────
  const [addTypeOpen,   setAddTypeOpen]   = useState(false)
  const [addRoleOpen,   setAddRoleOpen]   = useState(false)
  const [addPersonOpen, setAddPersonOpen] = useState(false)

  // ── Edit targets ──────────────────────────────────────────────────────
  const [editTypeTarget,   setEditTypeTarget]   = useState<RelType | null>(null)
  const [editRoleTarget,   setEditRoleTarget]   = useState<Role | null>(null)
  const [editPersonTarget, setEditPersonTarget] = useState<Person | null>(null)

  // ── Type form ─────────────────────────────────────────────────────────
  const [newTypeName,  setNewTypeName]  = useState("")
  const [newTypeLocal, setNewTypeLocal] = useState("")

  // ── Role form ─────────────────────────────────────────────────────────
  const [newRoleName,      setNewRoleName]      = useState("")
  const [newRoleLocal,     setNewRoleLocal]      = useState("")
  const [newRoleAddrForms, setNewRoleAddrForms]  = useState<AddressForm[]>([])
  const [newRoleSelfForms, setNewRoleSelfForms]  = useState<AddressForm[]>([])
  const [newRoleForbidden, setNewRoleForbidden]  = useState("")
  const [newRoleTone,      setNewRoleTone]       = useState("")

  // ── Person form ───────────────────────────────────────────────────────
  const [newPersonName,       setNewPersonName]       = useState("")
  const [newPersonGender,     setNewPersonGender]     = useState("")
  const [newPersonAge,        setNewPersonAge]        = useState("")
  const [newPersonAddrForms,  setNewPersonAddrForms]  = useState<AddressForm[]>([])
  const [newPersonSelfForms,  setNewPersonSelfForms]  = useState<AddressForm[]>([])
  const [newPersonSamples,    setNewPersonSamples]    = useState("")
  const [newPersonPassphrase, setNewPersonPassphrase] = useState("")
  const [passphraseVisible,   setPassphraseVisible]   = useState(false)

  // ── Key reveal / copy ─────────────────────────────────────────────────
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [copiedKeys,   setCopiedKeys]   = useState<Record<string, boolean>>({})

  // ── Queries ───────────────────────────────────────────────────────────
  const { data: tree, isLoading } = useQuery({
    queryKey: ["relationship-tree"],
    queryFn:  () => relationshipsAPI.getTree().then(r => r.data.types as RelType[]),
    enabled:  !!user,
  })

  const { data: keyData } = useQuery({
    queryKey: ["access-keys"],
    queryFn:  () => accessKeysAPI.list().then(r => r.data.people as KeyStatus[]),
    enabled:  !!user,
  })

  const keyMap = new Map<string, KeyStatus>()
  keyData?.forEach(k => keyMap.set(k.profile_id, k))

  const selectedType = tree?.find(t => t.id === selectedTypeId) ?? null
  const selectedRole = selectedType?.roles.find(r => r.id === selectedRoleId) ?? null
  const peopleWithKeys: Person[] = (selectedRole?.people ?? []).map(p => ({
    ...p,
    ...(keyMap.get(p.id) ?? { has_key: false, key_enabled: false, key_preview: null }),
  }))

  // ── Invalidate ────────────────────────────────────────────────────────
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["relationship-tree"] })
    qc.invalidateQueries({ queryKey: ["access-keys"] })
  }

  // ── Mutations ─────────────────────────────────────────────────────────
  const createType = useMutation({
    mutationFn: () => relationshipsAPI.createType({ name: newTypeName, name_local: newTypeLocal }),
    onSuccess:  () => { invalidate(); setAddTypeOpen(false); setNewTypeName(""); setNewTypeLocal("") },
    onError:    () => toast.error("Failed to create type"),
  })

  const updateType = useMutation({
    mutationFn: (data: object) => relationshipsAPI.updateType(editTypeTarget!.id, data),
    onSuccess:  () => { invalidate(); setEditTypeTarget(null); toast.success("Type updated") },
    onError:    () => toast.error("Failed to update type"),
  })

  const deleteType = useMutation({
    mutationFn: (id: string) => relationshipsAPI.deleteType(id),
    onSuccess:  () => { invalidate(); setSelectedTypeId(null); setSelectedRoleId(null) },
    onError:    () => toast.error("Cannot delete this type"),
  })

  const createRole = useMutation({
    mutationFn: () => relationshipsAPI.createRole({
      type_id:             selectedTypeId!,
      name:                newRoleName,
      name_local:          newRoleLocal,
      address_forms:       newRoleAddrForms.filter(f => f.form.trim()),
      self_address_forms:  newRoleSelfForms.filter(f => f.form.trim()),
      forbidden_particles: newRoleForbidden.split(",").map(s => s.trim()).filter(Boolean),
      tone_description:    newRoleTone,
    }),
    onSuccess: () => {
      invalidate(); setAddRoleOpen(false)
      setNewRoleName(""); setNewRoleLocal("")
      setNewRoleAddrForms([]); setNewRoleSelfForms([])
      setNewRoleForbidden(""); setNewRoleTone("")
    },
    onError: () => toast.error("Failed to create role"),
  })

  const updateRole = useMutation({
    mutationFn: (data: object) => relationshipsAPI.updateRole(editRoleTarget!.id, data),
    onSuccess:  () => { invalidate(); setEditRoleTarget(null); toast.success("Role updated") },
    onError:    () => toast.error("Failed to update role"),
  })

  const deleteRole = useMutation({
    mutationFn: (id: string) => relationshipsAPI.deleteRole(id),
    onSuccess:  () => { invalidate(); setSelectedRoleId(null) },
    onError:    () => toast.error("Cannot delete this role"),
  })

  const createPerson = useMutation({
    mutationFn: () => relationshipsAPI.createPerson({
      role_id:            selectedRoleId!,
      person_name:        newPersonName,
      gender:             newPersonGender || null,
      age:                newPersonAge ? parseInt(newPersonAge) : null,
      address_forms:      newPersonAddrForms.filter(f => f.form.trim()),
      self_address_forms: newPersonSelfForms.filter(f => f.form.trim()),
      chat_samples:       newPersonSamples.split("\n").map(s => s.trim()).filter(Boolean),
    }),
    onSuccess: async (res) => {
      const profileId = res.data.id
      if (newPersonPassphrase.trim() && profileId) {
        try {
          await accessKeysAPI.generate(profileId, newPersonPassphrase.trim())
        } catch {
          toast.error("Person added but failed to save access key.")
        }
      }
      invalidate()
      setAddPersonOpen(false)
      setNewPersonName(""); setNewPersonGender(""); setNewPersonAge("")
      setNewPersonAddrForms([]); setNewPersonSelfForms([])
      setNewPersonSamples(""); setNewPersonPassphrase("")
      setPassphraseVisible(false)
      toast.success("Person added")
    },
    onError: () => toast.error("Failed to add person"),
  })

  const updatePerson = useMutation({
    mutationFn: (data: object) => relationshipsAPI.updatePerson(editPersonTarget!.id, data),
    onSuccess:  () => { invalidate(); setEditPersonTarget(null); toast.success("Person updated") },
    onError:    () => toast.error("Failed to update person"),
  })

  const deletePerson = useMutation({
    mutationFn: (id: string) => relationshipsAPI.deletePerson(id),
    onSuccess:  () => { invalidate(); toast.success("Removed") },
    onError:    () => toast.error("Failed to remove"),
  })

  const saveKey = useMutation({
    mutationFn: ({ profileId, passphrase }: { profileId: string; passphrase?: string }) =>
      accessKeysAPI.generate(profileId, passphrase).then(r => r.data),
    onSuccess:  () => { invalidate(); toast.success("Access key saved") },
    onError:    () => toast.error("Failed to save key"),
  })

  const revokeKey = useMutation({
    mutationFn: (profileId: string) => accessKeysAPI.revoke(profileId),
    onSuccess:  () => { invalidate(); toast.success("Key revoked") },
    onError:    () => toast.error("Failed to revoke key"),
  })

  const toggleKey = useMutation({
    mutationFn: (profileId: string) => accessKeysAPI.toggle(profileId).then(r => r.data),
    onSuccess:  (data) => { invalidate(); toast.success(data.enabled ? "Key enabled" : "Key disabled") },
    onError:    () => toast.error("Failed to toggle key"),
  })

  const fetchSuggestion = async () => {
    try {
      const res = await accessKeysAPI.suggest()
      setNewPersonPassphrase(res.data.passphrase)
    } catch { /* silently fail */ }
  }

  const openAddPerson = async () => {
    setNewPersonName(""); setNewPersonGender(""); setNewPersonAge("")
    setNewPersonAddrForms([]); setNewPersonSelfForms([])
    setNewPersonSamples(""); setPassphraseVisible(false); setNewPersonPassphrase("")
    setAddPersonOpen(true)
    await fetchSuggestion()
  }

  const copyKey = (profileId: string, plain: string | null | undefined) => {
    if (!plain) return
    navigator.clipboard.writeText(plain)
    setCopiedKeys(s => ({ ...s, [profileId]: true }))
    setTimeout(() => setCopiedKeys(s => ({ ...s, [profileId]: false })), 1500)
  }

  const toggleReveal = (id: string) =>
    setRevealedKeys(s => ({ ...s, [id]: !s[id] }))

  return {
    // data
    tree, isLoading, keyMap, selectedType, selectedRole, peopleWithKeys,
    // selection
    selectedTypeId, setSelectedTypeId,
    selectedRoleId, setSelectedRoleId,
    // modal open
    addTypeOpen, setAddTypeOpen,
    addRoleOpen, setAddRoleOpen,
    addPersonOpen, setAddPersonOpen,
    // edit targets
    editTypeTarget, setEditTypeTarget,
    editRoleTarget, setEditRoleTarget,
    editPersonTarget, setEditPersonTarget,
    // type form
    newTypeName, setNewTypeName,
    newTypeLocal, setNewTypeLocal,
    // role form
    newRoleName, setNewRoleName,
    newRoleLocal, setNewRoleLocal,
    newRoleAddrForms, setNewRoleAddrForms,
    newRoleSelfForms, setNewRoleSelfForms,
    newRoleForbidden, setNewRoleForbidden,
    newRoleTone, setNewRoleTone,
    // person form
    newPersonName, setNewPersonName,
    newPersonGender, setNewPersonGender,
    newPersonAge, setNewPersonAge,
    newPersonAddrForms, setNewPersonAddrForms,
    newPersonSelfForms, setNewPersonSelfForms,
    newPersonSamples, setNewPersonSamples,
    newPersonPassphrase, setNewPersonPassphrase,
    passphraseVisible, setPassphraseVisible,
    // key state
    revealedKeys, copiedKeys,
    toggleReveal, copyKey,
    fetchSuggestion, openAddPerson,
    // mutations
    createType, updateType, deleteType,
    createRole, updateRole, deleteRole,
    createPerson, updatePerson, deletePerson,
    saveKey, revokeKey, toggleKey,
  }
}