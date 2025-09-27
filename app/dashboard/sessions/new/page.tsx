import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, ArrowLeft, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { createSession } from '@/lib/actions/sessions'
import { getOrganizationSettings } from '@/lib/actions/settings'

export default async function NewSessionPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const organization = await getOrganizationSettings()

  if (!organization) {
    redirect('/auth')
  }

  const formatPrice = (pence: number) => (pence / 100).toFixed(2)
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'GBP': return '£'
      case 'EUR': return '€'
      case 'USD': return '$'
      case 'AUD': return 'A$'
      default: return currency
    }
  }

  const currencySymbol = getCurrencySymbol(organization.currency)

  return (
    <AdminLayout currentPath="/dashboard/sessions/new">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/sessions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Session</h1>
            <p className="mt-2 text-gray-600">
              Create a new training session for attendance tracking.
            </p>
          </div>
        </div>

        {/* Create Session Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSession} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Session Name (Optional)</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g., Advanced Training"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Leave blank for default naming (Training Session - Date)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    name="venue"
                    type="text"
                    placeholder="e.g., Main Court"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                    className="w-full"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    required
                    className="w-full"
                    defaultValue="19:00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (Optional)</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    className="w-full"
                    defaultValue="21:00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (Optional)</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g., 20"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Maximum number of players
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowGuests">Guest Policy</Label>
                <Select name="allowGuests" defaultValue="true">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Allow Guests</SelectItem>
                    <SelectItem value="false">Members Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional information about this session..."
                  className="w-full"
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" className="w-full sm:w-auto">
                  Create Session
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/dashboard/sessions">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-medium text-blue-900 mb-2">💡 Session Creation Tips</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>• <strong>Player Pricing:</strong> Player fees are determined by their individual pricing category (Standard, Student, Guest, etc.)</p>
              <p>• <strong>Attendance Tracking:</strong> Once created, you can mark attendance and apply payments in real-time</p>
              <p>• <strong>Guest Players:</strong> Enable guest access to allow non-members to join this session</p>
              <p>• <strong>Capacity Management:</strong> Set limits to control session size and prevent overbooking</p>
              <p>• <strong>Pricing Management:</strong> Create and manage pricing categories in Settings → Pricing Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}