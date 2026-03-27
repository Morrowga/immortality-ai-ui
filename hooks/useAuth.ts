"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"

export function useAuth(requireAuth = true) {
  const { user, isLoading, loadFromStorage } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      router.push("/login")
    }
  }, [user, isLoading, requireAuth])

  return { user, isLoading }
}