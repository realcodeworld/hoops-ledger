import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EditPaymentForm } from '@/components/hoops/edit-payment-form'

export default async function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/auth')
  }

  const { id } = await params

  // Fetch the payment
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      orgId: currentUser.orgId,
    },
    include: {
      player: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!payment) {
    redirect('/dashboard/payments')
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/payments">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Payment</h1>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">
              Update payment details for {payment.player.name}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <EditPaymentForm payment={payment} />
          </CardContent>
        </Card>
    </div>
  )
}
