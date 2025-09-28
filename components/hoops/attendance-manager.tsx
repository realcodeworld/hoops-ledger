'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CreditCard, Plus } from 'lucide-react'
import { markPayment, addPlayerToSession } from '@/lib/actions/attendance'
import { createQuickPlayer } from '@/lib/actions/players'

interface AttendanceRecord {
  id: string
  playerId: string
  feeAppliedPence: number
  status: 'unpaid' | 'paid' | 'waived' | 'exempt'
  notes: string | null
  player: {
    name: string
    email: string | null
    isExempt: boolean
    pricingRule?: {
      name: string
      feePence: number
    } | null
  }
  payment: {
    id: string
    method: string
    occurredOn: Date
  } | null
}

interface Player {
  id: string
  name: string
  email: string | null
  isActive: boolean
  pricingRule?: {
    name: string
    feePence: number
  } | null
}

interface AttendanceManagerProps {
  sessionId: string
  attendance: AttendanceRecord[]
  availablePlayers: Player[]
}

export function AttendanceManager({ sessionId, attendance, availablePlayers }: AttendanceManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState<string>('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)

  // Filter players not already in attendance
  const attendingPlayerIds = attendance.map(a => a.playerId)
  const availablePlayersForSession = availablePlayers.filter(p => 
    !attendingPlayerIds.includes(p.id) && p.isActive
  )

  // Filter attendance based on selected player from ALL players in organization
  const filteredAttendance = searchQuery && searchQuery !== 'all'
    ? attendance.filter(record => record.playerId === searchQuery)
    : attendance

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      waived: 'bg-blue-100 text-blue-800',
      exempt: 'bg-gray-100 text-gray-800'
    }
    return variants[status as keyof typeof variants] || variants.unpaid
  }

  const getCategoryBadge = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase()
    if (lowerName.includes('student')) return 'bg-purple-100 text-purple-800'
    if (lowerName.includes('standard')) return 'bg-orange-100 text-orange-800'
    if (lowerName.includes('guest')) return 'bg-yellow-100 text-yellow-800'
    if (lowerName.includes('junior') || lowerName.includes('u17') || lowerName.includes('u18')) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  const handleMarkPaid = async (attendanceId: string) => {
    try {
      await markPayment(attendanceId, 'cash')
      window.location.reload()
    } catch (error) {
      console.error('Failed to mark payment:', error)
    }
  }

  const handleWaiveFee = async (attendanceId: string) => {
    try {
      await markPayment(attendanceId, 'waived')
      window.location.reload()
    } catch (error) {
      console.error('Failed to waive fee:', error)
    }
  }

  const handleAddExistingPlayer = async () => {
    if (selectedPlayerToAdd) {
      try {
        await addPlayerToSession(sessionId, selectedPlayerToAdd)
        setSelectedPlayerToAdd('')
        setIsAddingPlayer(false)
        window.location.reload()
      } catch (error) {
        console.error('Failed to add player:', error)
      }
    }
  }

  const handleCreateAndAddPlayer = async () => {
    if (newPlayerName.trim()) {
      try {
        const result = await createQuickPlayer(newPlayerName.trim())
        if (result.success && result.data) {
          await addPlayerToSession(sessionId, result.data.id)
          setNewPlayerName('')
          setIsAddingPlayer(false)
          window.location.reload()
        }
      } catch (error) {
        console.error('Failed to create and add player:', error)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Player Filter and Add Players */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="player-filter" className="sr-only">Add player to session</Label>
          <Select value="" onValueChange={async (playerId) => {
            if (playerId && playerId !== 'all') {
              try {
                await addPlayerToSession(sessionId, playerId)
                window.location.reload()
              } catch (error) {
                console.error('Failed to add player:', error)
              }
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a player to add to session" />
            </SelectTrigger>
            <SelectContent>
              {availablePlayersForSession.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name} ({player.pricingRule?.name || 'No Category'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label htmlFor="player-filter" className="sr-only">Filter by player</Label>
          <Select value={searchQuery || 'all'} onValueChange={setSearchQuery}>
            <SelectTrigger>
              <SelectValue placeholder="Filter view by player" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Show All Players ({attendance.length})</SelectItem>
              {attendance.map((record) => (
                <SelectItem key={record.playerId} value={record.playerId}>
                  {record.player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isAddingPlayer} onOpenChange={setIsAddingPlayer}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Player to Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {availablePlayersForSession.length > 0 && (
                <div>
                  <Label htmlFor="existing-player">Select Existing Player</Label>
                  <Select value={selectedPlayerToAdd} onValueChange={setSelectedPlayerToAdd}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose from existing players" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlayersForSession.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name} ({player.pricingRule?.name || 'No Category'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPlayerToAdd && (
                    <Button 
                      onClick={handleAddExistingPlayer}
                      className="w-full mt-2"
                    >
                      Add Selected Player
                    </Button>
                  )}
                </div>
              )}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or create new player
                  </span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="new-player-name">Player Name</Label>
                <Input
                  id="new-player-name"
                  type="text"
                  placeholder="Enter player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPlayerName.trim()) {
                      handleCreateAndAddPlayer()
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Creates player with default settings (Standard category)
                </p>
                {newPlayerName.trim() && (
                  <Button 
                    onClick={handleCreateAndAddPlayer}
                    className="w-full mt-2"
                  >
                    Create & Add Player
                  </Button>
                )}
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingPlayer(false)
                  setSelectedPlayerToAdd('')
                  setNewPlayerName('')
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Attendance List */}
      <div className="space-y-3">
        {filteredAttendance.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No players registered for this session yet.
          </div>
        ) : (
          filteredAttendance.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{record.player.name}</h3>
                    {record.player.email && (
                      <p className="text-sm text-gray-500">{record.player.email}</p>
                    )}
                  </div>
                  <Badge className={getCategoryBadge(record.player.pricingRule?.name || 'No Category')}>
                    {record.player.pricingRule?.name || 'No Category'}
                  </Badge>
                  <Badge className={getStatusBadge(record.status)}>
                    {record.status}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    Fee: £{(record.feeAppliedPence / 100).toFixed(2)}
                  </span>
                  {record.payment && (
                    <span className="text-sm text-blue-600">
                      Paid via {record.payment.method}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {record.status === 'unpaid' && (
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkPaid(record.id)}
                      className="tap-target"
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Mark Paid
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWaiveFee(record.id)}
                      className="tap-target text-blue-600 hover:text-blue-700"
                    >
                      Waive
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile-friendly summary */}
      <div className="lg:hidden mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">{attendance.length}</div>
            <div className="text-xs text-gray-500">Total Players</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {attendance.filter(a => a.status === 'paid').length}
            </div>
            <div className="text-xs text-gray-500">Paid</div>
          </div>
        </div>
      </div>
    </div>
  )
}