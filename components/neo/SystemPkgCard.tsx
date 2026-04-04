// components/neo/SystemPkgCard.tsx
import { Plus, Check, AlertTriangle } from "lucide-react"
import { SystemPackageDef } from "@/lib/api"
import { PkgIcon } from "./PkgIcon"

interface SystemPkgCardProps {
  pkg: SystemPackageDef
  installed: boolean
  slotsAvailable: number
  onInstall: () => void
}

export function SystemPkgCard({ pkg, installed, slotsAvailable, onInstall }: SystemPkgCardProps) {
  return (
    <div className={`neo-pkg-card ${installed ? "installed" : ""}`}>
      <div className="neo-pkg-card-header">
        <div className="neo-pkg-card-icon">
          <PkgIcon packageKey={pkg.package_key} />
        </div>
        <span className="neo-pkg-card-name">{pkg.title}</span>
        {installed && <div className="neo-pkg-card-installed-dot" />}
        {pkg.sensitive && !installed && (
          <div className="neo-sensitive-tag" title="Requires disclaimer">
            <AlertTriangle size={9} /> Sensitive
          </div>
        )}
      </div>

      <p className="neo-pkg-card-desc">{pkg.description}</p>

      {installed ? (
        <div className="neo-pkg-card-installed-label">
          <Check size={11} /> Installed
        </div>
      ) : (
        <button
          className="neo-pkg-card-install-btn"
          onClick={onInstall}
          disabled={slotsAvailable === 0}
        >
          <Plus size={11} />
          {slotsAvailable === 0 ? "No slots available" : "Install"}
        </button>
      )}
    </div>
  )
}