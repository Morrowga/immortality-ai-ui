// layout.tsx — clean up the dead import
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/layout/Providers"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Immortality",
  description: "Your presence. Forever.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}