import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { LoginForm } from './login-form'
import { Logo } from '@/components/hoops/logo'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AuthPage() {
  const user = await getCurrentUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo size="lg" className="justify-center" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Admin Login
          </h2>
        </div>
        <LoginForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Are you a player?{' '}
            <Link href="/auth/player" className="text-orange-600 hover:text-orange-500 font-medium">
              Player login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}