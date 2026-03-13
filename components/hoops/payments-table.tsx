'use client'

import { format } from 'date-fns'
import { Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CurrencyDisplay } from './currency-display'
import { DeletePaymentButton } from './delete-payment-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Payment = {
  id: string
  amountPence: number
  method: string
  occurredOn: Date
  notes: string | null
  player: {
    id: string
    name: string
  }
  session: {
    id: string
    name: string | null
    startsAt: Date
  } | null
}

type PaymentsTableProps = {
  payments: Payment[]
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/players/${payment.player.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {payment.player.name}
                </Link>
              </TableCell>
              <TableCell>
                <CurrencyDisplay
                  amountPence={payment.amountPence}
                />
              </TableCell>
              <TableCell>
                <Badge variant={
                  payment.method === 'cash' ? 'default' :
                  payment.method === 'bank_transfer' ? 'secondary' :
                  'outline'
                }>
                  {payment.method === 'bank_transfer' ? 'Bank Transfer' :
                   payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {format(new Date(payment.occurredOn), 'dd/MM/yy')}
              </TableCell>
              <TableCell>
                {payment.session ? (
                  <Link
                    href={`/dashboard/sessions/${payment.session.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {payment.session.name || format(new Date(payment.session.startsAt), 'dd/MM/yy')}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400">General</span>
                )}
              </TableCell>
              <TableCell className="max-w-xs truncate text-sm text-gray-600">
                {payment.notes || '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Link href={`/dashboard/payments/${payment.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                  <DeletePaymentButton
                    paymentId={payment.id}
                    playerName={payment.player.name}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
