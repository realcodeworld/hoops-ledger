import { getSuperAdminSession } from '@/lib/super-admin-auth'
import { redirect } from 'next/navigation'
import { Shield, Users, LogOut, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { logoutSuperAdmin } from '@/lib/actions/super-admin'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const superAdmin = await getSuperAdminSession()

  // If not logged in and not on login page, redirect to login
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  if (!superAdmin) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <h1 className="text-xl font-bold">Super Admin Portal</h1>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/super-admin/organizations"
                className="flex items-center gap-2 hover:text-red-100 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Organizations
              </Link>
              <Link
                href="/super-admin/users"
                className="flex items-center gap-2 hover:text-red-100 transition-colors"
              >
                <Users className="w-4 h-4" />
                Users
              </Link>
              <div className="flex items-center gap-3 border-l border-red-500 pl-6">
                <span className="text-sm">{superAdmin.email}</span>
                <form action={logoutSuperAdmin}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-red-100 hover:bg-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
