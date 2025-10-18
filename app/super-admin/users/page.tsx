import { getSuperAdminSession } from '@/lib/super-admin-auth'
import { redirect } from 'next/navigation'
import { getAllUsers } from '@/lib/actions/super-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users } from 'lucide-react'
import Link from 'next/link'
import { UpdatePasswordButton } from './update-password-button'
import { EditUserButton } from './edit-user-button'
import { DeleteUserButton } from './delete-user-button'

export default async function SuperAdminUsersPage() {
  const superAdmin = await getSuperAdminSession()

  if (!superAdmin) {
    redirect('/super-admin/login')
  }

  const result = await getAllUsers()

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading users: {result.error}</p>
      </div>
    )
  }

  const users = result.data || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all users across all organizations
          </p>
        </div>
        <Link href="/super-admin/users/new">
          <Button className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Create New User
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Users ({users.length})
          </CardTitle>
          <CardDescription>
            Complete list of all registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Organization</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Last Login</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4 font-mono text-sm">{user.email}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="font-medium">{user.org.name}</div>
                        <div className="text-gray-500 text-xs">{user.org.slug}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <EditUserButton user={user} />
                        <UpdatePasswordButton userId={user.id} userName={user.name} />
                        <DeleteUserButton userId={user.id} userName={user.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
