import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { RegisterForm } from './register-form'
import { Logo } from '@/components/hoops/logo'
import Link from 'next/link'

export default async function RegisterPage() {
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
            Create New Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your basketball club management system
          </p>
        </div>
        <RegisterForm />

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth" className="text-orange-600 hover:text-orange-500 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}