'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="bg-white rounded-2xl p-8 shadow-sm max-w-sm w-full">
        <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <WifiOff className="h-8 w-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re offline</h1>
        <p className="text-gray-600 mb-6">
          Check your internet connection and try again
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="w-full"
        >
          Try again
        </Button>
      </div>
    </div>
  )
}
