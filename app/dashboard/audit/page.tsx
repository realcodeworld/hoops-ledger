import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default async function AuditPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  return (
    <AdminLayout currentPath="/dashboard/audit">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-gray-600">Track all system activities and changes.</p>
        </div>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">Audit Trail - Ready to Build</h3>
            <p className="text-green-700 mb-4">Complete audit logging system with detailed activity tracking</p>
            <div className="text-sm text-green-600 space-y-1 text-left max-w-md mx-auto">
              <p>✅ All user actions logged with timestamps</p>
              <p>✅ Payment and attendance change tracking</p>
              <p>✅ Player and session modification history</p>
              <p>✅ Before/after state comparison</p>
              <p>✅ Searchable and filterable audit trail</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}