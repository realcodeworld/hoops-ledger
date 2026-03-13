import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { Logo } from '@/components/hoops/logo'
import { PlayerBottomNav } from '@/components/hoops/player-bottom-nav'

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const player = await getCurrentPlayer()
  if (!player) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-center">
            <Logo size="sm" />
          </div>
        </div>
      </header>

      {/* On md+: show nav as top bar below header */}
      <div className="hidden md:block border-b border-gray-200 bg-white">
        <PlayerBottomNav playerName={player.name} />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile: fixed bottom nav */}
      <div className="md:hidden">
        <PlayerBottomNav playerName={player.name} />
      </div>
    </div>
  )
}
