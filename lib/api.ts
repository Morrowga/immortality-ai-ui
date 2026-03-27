import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("immortality_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("immortality_token")
      localStorage.removeItem("immortality_user")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { email: string; name: string; password: string; language: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
}

// ── Survey ────────────────────────────────────────────────────────────────────
export const surveyAPI = {
  getQuestions: () => api.get("/api/survey/questions"),
  getStatus: () => api.get("/api/survey/status"),
  submit: (data: Record<string, string>) => api.post("/api/survey/submit", data),
  me: () => api.get("/api/survey/me"),
}

// ── Training ──────────────────────────────────────────────────────────────────
export const trainingAPI = {
  submit: (data: { text: string; mode: string }) =>
    api.post("/api/training/submit", data),
  confirm: (data: { session_id: string; feeling_weight: number; extracted: Record<string, unknown> }) =>
    api.post("/api/training/confirm", data),
  progress: () => api.get("/api/training/progress"),
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (data: { message: string; language: string }) =>
    api.post("/api/chat/", data),
}

// ── Slang ─────────────────────────────────────────────────────────────────────
export const slangAPI = {
  list: (language?: string) =>
    api.get("/api/slang/", { params: language ? { language } : {} }),
  add: (data: {
    word_or_phrase: string
    meanings: string[]
    example_sentences: string[]
    grammar_note?: string
    usage_context?: string
    language: string
  }) => api.post("/api/slang/", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/slang/${id}`, data),
  delete: (id: string) => api.delete(`/api/slang/${id}`),
}

// ── Feedback ──────────────────────────────────────────────────────────────────
export const feedbackAPI = {
  submit: (data: { response_id: string; feedback: string; correction_text?: string }) =>
    api.post("/api/feedback/", data),
}

// ── Agent ─────────────────────────────────────────────────────────────────────
export const agentAPI = {
  me: () => api.get("/api/agents/me"),
}

// ── Memories ──────────────────────────────────────────────────────────────────
export const memoriesAPI = {
  list: (params?: { section?: string; never_forget?: boolean; min_weight?: number; limit?: number; offset?: number }) =>
    api.get("/api/memories/", { params }),
  stats: () => api.get("/api/memories/stats"),
  get: (id: string) => api.get(`/api/memories/${id}`),
  delete: (id: string) => api.delete(`/api/memories/${id}`),
}

export const setToken = (token: string) => {
  localStorage.setItem("immortality_token", token)
}

export default api