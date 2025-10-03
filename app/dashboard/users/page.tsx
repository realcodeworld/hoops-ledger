import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Shield, UserCog } from 'lucide-react'
import { getUsers } from '@/lib/actions/users'
import { DeleteUserButton } from './delete-user-button'

export default async function UsersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  const usersResult = await getUsers()
  const users = usersResult.success ? usersResult.data || [] : []

  return (
    <AdminLayout currentPath="/dashboard/users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Manage admin and supervisor accounts.</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/users/new">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Link>
          </Button>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {u.role === 'admin' ? (
                            <Shield className="w-5 h-5 text-red-600" />
                          ) : (
                            <UserCog className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{u.name}</h3>
                            <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>
                              {u.role}
                            </Badge>
                            {u.id === user.id && (
                              <Badge variant="outline">You</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{u.email}</p>
                          {u.lastLoginAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Last login: {new Date(u.lastLoginAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/users/${u.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                      {u.id !== user.id && (
                        <DeleteUserButton userId={u.id} userName={u.name} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
