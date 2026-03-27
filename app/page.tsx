"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import Link from "next/link"

export default function Home() {
  const router = useRouter()
  const { user, isLoading, loadFromStorage } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isLoading])

  if (isLoading) return null

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <p className="text-xs tracking-widest uppercase text-muted-foreground mb-6">
        Immortality
      </p>

      <h1 className="text-5xl md:text-7xl font-serif mb-6 max-w-2xl leading-tight">
        What if the people you love never had to truly leave?
      </h1>

      <p className="text-muted-foreground text-lg max-w-md mb-12 leading-relaxed">
        Train an AI agent with your memories, feelings, and wisdom.
        Your presence. Forever.
      </p>

      <div className="flex gap-4">
        <Link href="/register">
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:opacity-90 transition">
            Begin Your Journey
          </button>
        </Link>
        <Link href="/login">
          <button className="border border-border px-6 py-3 rounded-md text-sm text-muted-foreground hover:text-foreground transition">
            Sign In
          </button>
        </Link>
      </div>

      <p className="text-muted-foreground/40 text-xs mt-20 tracking-widest">
        Open source · Community owned · Forever
      </p>
    </main>
  )
}