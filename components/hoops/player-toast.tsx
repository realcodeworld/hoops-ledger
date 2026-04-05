'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

type ToastContextValue = {
  show: (message: string) => void
}

const PlayerToastContext = createContext<ToastContextValue | null>(null)

export function PlayerToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)

  const show = useCallback((m: string) => {
    setMessage(m)
    window.setTimeout(() => setMessage(null), 2600)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <PlayerToastContext.Provider value={value}>
      {children}
      {message && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-24 left-1/2 z-[60] max-w-[min(90vw,20rem)] -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 md:bottom-8"
        >
          {message}
        </div>
      )}
    </PlayerToastContext.Provider>
  )
}

export function usePlayerToast() {
  return useContext(PlayerToastContext)
}
