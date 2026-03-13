import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getPayments } from '@/lib/actions/payments'
import { PaymentsTable } from '@/components/hoops/payments-table'

export default async function PaymentsPage() {
  const result = await getPayments(100)
  const payments = result.success && result.data ? result.data : []

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payments</h1>
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/dashboard/payments/new">
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No payments yet</p>
                <Button asChild size="sm" className="mt-4" variant="outline">
                  <Link href="/dashboard/payments/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Record payment
                  </Link>
                </Button>
              </div>
            ) : (
              <PaymentsTable payments={payments} />
            )}
          </CardContent>
        </Card>
    </div>
  )
}