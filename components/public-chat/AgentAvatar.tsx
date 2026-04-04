import { useState } from "react"
import Image from "next/image"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface Props {
  slug: string
  name: string
  size?: number
}

export function AgentAvatar({ slug, name, size = 48 }: Props) {
  const [err, setErr] = useState(false)

  return (
    <div
      className="pc-agent-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, flexShrink: 0 }}
    >
      {!err ? (
        <Image
          src={`${BASE_URL}/public/${slug}/image`}
          alt={name}
          width={size}
          height={size}
          unoptimized
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  )
}