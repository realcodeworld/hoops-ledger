import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { OrganizationSettingsForm } from '@/components/hoops/organization-settings-form'
import { PricingRulesManagement } from '@/components/hoops/pricing-rules-management'
import { getOrganizationSettings } from '@/lib/actions/settings'
import { Settings, Users, Mail, Shield } from 'lucide-react'

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            {isAdmin
              ? 'Manage your organization settings and configuration.'
              : 'View organization settings and configuration.'
            }
          </p>
        </div>

        {/* Organization Profile Settings */}
        <OrganizationSettingsForm
          organization={organization}
          isAdmin={isAdmin}
        />

        {/* Pricing Rules Management */}
        <PricingRulesManagement
          pricingRules={organization.pricingRules}
          currency={organization.currency}
          isAdmin={isAdmin}
        />

        {/* Coming Soon Features */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <Settings className="w-6 h-6 text-purple-500 mr-2" />
              <h3 className="text-xl font-semibold text-purple-900">Additional Features - Coming Soon</h3>
            </div>
            <p className="text-purple-700 mb-4">More organization management features are in development:</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <Users className="w-5 h-5 text-purple-500 mb-2" />
                <h4 className="font-medium text-purple-900 mb-1">User Management</h4>
                <p className="text-purple-600">Add and manage admin and coach accounts</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <Mail className="w-5 h-5 text-purple-500 mb-2" />
                <h4 className="font-medium text-purple-900 mb-1">Notifications</h4>
                <p className="text-purple-600">Email preferences and notification settings</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <Shield className="w-5 h-5 text-purple-500 mb-2" />
                <h4 className="font-medium text-purple-900 mb-1">Security</h4>
                <p className="text-purple-600">Password policies and authentication settings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}