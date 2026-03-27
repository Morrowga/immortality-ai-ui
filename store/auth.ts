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
  setAuth: (user: User, token: string) => void
  logout: () => void
  loadFromStorage: () => void
  setDisplayLanguage: (lang: string) => void  
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  displayLanguage: "en",         // ← add this

  setDisplayLanguage: (lang) => set({ displayLanguage: lang }),  // ← add this

  setAuth: (user, token) => {
    localStorage.setItem("immortality_token", token)
    localStorage.setItem("immortality_user", JSON.stringify(user))
    set({ user, token, isLoading: false, displayLanguage: user.language })  // ← set display language on login
  },

  logout: () => {
    localStorage.removeItem("immortality_token")
    localStorage.removeItem("immortality_user")
    set({ user: null, token: null, isLoading: false, displayLanguage: "en" })
    window.location.href = "/login"
  },

  loadFromStorage: () => {
    const token = localStorage.getItem("immortality_token")
    const userStr = localStorage.getItem("immortality_user")
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ user, token, isLoading: false, displayLanguage: user.language })  // ← restore display language
      } catch {
        set({ isLoading: false })
      }
    } else {
      set({ isLoading: false })
    }
  },
}))