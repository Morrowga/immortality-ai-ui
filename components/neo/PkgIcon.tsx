// components/neo/PkgIcon.tsx
import { Package } from "lucide-react"

interface PkgIconProps {
  packageKey: string | null
  size?: number
}

export function PkgIcon({ packageKey, size = 16 }: PkgIconProps) {
  const icons: Record<string, React.ReactNode> = {}
  return <>{icons[packageKey || ""] || <Package size={size} />}</>
}