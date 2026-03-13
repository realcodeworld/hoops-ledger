import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAuditLogs, getAuditLogActions } from '@/lib/actions/audit'
import { formatDateTime } from '@/lib/utils'

interface AuditPageProps {
  searchParams: Promise<{ action?: string; from?: string; to?: string }>
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const params = await searchParams
  const actionFilter = params.action ?? ''
  const fromFilter = params.from ?? ''
  const toFilter = params.to ?? ''

  const [result, actionsResult] = await Promise.all([
    getAuditLogs(undefined, undefined, actionFilter || undefined, 100, fromFilter || undefined, toFilter || undefined),
    getAuditLogActions(),
  ])

  const logs = result.success && result.data ? result.data : []
  const actions = actionsResult.success && actionsResult.data ? actionsResult.data : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Audit logs</h1>

        {user.role === 'admin' && (
          <Card>
            <CardContent className="pt-6">
              <form method="get" action="/dashboard/audit" className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="action">Action</Label>
                  <select
                    id="action"
                    name="action"
                    defaultValue={actionFilter}
                    className="flex h-10 w-full min-w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">All actions</option>
                    {actions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from">From date</Label>
                  <Input
                    id="from"
                    name="from"
                    type="date"
                    defaultValue={fromFilter}
                    className="w-full min-w-[140px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">To date</Label>
                  <Input
                    id="to"
                    name="to"
                    type="date"
                    defaultValue={toFilter}
                    className="w-full min-w-[140px]"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Apply filters
                </Button>
                {(actionFilter || fromFilter || toFilter) && (
                  <Button asChild variant="outline">
                    <Link href="/dashboard/audit">Clear</Link>
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        )}

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
  )
}