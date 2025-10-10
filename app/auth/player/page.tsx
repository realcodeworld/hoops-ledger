import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { PlayerLoginForm } from './player-login-form'
import { Logo } from '@/components/hoops/logo'
import Link from 'next/link'

export default async function PlayerLoginPage() {
  const player = await getCurrentPlayer()

  if (player) {
    redirect('/player/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo size="lg" className="justify-center" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Player Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email to receive a secure login link
          </p>
        </div>
        <PlayerLoginForm />

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Are you an admin?{' '}
            <Link href="/auth" className="text-orange-600 hover:text-orange-500 font-medium">
              Admin login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
