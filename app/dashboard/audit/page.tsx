import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAuditLogs } from '@/lib/actions/audit'
import { formatDateTime } from '@/lib/utils'

export default async function AuditPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const result = await getAuditLogs(undefined, undefined, undefined, 100)
  const logs = result.success && result.data ? result.data : []

  return (
    <AdminLayout currentPath="/dashboard/audit">
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Audit logs</h1>

        {!result.success && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <p className="text-amber-800">
                {result.error === 'Insufficient permissions'
                  ? 'Only admins can view audit logs.'
                  : result.error ?? 'Failed to load audit logs.'}
              </p>
            </CardContent>
          </Card>
        )}

        {result.success && logs.length === 0 && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-6 text-center text-gray-600">
              No audit logs yet
            </CardContent>
          </Card>
        )}

        {result.success && logs.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>{log.actorName}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell className="font-mono text-xs">{log.entityId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}