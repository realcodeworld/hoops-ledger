import type { MatchListPlayerEntry } from '@/lib/match-list-display'

export function MatchRowTeams({ matchPlayers }: { matchPlayers: MatchListPlayerEntry[] }) {
  const teamAPlayers = matchPlayers.filter((mp) => mp.team === 'A')
  const teamBPlayers = matchPlayers.filter((mp) => mp.team === 'B')
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
      <div>
        <p className="font-medium text-blue-700">Team A</p>
        <p className="text-gray-600">{teamAPlayers.map((mp) => mp.player.name).join(', ')}</p>
      </div>
      <div>
        <p className="font-medium text-amber-700">Team B</p>
        <p className="text-gray-600">{teamBPlayers.map((mp) => mp.player.name).join(', ')}</p>
      </div>
    </div>
  )
}
