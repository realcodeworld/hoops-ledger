'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePricingRule, createPricingRule, deletePricingRule } from '@/lib/actions/settings'
import { DollarSign, Save, Plus, Trash2, Edit, Info, AlertTriangle } from 'lucide-react'
import { PricingRule } from '@prisma/client'

interface PricingRulesManagementProps {
  pricingRules: PricingRule[]
  currency: string
  isAdmin: boolean
}

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'GBP': return '£'
    case 'EUR': return '€'
    case 'USD': return '$'
    case 'AUD': return 'A$'
    default: return currency
  }
}

const formatPrice = (pence: number) => (pence / 100).toFixed(2)

export function PricingRulesManagement({ pricingRules, currency, isAdmin }: PricingRulesManagementProps) {
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const currencySymbol = getCurrencySymbol(currency)

  async function handleUpdateRule(formData: FormData) {
    if (!isAdmin) return

    setIsPending(true)
    setMessage(null)

    try {
      const result = await updatePricingRule(formData)

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Pricing category updated successfully' })
        setEditingRule(null)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update pricing category' })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update pricing category'
      })
    } finally {
      setIsPending(false)
    }
  }

  async function handleCreateRule(formData: FormData) {
    if (!isAdmin) return

    setIsPending(true)
    setMessage(null)

    try {
      const result = await createPricingRule(formData)

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Pricing category created successfully' })
        setShowCreateForm(false)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create pricing category' })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create pricing category'
      })
    } finally {
      setIsPending(false)
    }
  }

  async function handleDeleteRule(pricingRuleId: string) {
    if (!isAdmin) return

    const confirmed = confirm('Are you sure you want to delete this pricing category? This action cannot be undone.')
    if (!confirmed) return

    setIsPending(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('pricingRuleId', pricingRuleId)

      const result = await deletePricingRule(formData)

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Pricing category deleted successfully' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete pricing category' })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete pricing category'
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary" />
            Pricing Categories
          </CardTitle>
          {isAdmin && (
            <Button
              onClick={() => setShowCreateForm(true)}
              disabled={isPending}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Message */}
        {message && (
          <div className={`text-sm p-3 rounded-lg border ${
            message.type === 'success'
              ? 'text-green-700 bg-green-50 border-green-200'
              : 'text-red-700 bg-red-50 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Create New Category Form */}
        {showCreateForm && isAdmin && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Create New Pricing Category</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={handleCreateRule} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Category Name</Label>
                  <Input
                    id="create-name"
                    name="name"
                    type="text"
                    placeholder="e.g., Student, Guest, U17, Over 60"
                    required
                    disabled={isPending}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-fee">Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {currencySymbol}
                    </span>
                    <Input
                      id="create-fee"
                      name="fee"
                      type="number"
                      step="0.01"
                      min="0"
                      max="999.99"
                      placeholder="5.00"
                      required
                      disabled={isPending}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isPending} size="sm">
                    {isPending ? 'Creating...' : 'Create Category'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isPending}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Existing Pricing Categories */}
        <div className="space-y-4">
          {pricingRules.map((rule) => (
            <Card key={rule.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRule(editingRule === rule.id ? null : rule.id)}
                        disabled={isPending}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {pricingRules.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingRule === rule.id && isAdmin ? (
                  <form action={handleUpdateRule} className="space-y-4">
                    <input type="hidden" name="pricingRuleId" value={rule.id} />

                    <div className="space-y-2">
                      <Label htmlFor={`name-${rule.id}`}>Category Name</Label>
                      <Input
                        id={`name-${rule.id}`}
                        name="name"
                        type="text"
                        defaultValue={rule.name}
                        required
                        disabled={isPending}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`fee-${rule.id}`}>Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {currencySymbol}
                        </span>
                        <Input
                          id={`fee-${rule.id}`}
                          name="fee"
                          type="number"
                          step="0.01"
                          min="0"
                          max="999.99"
                          defaultValue={formatPrice(rule.feePence)}
                          required
                          disabled={isPending}
                          className="pl-8"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={isPending} size="sm">
                        {isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingRule(null)}
                        disabled={isPending}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">
                      {currencySymbol}{formatPrice(rule.feePence)}
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      per session
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info about pricing categories */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-2">How Pricing Categories Work:</p>
              <ul className="space-y-1">
                <li><strong>Single Price:</strong> Each category has one price that applies to all players in that category</li>
                <li><strong>Player Assignment:</strong> Assign players to categories like "Standard", "Student", "Guest", "U17", etc.</li>
                <li><strong>Custom Categories:</strong> Create any categories you need - "Student", "Senior", "Junior", "Member", "Non-Member"</li>
                <li><strong>Exempt Players:</strong> Players marked as "exempt" always pay {currencySymbol}0.00 regardless of their category</li>
              </ul>

              {pricingRules.length === 1 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-yellow-800 text-xs">
                    <strong>Note:</strong> You cannot delete this pricing category as it's the only one. Organizations must have at least one pricing category.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isAdmin && (
          <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <strong>View Only:</strong> Only administrators can modify pricing categories.
          </div>
        )}
      </CardContent>
    </Card>
  )
}