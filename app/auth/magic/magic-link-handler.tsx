'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { consumeMagicLink } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export function MagicLinkHandler() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleMagicLink() {
      if (!token) {
        setStatus('error')
        setError('No authentication token provided')
        return
      }

      try {
        await consumeMagicLink(token)
        setStatus('success')
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleMagicLink()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Authenticating...</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-success mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900">Access Granted!</h2>
        <p className="text-gray-600">You are being redirected to your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="text-center space-y-4">
      <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
      <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
      <p className="text-gray-600">{error}</p>
      <div className="space-y-2">
        <p className="text-sm text-gray-500">
          The link may have expired or already been used.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  )
}