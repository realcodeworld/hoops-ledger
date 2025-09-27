import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/hoops/logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <Logo size="lg" className="justify-center mb-8" />

        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          HoopsLedger
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          Track hoops. Track dues. Zero fuss.
        </p>

        <div className="space-y-4">
          <Button asChild size="lg" className="w-full bg-orange-500 hover:bg-orange-600">
            <Link href="/auth">
              Admin Login
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full border-orange-200 hover:bg-orange-50">
            <Link href="/register">
              Register New Account
            </Link>
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Basketball club management made simple</p>
        </div>
      </div>
    </div>
  )
}