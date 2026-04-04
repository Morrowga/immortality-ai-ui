import axios from "axios"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

const api = axios.create({
  baseURL: BASE_URL,
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

// ── Types ──────────────────────────────────────────────────────────────────
export interface AddressForm {
  form:    string
  context: string
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { email: string; name: string; password: string; language: string; gender: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
  updateMe: (data: { email: string }) =>
    api.patch("/api/auth/me", data),
  deleteAccount: () => api.delete("/api/auth/me"),
}

// ── Survey ─────────────────────────────────────────────────────────────────
export const surveyAPI = {
  getQuestions: () => api.get("/api/survey/questions"),
  me: () => api.get("/api/survey/me"),
  submit: (data: {
    full_name:         string
    age?:              number
    birthdate?:        string
    blood_type?:       string
    zodiac_sign?:      string
    current_location?: string
    past_locations?:   string[]
  }) => api.post("/api/survey/submit", data),
  onboardingStep: (step: string) =>
    api.post("/api/survey/onboarding-step", { step }),
  update: (data: {
    full_name?:        string
    age?:              number
    birthdate?:        string
    blood_type?:       string
    zodiac_sign?:      string
    current_location?: string
    past_locations?:   string[]
  }) => api.patch("/api/survey/me", data),
}

// ── Training ───────────────────────────────────────────────────────────────
export const trainingAPI = {
  submit:   (data: { text: string; mode: string }) => api.post("/api/training/submit", data),
  confirm:  (data: { session_id: string; feeling_weight: number; extracted: Record<string, unknown> }) =>
    api.post("/api/training/confirm", data),
  progress: () => api.get("/api/training/progress"),
}

// ── Chat ───────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (data: {
    message:         string
    language:        string
    speaker_name:    string
    role_id?:        string
    person_id?:      string
    session_key?:    string
    speaker_gender?: string
    speaker_age?:    number
  }) => api.post("/api/chat/", data),

  history: (sessionKey: string, limit = 50, beforeId?: string) =>
    api.get("/api/chat/history", {
      params: {
        session_key: sessionKey,
        limit,
        ...(beforeId ? { before_id: beforeId } : {}),
      },
    }),

  sessions: (limit = 20) =>
    api.get("/api/chat/sessions", { params: { limit } }),
}

