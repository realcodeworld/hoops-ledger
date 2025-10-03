import Link from 'next/link'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import { LogOut } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { MobileNav } from './mobile-nav'
import { AdminNavigation } from './admin-navigation'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPath?: string
}

export async function AdminLayout({ children, currentPath = '/dashboard' }: AdminLayoutProps) {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Logo size="sm" />
          </div>
          
          <div className="mt-8 flex-grow flex flex-col">
            <AdminNavigation currentPath={currentPath} userRole={user.role} />
          </div>

          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <Logo size="sm" />
          <MobileNav user={user} currentPath={currentPath} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-4 lg:py-6">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}