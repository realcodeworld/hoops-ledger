'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { updatePlayer, deletePlayer } from '@/lib/actions/players'
import { ArrowLeft, Save, User, Trash2 } from 'lucide-react'
import { Player, PricingRule } from '@prisma/client'
import { getCurrencySymbol } from '@/lib/format'

interface PlayerEditFormProps {
  player: Player & { pricingRule: PricingRule | null }
  pricingRules: PricingRule[]
  currency: string
}

export function PlayerEditForm({ player, pricingRules, currency }: PlayerEditFormProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setMessage(null)

    try {
      const result = await deletePlayer(player.id)

      if (result.success) {
        router.push('/dashboard/players')
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete player' })
        setIsDeleting(false)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete player',
      })
      setIsDeleting(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setMessage(null)

    try {
      const result = await updatePlayer(formData)

      if (result.success) {
        setMessage({ type: 'success', text: 'Player updated successfully' })
        // Redirect back to player details after a short delay
        setTimeout(() => {
          router.push(`/dashboard/players/${player.id}`)
        }, 1000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update player' })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update player'
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/players/${player.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Player
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Player</h1>
          <p className="mt-2 text-gray-600">Update {player.name}'s information</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" />
            Player Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="id" value={player.id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={player.name}
                  required
                  disabled={isPending}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricingRuleId">Pricing Category</Label>
                <Select name="pricingRuleId" defaultValue={player.pricingRuleId || ''} disabled={isPending} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pricing category" />
                  </SelectTrigger>
                  <SelectContent>
                    {pricingRules.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.name} ({getCurrencySymbol(currency)}{(rule.feePence / 100).toFixed(2)} per session)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={player.email || ''}
                  disabled={isPending}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Required for player portal access
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+447700900123"
                  defaultValue={player.phone || ''}
                  disabled={isPending}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  E.164 only (e.g. +447700900123)
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="openingBalancePounds">Balance carried forward (before Hoops Ledger)</Label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    {getCurrencySymbol(currency)}
                  </span>
                  <Input
                    id="openingBalancePounds"
                    name="openingBalancePounds"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={isPending}
                    className="pl-8"
                    autoComplete="off"
                    defaultValue={
                      (player.openingBalancePence ?? 0) > 0
                        ? ((player.openingBalancePence ?? 0) / 100).toFixed(2)
                        : ''
                    }
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Combined with session fees in one balance; payments you record reduce the total until clear.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isExempt"
                  name="isExempt"
                  value="true"
                  defaultChecked={player.isExempt}
                  disabled={isPending}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="isExempt" className="text-sm font-medium">
                  Exempt from fees
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  value="true"
                  defaultChecked={player.isActive}
                  disabled={isPending}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active member
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hideFromLeaderboard"
                  name="hideFromLeaderboard"
                  value="true"
                  defaultChecked={player.hideFromLeaderboard}
                  disabled={isPending}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <Label htmlFor="hideFromLeaderboard" className="text-sm font-medium">
                  Hide from leaderboard
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={player.notes || ''}
                placeholder="Any additional information about this player..."
                disabled={isPending}
                className="w-full"
                rows={4}
              />
            </div>

            {message && (
              <div className={`text-sm p-3 rounded-lg border ${
                message.type === 'success'
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button type="submit" size="lg" disabled={isPending || isDeleting} className="w-full sm:w-auto">
                  {isPending ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href={`/dashboard/players/${player.id}`}>Cancel</Link>
                </Button>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    disabled={isPending || isDeleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Player'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {player.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this player and all their associated data including attendance records, payments, and match history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-900 mb-2">💡 Player Management Tips</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>• <strong>Email Address:</strong> Required for player to access their portal via magic links</p>
            <p>• <strong>Exempt Status:</strong> Exempt players will never be charged fees, regardless of session pricing</p>
            <p>• <strong>Active Status:</strong> Inactive players won't appear in attendance lists but maintain their history</p>
            <p>• <strong>Pricing Changes:</strong> Pricing category changes will affect future session fees but not past attendance</p>
            <p>• <strong>Carried forward:</strong> Pre-platform debt is combined with session fees; use Record Payment when they pay down the total</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}