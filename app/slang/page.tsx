"use client"
import { useState } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { slangAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { useTranslation } from "@/locales"
import { toast } from "sonner"
import { SlangEntry } from "@/types"
import { Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "my", label: "Burmese" },
  { code: "th", label: "Thai" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "es", label: "Spanish" },
]

export default function SlangPage() {
  const { user,displayLanguage } = useAuthStore()
  const { t } = useTranslation(displayLanguage)
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [filterLanguage, setFilterLanguage] = useState<string>("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    word_or_phrase: "",
    meanings: [] as string[],
    example_sentences: [] as string[],
    grammar_note: "",
    usage_context: "",
    language: user?.language || "en",
  })
  const [meaningInput, setMeaningInput] = useState("")
  const [exampleInput, setExampleInput] = useState("")

  const { data: slangList = [], isLoading } = useQuery({
    queryKey: ["slang", filterLanguage],
    queryFn: () => slangAPI.list(filterLanguage || undefined).then(r => r.data),
    enabled: !!user,
  })

  const addMutation = useMutation({
    mutationFn: slangAPI.add,
    onSuccess: () => {
      toast.success("Slang word saved")
      queryClient.invalidateQueries({ queryKey: ["slang"] })
      setShowForm(false)
      resetForm()
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to save"),
  })

  const deleteMutation = useMutation({
    mutationFn: slangAPI.delete,
    onSuccess: () => {
      toast.success("Deleted")
      queryClient.invalidateQueries({ queryKey: ["slang"] })
    },
    onError: () => toast.error("Failed to delete"),
  })

  const resetForm = () => {
    setForm({
      word_or_phrase: "",
      meanings: [],
      example_sentences: [],
      grammar_note: "",
      usage_context: "",
      language: user?.language || "en",
    })
    setMeaningInput("")
    setExampleInput("")
  }

  const addMeaning = () => {
    if (!meaningInput.trim()) return
    setForm(f => ({ ...f, meanings: [...f.meanings, meaningInput.trim()] }))
    setMeaningInput("")
  }

  const addExample = () => {
    if (!exampleInput.trim()) return
    setForm(f => ({ ...f, example_sentences: [...f.example_sentences, exampleInput.trim()] }))
    setExampleInput("")
  }

  const handleSubmit = () => {
    if (!form.word_or_phrase.trim()) {
      toast.error("Word or phrase is required")
      return
    }
    if (form.meanings.length === 0) {
      toast.error("Add at least one meaning")
      return
    }
    addMutation.mutate(form)
  }

  // Group by language
  const grouped = (slangList as SlangEntry[]).reduce((acc, s) => {
    if (!acc[s.language]) acc[s.language] = []
    acc[s.language].push(s)
    return acc
  }, {} as Record<string, SlangEntry[]>)

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-serif">{t("slang.title")}</h1>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            {t("slang.addNew")}
          </button>
        </div>
        <p className="text-muted-foreground mb-8">{t("slang.subtitle")}</p>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-card border border-border rounded-lg p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Add New Slang</p>
                  <button onClick={() => { setShowForm(false); resetForm() }}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>

                {/* Language */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t("slang.language")}
                  </label>
                  <select
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                    className="bg-background border border-border rounded-md px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>

                {/* Word */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t("slang.word")}
                  </label>
                  <input
                    value={form.word_or_phrase}
                    onChange={e => setForm(f => ({ ...f, word_or_phrase: e.target.value }))}
                    placeholder={t("slang.wordPlaceholder")}
                    className="bg-background border border-border rounded-md px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                  />
                </div>

                {/* Meanings */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t("slang.meanings")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={meaningInput}
                      onChange={e => setMeaningInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addMeaning()}
                      placeholder={t("slang.meaningPlaceholder")}
                      className="flex-1 bg-background border border-border rounded-md px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                    />
                    <button
                      onClick={addMeaning}
                      className="bg-secondary px-4 py-2.5 rounded-md text-sm hover:bg-secondary/80 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {form.meanings.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {form.meanings.map((m, i) => (
                        <span key={i} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-full">
                          {m}
                          <button onClick={() => setForm(f => ({ ...f, meanings: f.meanings.filter((_, idx) => idx !== i) }))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Examples */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t("slang.examples")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={exampleInput}
                      onChange={e => setExampleInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addExample()}
                      placeholder={t("slang.examplePlaceholder")}
                      className="flex-1 bg-background border border-border rounded-md px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                    />
                    <button
                      onClick={addExample}
                      className="bg-secondary px-4 py-2.5 rounded-md text-sm hover:bg-secondary/80 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {form.example_sentences.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {form.example_sentences.map((ex, i) => (
                        <div key={i} className="flex items-center justify-between bg-secondary/50 px-3 py-2 rounded-md text-xs">
                          <span>{ex}</span>
                          <button onClick={() => setForm(f => ({ ...f, example_sentences: f.example_sentences.filter((_, idx) => idx !== i) }))}>
                            <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grammar note */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t("slang.grammar")}
                  </label>
                  <input
                    value={form.grammar_note}
                    onChange={e => setForm(f => ({ ...f, grammar_note: e.target.value }))}
                    placeholder={t("slang.grammarPlaceholder")}
                    className="bg-background border border-border rounded-md px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                  />
                </div>

                {/* Usage context */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t("slang.usage")}
                  </label>
                  <input
                    value={form.usage_context}
                    onChange={e => setForm(f => ({ ...f, usage_context: e.target.value }))}
                    placeholder={t("slang.usagePlaceholder")}
                    className="bg-background border border-border rounded-md px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={addMutation.isPending}
                  className="bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                >
                  {addMutation.isPending ? t("slang.saving") : t("slang.save")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Language filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterLanguage("")}
            className={`px-3 py-1.5 rounded-md text-xs transition ${
              filterLanguage === ""
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => setFilterLanguage(l.code)}
              className={`px-3 py-1.5 rounded-md text-xs transition ${
                filterLanguage === l.code
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Slang list */}
        {isLoading ? (
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        ) : slangList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm mb-2">{t("slang.noSlang")}</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-primary text-sm hover:underline"
            >
              {t("slang.addFirst")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(grouped).map(([lang, items]) => (
              <div key={lang}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  {LANGUAGES.find(l => l.code === lang)?.label || lang}
                </p>
                <div className="flex flex-col gap-2">
                  {items.map(slang => (
                    <div key={slang.id} className="bg-card border border-border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between px-5 py-4 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === slang.id ? null : slang.id)}
                      >
                        <div className="flex items-center gap-4">
                          <p className="font-medium text-sm">{slang.word_or_phrase}</p>
                          <p className="text-xs text-muted-foreground">
                            {slang.meanings.slice(0, 2).join(", ")}
                            {slang.meanings.length > 2 && "..."}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteMutation.mutate(slang.id)
                            }}
                            className="text-muted-foreground hover:text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {expandedId === slang.id
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          }
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedId === slang.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 pt-0 border-t border-border flex flex-col gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Meanings</p>
                                <div className="flex flex-wrap gap-2">
                                  {slang.meanings.map((m, i) => (
                                    <span key={i} className="bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-full">
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {slang.example_sentences.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Examples</p>
                                  <div className="flex flex-col gap-1">
                                    {slang.example_sentences.map((ex, i) => (
                                      <p key={i} className="text-xs text-muted-foreground">— {ex}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {slang.grammar_note && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Grammar</p>
                                  <p className="text-xs">{slang.grammar_note}</p>
                                </div>
                              )}
                              {slang.usage_context && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Usage</p>
                                  <p className="text-xs">{slang.usage_context}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}