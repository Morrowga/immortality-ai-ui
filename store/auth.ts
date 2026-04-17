import { create } from "zustand"

interface User {
  id: string
  name: string
  email: string
  language: string
  agent_id: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  displayLanguage: string
  darkMode: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  loadFromStorage: () => void
  setDisplayLanguage: (lang: string) => void
  toggleDarkMode: () => void
}

function readStorage(): { user: User | null; token: string | null; darkMode: boolean } {
  if (typeof window === "undefined") return { user: null, token: null, darkMode: false }
  try {
    const token   = localStorage.getItem("immortality_token")
    const userStr = localStorage.getItem("immortality_user")
    const dark    = localStorage.getItem("immortality_dark") === "true"
    if (token && userStr) {
      return { user: JSON.parse(userStr), token, darkMode: dark }
    }
  } catch {}
  return { user: null, token: null, darkMode: false }
}

const initial = readStorage()

export const useAuthStore = create<AuthStore>((set, get) => ({
  user:            initial.user,
  token:           initial.token,
  isLoading:       false,
  displayLanguage: initial.user?.language ?? "en",
  darkMode:        initial.darkMode,

  setDisplayLanguage: (lang) => set({ displayLanguage: lang }),

  toggleDarkMode: () => {
    const next = !get().darkMode
    localStorage.setItem("immortality_dark", String(next))
    set({ darkMode: next })
  },

  setAuth: (user, token) => {
    localStorage.setItem("immortality_token", token)
    localStorage.setItem("immortality_user", JSON.stringify(user))
    set({ user, token, isLoading: false, displayLanguage: user.language })
  },

  logout: () => {
    localStorage.removeItem("immortality_token")
    localStorage.removeItem("immortality_user")
    localStorage.removeItem("imm_display_lang")
    set({ user: null, token: null, isLoading: false, displayLanguage: "en" })
    window.location.href = "/login"
  },

  loadFromStorage: () => {
  const { user, token, darkMode } = readStorage()
  set({ user, token, darkMode, isLoading: false })
},
}))