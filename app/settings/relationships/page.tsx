"use client"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Loader2 }     from "lucide-react"
import { useState, useEffect } from "react"
import { useRelationships } from "@/hooks/useRelationships"
import { useAuthStore }     from "@/store/auth"
import { useTranslation }   from "@/locales"
import {
  RelationshipTypeColumn,
  RelationshipRoleColumn,
  RelationshipPeopleColumn,
} from "@/components/relationships/RelationshipColumns"
import {
  AddTypeModal, EditTypeModal,
  AddRoleModal, EditRoleModal,
  AddPersonModal, EditPersonModal,
} from "@/components/relationships/modals/RelationshipModals"
import "@/styles/settings.css"

export default function RelationshipsSettingsPage() {
  const r = useRelationships()
  const [mounted, setMounted] = useState(false)
  const { displayLanguage }   = useAuthStore()
  const lang                  = mounted ? displayLanguage : "en"
  const { t }                 = useTranslation(lang)

  useEffect(() => { setMounted(true) }, [])

  if (r.isLoading) return (
    <DashboardLayout>
      <div className="rs-loading"><Loader2 className="animate-spin" /> {t("relationships.loading")}</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="rs-root">

        <div className="rs-header">
          <div className="rs-header-left">
            <div className="rs-eyebrow">{t("relationships.eyebrow")}</div>
            <h1 className="rs-title">{t("relationships.title")}</h1>
            <p className="rs-subtitle">{t("relationships.subtitle")}</p>
          </div>
        </div>

        <div className="rs-columns">

          <RelationshipTypeColumn
            tree={r.tree}
            selectedTypeId={r.selectedTypeId}
            onSelectType={id => { r.setSelectedTypeId(id); r.setSelectedRoleId(null) }}
            onEditType={r.setEditTypeTarget}
            onDeleteType={id => r.deleteType.mutate(id)}
            onAddType={() => r.setAddTypeOpen(true)}
            t={t}
            addTypeModal={r.addTypeOpen && (
              <AddTypeModal
                name={r.newTypeName}         nameLocal={r.newTypeLocal}
                setName={r.setNewTypeName}   setNameLocal={r.setNewTypeLocal}
                onClose={() => r.setAddTypeOpen(false)}
                onSave={() => r.createType.mutate()}
                isPending={r.createType.isPending}
                t={t}
              />
            )}
            editTypeModal={r.editTypeTarget && (
              <EditTypeModal
                type={r.editTypeTarget}
                onClose={() => r.setEditTypeTarget(null)}
                onSave={data => r.updateType.mutate(data)}
                isPending={r.updateType.isPending}
                t={t}
              />
            )}
          />

          <RelationshipRoleColumn
            selectedType={r.selectedType}
            selectedRoleId={r.selectedRoleId}
            onSelectRole={r.setSelectedRoleId}
            onEditRole={r.setEditRoleTarget}
            onDeleteRole={id => r.deleteRole.mutate(id)}
            onAddRole={() => r.setAddRoleOpen(true)}
            t={t}
            addRoleModal={r.addRoleOpen && r.selectedType && (
              <AddRoleModal
                typeName={r.selectedType.name}
                name={r.newRoleName}               nameLocal={r.newRoleLocal}
                addrForms={r.newRoleAddrForms}     selfForms={r.newRoleSelfForms}
                forbidden={r.newRoleForbidden}     tone={r.newRoleTone}
                setName={r.setNewRoleName}         setNameLocal={r.setNewRoleLocal}
                setAddrForms={r.setNewRoleAddrForms} setSelfForms={r.setNewRoleSelfForms}
                setForbidden={r.setNewRoleForbidden} setTone={r.setNewRoleTone}
                onClose={() => r.setAddRoleOpen(false)}
                onSave={() => r.createRole.mutate()}
                isPending={r.createRole.isPending}
                t={t}
              />
            )}
            editRoleModal={r.editRoleTarget && (
              <EditRoleModal
                role={r.editRoleTarget}
                onClose={() => r.setEditRoleTarget(null)}
                onSave={data => r.updateRole.mutate(data)}
                isPending={r.updateRole.isPending}
                t={t}
              />
            )}
          />

          <RelationshipPeopleColumn
            selectedRole={r.selectedRole}
            people={r.peopleWithKeys}
            revealedKeys={r.revealedKeys}
            copiedKeys={r.copiedKeys}
            onEditPerson={r.setEditPersonTarget}
            onDeletePerson={id => r.deletePerson.mutate(id)}
            onAddPerson={r.openAddPerson}
            onToggleReveal={r.toggleReveal}
            onCopyKey={r.copyKey}
            onSaveKey={id => r.saveKey.mutate({ profileId: id })}
            onToggleKey={id => r.toggleKey.mutate(id)}
            onRevokeKey={p => {
              if (confirm(t("relationships.keyRevokeConfirm").replace("{name}", p.person_name)))
                r.revokeKey.mutate(p.id)
            }}
            saveKeyPending={r.saveKey.isPending}
            toggleKeyPending={r.toggleKey.isPending}
            revokeKeyPending={r.revokeKey.isPending}
            t={t}
            addPersonModal={r.addPersonOpen && r.selectedRole && (
              <AddPersonModal
                roleName={r.selectedRole.name}
                name={r.newPersonName}               gender={r.newPersonGender}
                age={r.newPersonAge}                 addrForms={r.newPersonAddrForms}
                selfForms={r.newPersonSelfForms}     samples={r.newPersonSamples}
                passphrase={r.newPersonPassphrase}   passphraseVisible={r.passphraseVisible}
                setName={r.setNewPersonName}         setGender={r.setNewPersonGender}
                setAge={r.setNewPersonAge}           setAddrForms={r.setNewPersonAddrForms}
                setSelfForms={r.setNewPersonSelfForms} setSamples={r.setNewPersonSamples}
                setPassphrase={r.setNewPersonPassphrase}
                setPassphraseVisible={r.setPassphraseVisible}
                onClose={() => r.setAddPersonOpen(false)}
                onSave={() => r.createPerson.mutate()}
                onFetchSuggestion={r.fetchSuggestion}
                isPending={r.createPerson.isPending}
                t={t}
              />
            )}
            editPersonModal={r.editPersonTarget && (
              <EditPersonModal
                person={r.editPersonTarget}
                onClose={() => r.setEditPersonTarget(null)}
                onSave={data => r.updatePerson.mutate(data)}
                isPending={r.updatePerson.isPending}
                t={t}
              />
            )}
          />

        </div>
      </div>
    </DashboardLayout>
  )
}