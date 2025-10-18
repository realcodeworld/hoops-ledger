'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CreditCard, Plus, Edit3, Save, X, Banknote, Building2 } from 'lucide-react'
import { markPayment, addPlayerToSession, updateAttendanceNotes, markPaymentWithAmount } from '@/lib/actions/attendance'
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

interface PricingRule {
  id: string
  name: string
  feePence: number
}

interface AttendanceManagerProps {
  sessionId: string
  attendance: AttendanceRecord[]
  availablePlayers: Player[]
  pricingRules: PricingRule[]
}

export function AttendanceManager({ sessionId, attendance, availablePlayers, pricingRules }: AttendanceManagerProps) {
  const [selectedPlayerToAdd, setSelectedPlayerToAdd] = useState<string>('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerCategory, setNewPlayerCategory] = useState<string>('')
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [paymentDialog, setPaymentDialog] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  // Restore expanded player state after reload
  useEffect(() => {
    const savedExpandedPlayer = localStorage.getItem('expandedPlayer')
    if (savedExpandedPlayer) {
      setExpandedPlayer(savedExpandedPlayer)
      localStorage.removeItem('expandedPlayer')
    }
  }, [])

  // Filter players not already in attendance
  const attendingPlayerIds = attendance.map(a => a.playerId)
  const availablePlayersForSession = availablePlayers.filter(p =>
    !attendingPlayerIds.includes(p.id) && p.isActive
  )

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

  const handleOpenPaymentDialog = (attendanceId: string, feeAmount: number) => {
    setPaymentDialog(attendanceId)
    setPaymentAmount((feeAmount / 100).toFixed(2))
  }

  const handleMarkPaid = async (attendanceId: string, method: 'cash' | 'bank_transfer') => {
    try {
      const amountPence = Math.round(parseFloat(paymentAmount || '0') * 100)
      // Save expanded state before reload
      if (expandedPlayer) {
        localStorage.setItem('expandedPlayer', expandedPlayer)
      }
      await markPaymentWithAmount(attendanceId, method, amountPence)
      setPaymentDialog(null)
      setPaymentAmount('')
      window.location.reload()
    } catch (error) {
      console.error('Failed to mark payment:', error)
    }
  }

  const handleWaiveFee = async (attendanceId: string) => {
    try {
      // Save expanded state before reload
      if (expandedPlayer) {
        localStorage.setItem('expandedPlayer', expandedPlayer)
      }
      await markPayment(attendanceId, 'waived')
      window.location.reload()
    } catch (error) {
      console.error('Failed to waive fee:', error)
    }
  }

  const handleResetToUnpaid = async (attendanceId: string) => {
    try {
      // Save expanded state before reload
      if (expandedPlayer) {
        localStorage.setItem('expandedPlayer', expandedPlayer)
      }
      await markPayment(attendanceId, 'reset')
      window.location.reload()
    } catch (error) {
      console.error('Failed to reset payment:', error)
    }
  }

  const handleEditNotes = (attendanceId: string, currentNotes: string | null) => {
    setEditingNotes(attendanceId)
    setNoteText(currentNotes || '')
  }

  const handleSaveNotes = async (attendanceId: string) => {
    try {
      // Save the current expanded player to localStorage before reload
      if (expandedPlayer) {
        localStorage.setItem('expandedPlayer', expandedPlayer)
      }
      await updateAttendanceNotes(attendanceId, noteText)
      setEditingNotes(null)
      setNoteText('')
      window.location.reload()
    } catch (error) {
      console.error('Failed to update notes:', error)
    }
  }

  const handleCancelNotes = () => {
    setEditingNotes(null)
    setNoteText('')
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
    if (newPlayerName.trim() && newPlayerCategory) {
      try {
        const result = await createQuickPlayer(newPlayerName.trim(), newPlayerCategory)
        if (result.success && result.data) {
          await addPlayerToSession(sessionId, result.data.id)
          setNewPlayerName('')
          setNewPlayerCategory('')
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

        
        <Dialog open={isAddingPlayer} onOpenChange={setIsAddingPlayer}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
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
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-player-name">Player Name</Label>
                  <Input
                    id="new-player-name"
                    type="text"
                    placeholder="Enter player name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="new-player-category">Category</Label>
                  <Select value={newPlayerCategory} onValueChange={setNewPlayerCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {pricingRules.map((rule) => (
                        <SelectItem key={rule.id} value={rule.id}>
                          {rule.name} - £{(rule.feePence / 100).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newPlayerName.trim() && newPlayerCategory && (
                  <Button
                    onClick={handleCreateAndAddPlayer}
                    className="w-full"
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
                  setNewPlayerCategory('')
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
      <div className="space-y-2">
        {attendance.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No players registered for this session yet.
          </div>
        ) : (
          attendance.map((record) => {
            const isExpanded = expandedPlayer === record.id

            return (
              <div
                key={record.id}
                className="bg-white border rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
              >
                {/* Compact Header - Always Visible */}
                <div
                  className="flex items-center justify-between gap-2 p-3 cursor-pointer active:bg-gray-50"
                  onClick={() => setExpandedPlayer(isExpanded ? null : record.id)}
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">{record.player.name}</h3>
                    <Badge className={`${getStatusBadge(record.status)} text-xs shrink-0`}>
                      {record.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {record.status === 'unpaid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenPaymentDialog(record.id, record.feeAppliedPence)
                        }}
                        className="h-8 px-3"
                      >
                        <CreditCard className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Pay</span>
                      </Button>
                    )}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t p-4 space-y-4 bg-gray-50">
                    {/* Email */}
                    {record.player.email && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Email</span>
                        <p className="text-sm text-gray-700 break-all">{record.player.email}</p>
                      </div>
                    )}

                    {/* Category & Fee */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Category</span>
                        <div className="mt-1">
                          <Badge className={getCategoryBadge(record.player.pricingRule?.name || 'No Category')}>
                            {record.player.pricingRule?.name || 'No Category'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Fee</span>
                        <p className="text-sm font-semibold text-gray-900 tabular-nums mt-1">
                          £{(record.feeAppliedPence / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Payment Info */}
                    {record.payment && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Payment Method</span>
                        <p className="text-sm text-blue-600 capitalize mt-1">
                          {record.payment.method.replace('_', ' ')}
                        </p>
                      </div>
                    )}

                    {/* Notes Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">Notes</span>
                        {editingNotes !== record.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditNotes(record.id, record.notes)
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            {record.notes ? 'Edit' : 'Add'}
                          </Button>
                        )}
                      </div>

                      {editingNotes === record.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="e.g., Will pay on Monday, Cash payment pending..."
                            className="min-h-[60px] text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSaveNotes(record.id)
                              }}
                              className="h-7 px-3 text-xs"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancelNotes()
                              }}
                              className="h-7 px-3 text-xs"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {record.notes ? (
                            <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                              {record.notes}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              No notes added
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      {record.status === 'unpaid' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenPaymentDialog(record.id, record.feeAppliedPence)
                            }}
                            className="flex-1"
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Mark Paid
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleWaiveFee(record.id)
                            }}
                            className="flex-1 text-blue-600 hover:text-blue-700"
                          >
                            Waive Fee
                          </Button>
                        </>
                      )}
                      {(record.status === 'paid' || record.status === 'waived') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleResetToUnpaid(record.id)
                          }}
                          className="w-full text-orange-600 hover:text-orange-700"
                        >
                          Reset to Unpaid
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {paymentDialog && (
            <div className="space-y-4">
              {/* Amount Selection */}
              <div>
                <Label htmlFor="payment-amount">Payment Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Fee due: £{((attendance.find(a => a.id === paymentDialog)?.feeAppliedPence || 0) / 100).toFixed(2)}
                </p>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={() => handleMarkPaid(paymentDialog, 'cash')}
                    className="flex items-center justify-center gap-3 h-12"
                    variant="outline"
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Cash Payment</span>
                  </Button>
                  <Button
                    onClick={() => handleMarkPaid(paymentDialog, 'bank_transfer')}
                    className="flex items-center justify-center gap-3 h-12"
                    variant="outline"
                  >
                    <Building2 className="w-5 h-5" />
                    <span>Bank Transfer</span>
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setPaymentDialog(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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