'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registerUser } from '@/lib/actions/auth'
import { UserPlus } from 'lucide-react'

export function RegisterForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)

    try {
      const result = await registerUser(formData)

      if (!result.success) {
        setError(result.error || 'Registration failed')
        return
      }

      // Success - redirect will happen automatically
      window.location.href = '/dashboard'
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>
          Create your organization and admin account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="organizationName" className="text-sm font-medium">
              Organization Name
            </label>
            <Input
              id="organizationName"
              name="organizationName"
              type="text"
              placeholder="Downtown Basketball Club"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Your Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Smith"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@club.com"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
              minLength={6}
            />
            <p className="text-xs text-gray-500">
              Minimum 6 characters
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? (
              'Creating Account...'
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This will create your organization with default pricing: Student £3, Standard £5, Guest £0
          </p>
        </div>
      </CardContent>
    </Card>
  )
}