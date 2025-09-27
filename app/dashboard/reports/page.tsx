import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default async function ReportsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  return (
    <AdminLayout currentPath="/dashboard/reports">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">Financial reports and attendance analytics.</p>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-blue-900 mb-2">Analytics Dashboard - Coming Soon</h3>
            <p className="text-blue-700 mb-4">Comprehensive reporting and data visualization features</p>
            <div className="text-sm text-blue-600 space-y-1 text-left max-w-md mx-auto">
              <p>📊 Financial reports with revenue tracking</p>
              <p>📈 Attendance trends and player analytics</p>
              <p>💰 Payment method breakdowns</p>
              <p>📅 Session performance metrics</p>
              <p>📋 Exportable CSV and PDF reports</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}