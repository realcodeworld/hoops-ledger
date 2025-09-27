import { Suspense } from 'react'
import { MagicLinkHandler } from './magic-link-handler'
import { Logo } from '@/components/hoops/logo'

export default function MagicLinkPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <Logo size="lg" className="justify-center" />
        
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Player Access
          </h1>
          <p className="text-gray-600">
            Accessing your personal dashboard...
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Loading...</p>
          </div>
        }>
          <MagicLinkHandler />
        </Suspense>
      </div>
    </div>
  )
}