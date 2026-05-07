import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface LastUpdatedContextValue {
  lastUpdated: Date | null
  setLastUpdated: (d: Date) => void
}

export const LastUpdatedContext = createContext<LastUpdatedContextValue>({
  lastUpdated: null,
  setLastUpdated: () => {},
})

export function LastUpdatedProvider({ children }: { children: ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  return (
    <LastUpdatedContext.Provider value={{ lastUpdated, setLastUpdated }}>
      {children}
    </LastUpdatedContext.Provider>
  )
}

export function useLastUpdated() {
  return useContext(LastUpdatedContext)
}
