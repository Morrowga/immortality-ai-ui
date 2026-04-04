// Providers.tsx — increase staleTime so queries don't refetch constantly
"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:            1000 * 60 * 5,  // 5 min — was 1 min, causing constant refetch
        gcTime:               1000 * 60 * 10, // keep cache 10 min
        retry:                1,
        refetchOnWindowFocus: false,           // THIS is huge — stops refetch every tab switch
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}