export interface Memory {
  memory_id: string
  feeling_weight: number
  never_forget: boolean
  acknowledgment: string
  pattern_tags: string[]
  section: string
  duplicate?: boolean
  message?: string
}

export interface ExtractedMemory {
  what_happened: string
  what_happened_original: string
  context: string
  how_i_felt: string
  how_i_felt_original: string
  why_it_mattered: string
  why_it_mattered_original: string
  what_i_learned: string
  what_i_learned_original: string
  instinct_formed: string
  instinct_formed_original: string
  cultural_expression_notes: string
  suggested_weight: number
  never_forget: boolean
  pattern_tags: string[]
  section: string
  cross_sections: string[]
  is_core_memory: boolean
}

export interface TrainingSubmitResponse {
  session_id: string
  extracted: ExtractedMemory
  original_text: string
}

export interface ChatMessage {
  id: string
  role: "user" | "agent"
  content: string
  memories_used?: number
  response_id?: string
  timestamp: Date
}

export interface Agent {
  agent_id: string
  agent_name: string
  total_memories: number
  wisdom_score: number
  survey_completed: boolean
  dominant_pattern_tags: string[]
  language: string                // ← new
}

export interface TrainingProgress {
  sections: {
    BASIC: number
    PAST: number
    PRESENT: number
    FUTURE: number
  }
  total_memories: number
  wisdom_score: number
  estimated_accuracy: number
}

export interface SlangEntry {
  id: string
  word_or_phrase: string
  meanings: string[]
  example_sentences: string[]
  grammar_note?: string
  usage_context?: string
  language: string
}

export interface AddressForm { form: string; context: string }

export interface Person {
  id:                    string
  person_name:           string
  person_aliases:        string[]
  person_role:           string
  address_forms:         AddressForm[]
  self_address_forms:    AddressForm[]
  voice_summary:         string
  relationship_language: string
  gender?:               string | null
  age?:                  number | null
  tone_description?:     string | null
  forbidden_particles?:  string[]
  required_particles?:   string[]
  allowed_endings?:      string[]
  has_key?:              boolean
  key_enabled?:          boolean
  key_preview?:          string | null
  key_plain?:            string | null
}

export interface Role {
  id:                  string
  name:                string
  name_local:          string
  is_system_default:   boolean
  address_forms:       AddressForm[]
  self_address_forms:  AddressForm[]
  forbidden_particles: string[]
  required_particles:  string[]
  allowed_endings:     string[]
  tone_description:    string
  formality_level:     number
  affection_level:     number
  openness_level:      number
  people:              Person[]
}

export interface RelType {
  id:                string
  name:              string
  name_local:        string
  is_system_default: boolean
  sort_order:        number
  access_mode:       string
  roles:             Role[]
}

export interface KeyStatus {
  profile_id:  string
  has_key:     boolean
  key_enabled: boolean
  key_preview: string | null
  key_plain:   string | null
}

// ── Context helpers ────────────────────────────────────────────────────────

export const CONTEXT_PRESETS = [
  { value: "always",    label: "Always" },
  { value: "sometimes", label: "Sometimes" },
  { value: "custom",    label: "Custom…" },
]

export function parseContext(context: string) {
  if (!context || context === "always") return { preset: "always",    custom: "" }
  if (context === "sometimes")          return { preset: "sometimes", custom: "" }
  return { preset: "custom", custom: context }
}

export function buildContext(preset: string, custom: string): string {
  if (preset === "always")    return "always"
  if (preset === "sometimes") return "sometimes"
  return custom.trim() || "__custom__"
}