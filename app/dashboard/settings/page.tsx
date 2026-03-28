import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { OrganizationSettingsForm } from '@/components/hoops/organization-settings-form'
import { PricingRulesManagement } from '@/components/hoops/pricing-rules-management'
import { ChangePasswordForm } from '@/components/hoops/change-password-form'
import { BackfillPaymentRefsCard } from '@/components/hoops/backfill-payment-refs-card'
import { getOrganizationSettings } from '@/lib/actions/settings'
import { prisma } from '@/lib/prisma'

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

  const playerCount = isAdmin
    ? await prisma.player.count({ where: { orgId: user.orgId } })
    : 0

  return (
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

          <BackfillPaymentRefsCard playerCount={playerCount} />

          <PricingRulesManagement
            pricingRules={organization.pricingRules}
            currency={organization.currency}
            isAdmin={isAdmin}
          />
        </>
      )}
    </div>
  )
}