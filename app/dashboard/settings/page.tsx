import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { OrganizationSettingsForm } from '@/components/hoops/organization-settings-form'
import { PricingRulesManagement } from '@/components/hoops/pricing-rules-management'
import { ChangePasswordForm } from '@/components/hoops/change-password-form'
import { getOrganizationSettings } from '@/lib/actions/settings'

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const organization = await getOrganizationSettings()

  if (!organization) {
    redirect('/auth')
  }

  const isAdmin = user.role === 'admin'

  return (
    <AdminLayout currentPath="/dashboard/settings">
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>

        {/* Change Password - Available to all users */}
        <ChangePasswordForm />

        {/* Organization Settings - Admin only */}
        {isAdmin && (
          <>
            <OrganizationSettingsForm
              organization={organization}
              isAdmin={isAdmin}
            />

            <PricingRulesManagement
              pricingRules={organization.pricingRules}
              currency={organization.currency}
              isAdmin={isAdmin}
            />
          </>
        )}
      </div>
    </AdminLayout>
  )
}