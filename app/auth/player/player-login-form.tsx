'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requestPlayerMagicLink } from '@/lib/actions/auth'
import { Mail } from 'lucide-react'

export function PlayerLoginForm() {
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await requestPlayerMagicLink(formData)

      if (!result.success) {
        setError(result.error || 'Failed to send magic link')
        return
      }

      setSuccess(true)
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We've sent you a magic link to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Click the link in the email to access your player dashboard. The link will expire in 1 hour.
            </p>
            <Button
              variant="outline"
              onClick={() => setSuccess(false)}
              className="w-full"
            >
              Send another link
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>
          Enter your email to receive a secure login link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              required
              disabled={isPending}
            />
            <p className="text-xs text-gray-500">
              Use the email address registered with your club
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
              'Sending...'
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Magic Link
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
