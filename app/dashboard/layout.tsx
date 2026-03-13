import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Logo } from '@/components/hoops/logo'
import { AdminHeaderMenu } from '@/components/hoops/admin-header-menu'
import { AdminBottomNav } from '@/components/hoops/admin-bottom-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Logo size="sm" />
            <AdminHeaderMenu userName={user.name} userRole={user.role} />
          </div>
        </div>
      </header>

      {/* On lg+: show nav as top bar below header */}
      <div className="hidden lg:block border-b border-gray-200 bg-white">
        <AdminBottomNav userRole={user.role} />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6">
        {children}
      </main>

      {/* Mobile/tablet: fixed bottom nav */}
      <div className="lg:hidden">
        <AdminBottomNav userRole={user.role} />
      </div>
    </div>
  )
}
