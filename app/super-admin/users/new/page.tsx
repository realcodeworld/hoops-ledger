import { getSuperAdminSession } from '@/lib/super-admin-auth'
import { redirect } from 'next/navigation'
import { getAllOrganizations } from '@/lib/actions/super-admin'
import { NewUserForm } from './new-user-form'

export default async function NewUserPage() {
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

  return <NewUserForm organizations={result.data || []} />
}
