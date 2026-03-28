'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
/** At most one custom install banner per tab session (SPA navigations do not reset this). */
const SESSION_PROMPT_KEY = 'pwa-install-prompt-shown-session'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10)
      if (elapsed < DISMISS_DURATION_MS) {
        return
      }
      localStorage.removeItem(DISMISS_KEY)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      try {
        if (sessionStorage.getItem(SESSION_PROMPT_KEY)) {
          return
        }
        sessionStorage.setItem(SESSION_PROMPT_KEY, '1')
      } catch {
        // sessionStorage unavailable; still allow one prompt this mount
      }
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowBanner(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setShowBanner(false)
    setDeferredPrompt(null)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">Install HoopsLedger</p>
            <p className="text-sm text-gray-600 mt-0.5">
              Add to your home screen for quick access
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1"
          >
            Not now
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="flex-1"
          >
            Install
          </Button>
        </div>
      </div>
    </div>
  )
}
