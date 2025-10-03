import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, UserCog } from 'lucide-react'
import Link from 'next/link'
import { updateUser } from '@/lib/actions/users'
import { prisma } from '@/lib/prisma'

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  const { id } = await params

  const editUser = await prisma.user.findFirst({
    where: {
      id,
      orgId: user.orgId,
    },
  })

  if (!editUser) {
    notFound()
  }

  return (
    <AdminLayout currentPath="/dashboard/users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href="/dashboard/users">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit User</h1>
          </div>
        </div>

        {/* Edit User Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCog className="w-5 h-5 mr-2 text-primary" />
              User Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateUser} className="space-y-6">
              <input type="hidden" name="id" value={editUser.id} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    defaultValue={editUser.name}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    defaultValue={editUser.email}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select name="role" required defaultValue={editUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Admins have full access. Supervisors can manage sessions and payments.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New Password (optional)</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={8}
                    placeholder="Leave blank to keep current"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Only fill this in if you want to change the password
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" className="w-full sm:w-auto">
                  Update User
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/dashboard/users">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
