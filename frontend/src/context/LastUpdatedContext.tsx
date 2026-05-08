import { createContext, useContext, useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'

interface LastUpdatedContextValue {
  lastUpdated: Date | null
  setLastUpdated: (d: Date) => void
  refresh: () => void
  setRefresh: (fn: () => void) => void
}

export const LastUpdatedContext = createContext<LastUpdatedContextValue>({
  lastUpdated: null,
  setLastUpdated: () => {},
  refresh: () => {},
  setRefresh: () => {},
})

export function LastUpdatedProvider({ children }: { children: ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const refreshRef = useRef<() => void>(() => {})

  const setRefresh = useCallback((fn: () => void) => {
    refreshRef.current = fn
  }, [])

  const refresh = useCallback(() => {
    refreshRef.current()
  }, [])

  return (
    <LastUpdatedContext.Provider value={{ lastUpdated, setLastUpdated, refresh, setRefresh }}>
      {children}
    </LastUpdatedContext.Provider>
  )
}

export function useLastUpdated() {
  return useContext(LastUpdatedContext)
}
