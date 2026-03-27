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
