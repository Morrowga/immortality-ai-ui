"use client"
import { createContext, useContext, useState, ReactNode } from "react"

interface BillingContextType {
  soulsDialogOpen:    boolean
  setSoulsDialogOpen: (open: boolean) => void
}

const BillingContext = createContext<BillingContextType>({
  soulsDialogOpen:    false,
  setSoulsDialogOpen: () => {},
})

export function BillingProvider({ children }: { children: ReactNode }) {
  const [soulsDialogOpen, setSoulsDialogOpen] = useState(false)

  return (
    <BillingContext.Provider value={{ soulsDialogOpen, setSoulsDialogOpen }}>
      {children}
    </BillingContext.Provider>
  )
}

export function useBillingContext() {
  return useContext(BillingContext)
}