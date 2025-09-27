import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PlayerEditForm } from './player-edit-form'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { getOrganizationSettings } from '@/lib/actions/settings'

interface PlayerEditPageProps {
  params: { id: string }
}

export default async function PlayerEditPage({ params }: PlayerEditPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const [player, organization] = await Promise.all([
    prisma.player.findFirst({
      where: {
        id: params.id,
        orgId: user.orgId,
      },
      include: {
        pricingRule: true,
      },
    }),
    getOrganizationSettings(),
  ])

  if (!player) {
    notFound()
  }

  if (!organization) {
    redirect('/auth')
  }

  return (
    <AdminLayout currentPath="/dashboard/players">
      <PlayerEditForm
        player={player}
        pricingRules={organization.pricingRules}
        currency={organization.currency}
      />
    </AdminLayout>
  )
}