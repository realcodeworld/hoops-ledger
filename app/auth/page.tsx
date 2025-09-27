import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { LoginForm } from './login-form'
import { Logo } from '@/components/hoops/logo'

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
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your basketball club
          </p>
        </div>
        <LoginForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Players with email addresses can access their portal via magic links shared by admins.
          </p>
        </div>
      </div>
    </div>
  )
}