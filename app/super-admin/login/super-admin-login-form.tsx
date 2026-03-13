'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginSuperAdmin } from '@/lib/actions/super-admin'
import { Shield } from 'lucide-react'

export function SuperAdminLoginForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)

    try {
      const result = await loginSuperAdmin(formData)

      if (!result.success) {
        setError(result.error || 'Login failed')
        return
      }

      // Success - redirect to super admin dashboard
      window.location.href = '/super-admin/users'
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-red-600" />
          <CardTitle>Super Admin Access</CardTitle>
        </div>
        <CardDescription>
          SaaS administrator login - Manage all users and organizations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="superadmin@example.com"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="destructive"
            size="lg"
            className="w-full text-base font-semibold"
            disabled={isPending}
          >
            {isPending ? (
              'Signing in...'
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Super Admin Sign In
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
