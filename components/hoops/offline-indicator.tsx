'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gray-900 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>You&apos;re offline. Some features may be unavailable.</span>
      </div>
    </div>
  )
}
