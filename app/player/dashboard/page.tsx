import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { Logo } from '@/components/hoops/logo'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import { LogOut, Calendar, CreditCard, TrendingUp } from 'lucide-react'

export default async function PlayerDashboardPage() {
  const player = await getCurrentPlayer()
  
  if (!player) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="sm" />
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {player.name}
              </span>
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
          <p className="mt-2 text-gray-600">
            View your attendance history, balances, and session analytics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sessions Attended</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-success" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Balance</p>
                <p className="text-2xl font-bold text-gray-900">£-</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Attendance Streak</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🏀 Welcome to Your Player Portal!
          </h2>
          <p className="text-gray-600 mb-6">
            Your read-only dashboard is ready. View your session history, 
            track your balance, and monitor your attendance statistics.
          </p>
          <p className="text-sm text-gray-500">
            Coming soon: Session history, balance details, attendance analytics, and receipt viewing.
          </p>
        </div>
      </main>
    </div>
  )
}