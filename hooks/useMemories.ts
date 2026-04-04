import { useState, useCallback, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { memoriesAPI } from "@/lib/api"

export type TrainingMode = "all" | "manual" | "conversation" | "correction"
export type Section      = "all" | "BASIC" | "PAST" | "PRESENT" | "FUTURE"

export interface Memory {
  id:                  string
  section:             string
  what_happened:       string
  how_i_felt:          string
  why_it_mattered:     string
  what_i_learned:      string
  instinct_formed:     string
  feeling_weight:      number
  never_forget:        boolean
  is_core_memory:      boolean
  pattern_tags:        string[]
  reinforcement_count: number
  training_mode:       string
  created_at:          string | null
  last_reinforced_at:  string | null
}

export interface MemoryStats {
  total:              number
  by_section:         Record<string, number>
  by_training_mode:   Record<string, number>
  never_forget_count: number
  avg_weight:         number
  wisdom_score:       number
  review_count:       number
}

const LIMIT = 30

function addToSet(prev: Set<string>, id: string): Set<string> {
  return new Set(Array.from(prev).concat(id))
}

export function useMemories() {
  const queryClient = useQueryClient()

  // ── Filters ────────────────────────────────────────────────────────────
  const [mode,    setMode]    = useState<TrainingMode>("all")
  const [section, setSection] = useState<Section>("all")
  const [search,  setSearch]  = useState("")
  const [offset,  setOffset]  = useState(0)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
      setOffset(0)
    }, 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search])

  useEffect(() => { setOffset(0) }, [mode, section])

  const isSearching = debouncedSearch.trim().length > 0

  // ── Stats ──────────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery<MemoryStats>({
    queryKey: ["memories", "stats"],
    queryFn:  () => memoriesAPI.stats().then(r => r.data),
  })

  // ── List ───────────────────────────────────────────────────────────────
  const listParams = {
    limit:  LIMIT,
    offset,
    ...(mode    !== "all" ? { training_mode: mode } : {}),
    ...(section !== "all" ? { section }             : {}),
  }

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["memories", "list", listParams],
    queryFn:  () => memoriesAPI.list(listParams).then(r => r.data),
    enabled:  !isSearching,
  })

  // ── Search ─────────────────────────────────────────────────────────────
  const searchParams = {
    limit:  LIMIT,
    offset,
    ...(mode    !== "all" ? { training_mode: mode } : {}),
    ...(section !== "all" ? { section }             : {}),
  }

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["memories", "search", debouncedSearch, searchParams],
    queryFn:  () => memoriesAPI.search(debouncedSearch, searchParams).then(r => r.data),
    enabled:  isSearching,
  })

  const activeData = isSearching ? searchData : listData
  const memories   = activeData?.memories ?? []
  const total      = activeData?.total    ?? 0
  const isLoading  = isSearching ? searchLoading : listLoading
  const hasMore    = offset + LIMIT < total

  // ── Delete ─────────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memoriesAPI.delete(id).then(r => r.data),
    onSuccess: () => {
      setDeletingId(null)
      queryClient.invalidateQueries({ queryKey: ["memories"] })
      queryClient.invalidateQueries({ queryKey: ["agent"] })
    },
  })

  const confirmDelete = useCallback((id: string) => setDeletingId(id), [])
  const cancelDelete  = useCallback(() => setDeletingId(null), [])
  const executeDelete = useCallback((id: string) => deleteMutation.mutate(id), [deleteMutation])

  // ── Pagination ─────────────────────────────────────────────────────────
  const loadMore = useCallback(() => setOffset(prev => prev + LIMIT), [])
  const loadPrev = useCallback(() => setOffset(prev => Math.max(0, prev - LIMIT)), [])

  // ── Review dialog ──────────────────────────────────────────────────────
  const [reviewOpen, setReviewOpen] = useState(false)

  const { data: reviewData, isLoading: reviewLoading } = useQuery({
    queryKey: ["memories", "review"],
    queryFn:  () => memoriesAPI.review().then(r => r.data),
    enabled:  reviewOpen,
  })

  const reviewMemories = reviewData?.memories ?? []

  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())

  const visibleReviewMemories = reviewMemories.filter(
    (m: Memory) => !reviewedIds.has(m.id)
  )

  useEffect(() => {
    if (reviewOpen && reviewData && visibleReviewMemories.length === 0) {
      const timer = setTimeout(() => {
        setReviewOpen(false)
        setReviewedIds(new Set())
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [reviewOpen, reviewData, visibleReviewMemories.length])

  const archiveMutation = useMutation({
    mutationFn: (id: string) => memoriesAPI.archive(id).then(r => r.data),
    onSuccess: (_, id) => {
      setReviewedIds(prev => addToSet(prev, id))
      queryClient.invalidateQueries({ queryKey: ["memories"] })
    },
  })

  const reviewDeleteMutation = useMutation({
    mutationFn: (id: string) => memoriesAPI.delete(id).then(r => r.data),
    onSuccess: (_, id) => {
      setReviewedIds(prev => addToSet(prev, id))
      queryClient.invalidateQueries({ queryKey: ["memories"] })
      queryClient.invalidateQueries({ queryKey: ["agent"] })
    },
  })

  const keepMemory = useCallback((id: string) => {
    setReviewedIds(prev => addToSet(prev, id))
  }, [])

  const openReview = useCallback(() => {
    setReviewedIds(new Set())
    setReviewOpen(true)
  }, [])

  const closeReview = useCallback(() => {
    setReviewOpen(false)
    setReviewedIds(new Set())
    queryClient.invalidateQueries({ queryKey: ["memories", "stats"] })
  }, [queryClient])

  return {
    mode,    setMode,
    section, setSection,
    search,  setSearch,
    memories,
    total,
    stats,
    isLoading,
    statsLoading,
    isSearching,
    debouncedSearch,
    offset,
    hasMore,
    hasPrev: offset > 0,
    loadMore,
    loadPrev,
    deletingId,
    confirmDelete,
    cancelDelete,
    executeDelete,
    deleteLoading: deleteMutation.isPending,
    reviewOpen,
    openReview,
    closeReview,
    reviewMemories:      visibleReviewMemories,
    reviewLoading,
    reviewCount:         stats?.review_count ?? 0,
    archiveMutation,
    reviewDeleteMutation,
    keepMemory,
  }
}