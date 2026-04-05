'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function PlayerRefreshButton({ label = 'Refresh' }: { label?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 gap-1.5 h-9 border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-transform"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      aria-label={label}
      title={label}
    >
      <RefreshCw
        className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`}
        aria-hidden
      />
      <span className="hidden sm:inline text-xs">{label}</span>
    </Button>
  )
}
