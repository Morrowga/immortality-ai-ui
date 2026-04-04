// components/neo/PkgIcon.tsx
import { Brain, Zap, Package } from "lucide-react"

interface PkgIconProps {
  packageKey: string | null
  size?: number
}

export function PkgIcon({ packageKey, size = 16 }: PkgIconProps) {
  const icons: Record<string, React.ReactNode> = {
    life_coach: <Brain size={size} />,
    politician: <Zap size={size} />,
  }
  return <>{icons[packageKey || ""] || <Package size={size} />}</>
}