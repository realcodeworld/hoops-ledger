import { getSuperAdminSession } from '@/lib/super-admin-auth'
import { redirect } from 'next/navigation'
import { getAllOrganizations } from '@/lib/actions/super-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function OrganizationsPage() {
  const superAdmin = await getSuperAdminSession()

  if (!superAdmin) {
    redirect('/super-admin/login')
  }

  const result = await getAllOrganizations()

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading organizations: {result.error}</p>
      </div>
    )
  }

  const organizations = result.data || []

  // Get counts for each organization
  const orgsWithCounts = await Promise.all(
    organizations.map(async (org) => {
      const [userCount, playerCount] = await Promise.all([
        prisma.user.count({ where: { orgId: org.id } }),
        prisma.player.count({ where: { orgId: org.id } }),
      ])
      return { ...org, userCount, playerCount }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organizations</h1>
        <p className="text-gray-600 mt-1">
          Select an organization to view its users and players
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgsWithCounts.map((org) => (
          <Link key={org.id} href={`/super-admin/organizations/${org.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-xl">{org.name}</CardTitle>
                  </div>
                </div>
                <CardDescription>
                  <Badge variant="outline" className="mt-2">
                    {org.slug}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Users</span>
                    </div>
                    <Badge variant="secondary">{org.userCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <UserCircle className="w-4 h-4" />
                      <span>Players</span>
                    </div>
                    <Badge variant="secondary">{org.playerCount}</Badge>
                  </div>
                  <div className="pt-2 border-t text-xs text-gray-500">
                    <div>Currency: {org.currency}</div>
                    <div>Timezone: {org.timezone}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {orgsWithCounts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No organizations found
          </CardContent>
        </Card>
      )}
    </div>
  )
}
