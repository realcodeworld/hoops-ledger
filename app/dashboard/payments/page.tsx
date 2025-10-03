import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Plus } from 'lucide-react'
import Link from 'next/link'

export default function PaymentsPage() {
  return (
    <AdminLayout currentPath="/dashboard/payments">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payments</h1>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">Manual payment tracking and balance management.</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/payments/new">
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Link>
          </Button>
        </div>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6 text-center">
            <CreditCard className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-orange-900 mb-2">Payment Tracking - Ready to Build</h3>
            <p className="text-orange-700 mb-4">Complete server actions implemented for manual payment processing</p>
            <div className="text-sm text-orange-600 space-y-1 text-left max-w-md mx-auto">
              <p>✅ Mark attendance as paid/waived with audit trails</p>
              <p>✅ Manual payment recording (cash, bank transfer, other)</p>
              <p>✅ Real-time balance calculations</p>
              <p>✅ Payment history and allocation tracking</p>
              <p>✅ Undo functionality for corrections</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}