import { SuperAdminLoginForm } from './super-admin-login-form'
import { getSuperAdminSession } from '@/lib/super-admin-auth'
import { redirect } from 'next/navigation'

export default async function SuperAdminLoginPage() {
  const superAdmin = await getSuperAdminSession()

  if (superAdmin) {
    redirect('/super-admin/users')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <SuperAdminLoginForm />
      </div>
    </div>
  )
}