// ── Voice ──────────────────────────────────────────────────────────────────
export const voiceAPI = {
  status: () => api.get("/api/voice/status"),
  getTemplate: () => api.get("/api/voice/template"),
  upload: (file: File, removeBackgroundNoise = false, slot: "native" | "en" = "native") => {
    const form = new FormData()
    form.append("file", file)
    form.append("language_slot", slot)
    form.append("remove_background_noise", String(removeBackgroundNoise))
    return api.post("/api/voice/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  record: (blob: Blob, removeBackgroundNoise = false, slot: "native" | "en" = "native") => {
    const form = new FormData()
    form.append("file", blob, "recording.webm")
    form.append("language_slot", slot)
    form.append("remove_background_noise", String(removeBackgroundNoise))
    return api.post("/api/voice/record", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  speak: (data: { response_id: string; stability?: number; similarity_boost?: number }) =>
    api.post("/api/voice/speak", data),
  playUrl: (response_id: string) =>
    `${BASE_URL}/api/voice/play/${response_id}`,
  deleteSlot: (slot: "native" | "en") => api.delete(`/api/voice/${slot}`),
}

// ── Relationships ──────────────────────────────────────────────────────────
export const relationshipsAPI = {
  getTree: () => api.get("/api/relationships"),
  getTypesForChat: (agent_id: string) =>
    api.get("/api/relationships/types-for-chat", { params: { agent_id } }),

  createType: (data: { name: string; name_local?: string }) =>
    api.post("/api/relationships/types", data),
  updateType: (id: string, data: { name?: string; name_local?: string; sort_order?: number }) =>
    api.patch(`/api/relationships/types/${id}`, data),
  deleteType: (id: string) =>
    api.delete(`/api/relationships/types/${id}`),

  createRole: (data: {
    type_id:              string
    name:                 string
    name_local?:          string
    address_forms?:       AddressForm[]
    self_address_forms?:  AddressForm[]
    forbidden_particles?: string[]
    required_particles?:  string[]
    allowed_endings?:     string[]
    tone_description?:    string
    openness_level?:      number
    formality_level?:     number
    affection_level?:     number
    restricted_topics?:   string[]
  }) => api.post("/api/relationships/roles", data),
  updateRole: (id: string, data: {
    name?:                string
    name_local?:          string
    address_forms?:       AddressForm[]
    self_address_forms?:  AddressForm[]
    forbidden_particles?: string[]
    required_particles?:  string[]
    allowed_endings?:     string[]
    tone_description?:    string
    openness_level?:      number
    formality_level?:     number
    affection_level?:     number
    restricted_topics?:   string[]
  }) => api.patch(`/api/relationships/roles/${id}`, data),
  deleteRole: (id: string) =>
    api.delete(`/api/relationships/roles/${id}`),

  createPerson: (data: {
    role_id:                string
    person_name:            string
    person_aliases?:        string[]
    person_role?:           string
    relationship_language?: string
    how_i_talk_to_them?:    string
    chat_samples?:          string[]
    address_forms?:         AddressForm[]
    self_address_forms?:    AddressForm[]
    gender?:                string | null
    age?:                   number | null
    tone_description?:      string | null
    forbidden_particles?:   string[]
    required_particles?:    string[]
    allowed_endings?:       string[]
  }) => api.post("/api/relationships/people", data),
  updatePerson: (id: string, data: {
    person_name?:           string
    person_aliases?:        string[]
    person_role?:           string
    relationship_language?: string
    how_i_talk_to_them?:    string
    chat_samples?:          string[]
    address_forms?:         AddressForm[]
    self_address_forms?:    AddressForm[]
    voice_summary?:         string | null
    gender?:                string | null
    age?:                   number | null
    tone_description?:      string | null
    forbidden_particles?:   string[]
    required_particles?:    string[]
    allowed_endings?:       string[]
  }) => api.patch(`/api/relationships/people/${id}`, data),
  deletePerson: (id: string) =>
    api.delete(`/api/relationships/people/${id}`),

  identify: (data: { speaker_name: string; role_id: string; agent_id: string }) =>
    api.post("/api/relationships/identify", data),
}

// ── Access Keys ────────────────────────────────────────────────────────────
export const accessKeysAPI = {
  list: () =>
    api.get("/api/access-keys"),
  suggest: () =>
    api.get("/api/access-keys/suggest"),
  generate: (profileId: string, passphrase?: string) =>
    api.post(`/api/access-keys/${profileId}/generate`, { passphrase: passphrase || null }),
  revoke: (profileId: string) =>
    api.delete(`/api/access-keys/${profileId}/revoke`),
  toggle: (profileId: string) =>
    api.patch(`/api/access-keys/${profileId}/toggle`),
}

// ── Slang ──────────────────────────────────────────────────────────────────
export const slangAPI = {
  list: (language?: string) =>
    api.get("/api/slang/", { params: language ? { language } : {} }),
  add: (data: {
    word_or_phrase:    string
    meanings:          string[]
    example_sentences: string[]
    grammar_note?:     string
    usage_context?:    string
    language:          string
  }) => api.post("/api/slang/", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/slang/${id}`, data),
  delete: (id: string) => api.delete(`/api/slang/${id}`),
}

// ── Feedback ───────────────────────────────────────────────────────────────
export const feedbackAPI = {
  submit: (data: { response_id: string; feedback: string; correction_text?: string }) =>
    api.post("/api/feedback/", data),
}

// ── Agent ──────────────────────────────────────────────────────────────────
export const agentAPI = {
  me: () => api.get("/api/agents/me"),

  updateName: (agent_name: string) =>
    api.patch("/api/agents/me", { agent_name }),

  uploadImage: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api.post("/api/agents/me/image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },

  deleteImage: () => api.delete("/api/agents/me/image"),

  // Fetches the agent image with the Bearer token attached.
  // Returns a blob URL safe to set as <img src>.
  // Returns null if no image exists or on any error.
  // Use this instead of a plain <img src> because the endpoint requires auth.
  fetchImage: async (): Promise<string | null> => {
    if (typeof window === "undefined") return null
    const token = localStorage.getItem("immortality_token")
    if (!token) return null
    try {
      const res = await fetch(`${BASE_URL}/api/agents/me/image`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  },

  updateSlug: (slug: string) => api.patch("/api/agents/me/slug", { slug }),
  lifecycle:  () => api.get("/api/agents/lifecycle"),
}

// ── Memories ───────────────────────────────────────────────────────────────
export const memoriesAPI = {
  list: (params?: {
    section?:        string
    never_forget?:   boolean
    min_weight?:     number
    training_mode?:  "manual" | "conversation" | "correction"
    limit?:          number
    offset?:         number
  }) => api.get("/api/memories/", { params }),

  stats: () => api.get("/api/memories/stats"),

  get: (id: string) => api.get(`/api/memories/${id}`),

  delete: (id: string) => api.delete(`/api/memories/${id}`),

  search: (query: string, params?: {
    section?:       string
    training_mode?: "manual" | "conversation" | "correction"
    limit?:         number
    offset?:        number
  }) => api.get("/api/memories/search", { params: { q: query, ...params } }),

  review: () => api.get("/api/memories/review"),

  archive: (id: string) => api.post(`/api/memories/${id}/archive`),
}

// ── Neo ────────────────────────────────────────────────────────────────────
export interface NeoPackage {
  id:                  string
  package_type:        "system" | "custom"
  package_key:         string | null
  title:               string
  description:         string | null
  slot_number:         number
  custom_instructions: string | null
  domain_tags:         string[]
  neo_mode_disclaimer: string | null
  char_count:          number | null
  installed_at:        string | null
  updated_at:          string | null
}

export interface SystemPackageDef {
  package_key:    string
  title:          string
  description:    string
  sensitive:      boolean
  example_topics: string[]
}

export interface NeoSlots {
  slots:           Record<string, NeoPackage | null>
  installed_count: number
  max_packages:    number
  slots_available: number
}

export const neoAPI = {
  systemPackages: () =>
    api.get<{ packages: SystemPackageDef[] }>("/api/neo/packages/system"),

  generateCustom: (data: { title: string; slot_number: number }) =>
    api.post("/api/neo/packages/custom/generate", data),

  installed: () =>
    api.get<NeoSlots>("/api/neo/packages"),

  install: (data: {
    package_key:          string
    slot_number:          number
    custom_instructions?: string
  }) => api.post<{ message: string; package: NeoPackage }>("/api/neo/packages/install", data),

  createCustom: (data: {
    title:                string
    content:              string
    slot_number:          number
    custom_instructions?: string
  }) => api.post<{ message: string; package: NeoPackage; domain_tags_extracted: string[] }>("/api/neo/packages/custom", data),

  update: (packageId: string, data: { custom_instructions: string }) =>
    api.patch<{ message: string; package: NeoPackage }>(`/api/neo/packages/${packageId}`, data),

  uninstall: (packageId: string) =>
    api.delete<{ message: string; slot_freed: number }>(`/api/neo/packages/${packageId}`),

  replace: (packageId: string, data: {
    package_key?:  string
    new_title?:    string
    new_content?:  string
    custom_instructions?: string
  }) => api.post<{ message: string; package: NeoPackage }>(`/api/neo/packages/${packageId}/replace`, data),
}

// ── Public (no auth) ───────────────────────────────────────────────────────
export const publicAPI = {
  agent: (slug: string) =>
    api.get(`/public/${slug}`),

  verify: (slug: string, passphrase: string) =>
    api.post(`/public/${slug}/verify`, { passphrase }),

  chat: (slug: string, data: {
    message:        string
    session_token:  string
    speaker_name:   string
    speaker_gender: string
    speaker_age:    number
    session_key:    string
    neo_mode:       boolean
  }) => api.post(`/public/${slug}/chat`, data),

  history: (slug: string, sessionKey: string, limit = 50, beforeId?: string) =>
    api.get("/api/chat/history/public", {
      params: {
        agent_slug:  slug,
        session_key: sessionKey,
        limit,
        ...(beforeId ? { before_id: beforeId } : {}),
      },
    }),
}

// ── Helpers ────────────────────────────────────────────────────────────────
export const setToken = (token: string) => {
  localStorage.setItem("immortality_token", token)
}

export default api