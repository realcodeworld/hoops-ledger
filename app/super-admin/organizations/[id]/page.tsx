import { getSuperAdminSession } from '@/lib/super-admin-auth'
import { redirect } from 'next/navigation'
import { getOrganizationDetails } from '@/lib/actions/super-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, UserCircle, Mail, Building2 } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const superAdmin = await getSuperAdminSession()

  if (!superAdmin) {
    redirect('/super-admin/login')
  }

  const { id } = await params
  const result = await getOrganizationDetails(id)

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading organization: {result.error}</p>
        <Link href="/super-admin/organizations">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </Button>
        </Link>
      </div>
    )
  }

  const org = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/super-admin/organizations">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold">{org.name}</h1>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline">{org.slug}</Badge>
            <span className="text-sm text-gray-600">
              {org.currency} • {org.timezone}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Users ({org.users.length})
            </CardTitle>
            <CardDescription>
              Staff members with admin or supervisor access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {org.users.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No users found</p>
            ) : (
              <div className="space-y-3">
                {org.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                      {user.lastLoginAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Players Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-orange-600" />
              Players ({org.players.length})
            </CardTitle>
            <CardDescription>
              Registered players in this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {org.players.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No players found</p>
            ) : (
              <div className="space-y-3">
                {org.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      {player.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Mail className="w-3 h-3" />
                          {player.email}
                        </div>
                      )}
                      {player.phone && (
                        <div className="text-xs text-gray-500 mt-1">
                          Phone: {player.phone}
                        </div>
                      )}
                      {player.lastLoginAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last login: {new Date(player.lastLoginAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant={player.isActive ? 'default' : 'secondary'}>
                        {player.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {player.isExempt && (
                        <Badge variant="outline" className="text-xs">
                          Exempt
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{org.users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{org.players.length}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {org.players.filter(p => p.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Active Players</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {org.players.filter(p => p.email).length}
              </div>
              <div className="text-sm text-gray-600">Players with Email</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
