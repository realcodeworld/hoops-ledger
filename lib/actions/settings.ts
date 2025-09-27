'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  currency: z.string().min(1, 'Currency is required'),
})

const pricingRuleSchema = z.object({
  name: z.string().min(1, 'Pricing rule name is required'),
  feePence: z.string().transform(val => Math.round(parseFloat(val) * 100)),
})

const createPricingRuleSchema = pricingRuleSchema

export async function updateOrganization(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can update organization settings')
    }

    const data = organizationSchema.parse({
      name: formData.get('name'),
      timezone: formData.get('timezone'),
      currency: formData.get('currency'),
    })

    await prisma.organization.update({
      where: { id: currentUser.orgId },
      data: {
        name: data.name,
        timezone: data.timezone,
        currency: data.currency,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'organization_updated',
        entityType: 'organization',
        entityId: currentUser.orgId,
        after: {
          name: data.name,
          timezone: data.timezone,
          currency: data.currency,
        },
      },
    })

    revalidatePath('/dashboard/settings')
    return { success: true, message: 'Organization settings updated successfully' }
  } catch (error) {
    console.error('Organization update error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update organization settings'
    }
  }
}

export async function updatePricingRule(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can update pricing rules')
    }

    const pricingRuleId = formData.get('pricingRuleId') as string
    if (!pricingRuleId) {
      throw new Error('Pricing rule ID is required')
    }

    const data = pricingRuleSchema.parse({
      name: formData.get('name'),
      feePence: formData.get('fee'),
    })

    // Get existing pricing rule for audit log
    const existingRule = await prisma.pricingRule.findFirst({
      where: {
        id: pricingRuleId,
        orgId: currentUser.orgId,
      },
    })

    if (!existingRule) {
      throw new Error('Pricing rule not found')
    }

    const updatedRule = await prisma.pricingRule.update({
      where: { id: pricingRuleId },
      data: {
        name: data.name,
        feePence: data.feePence,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'pricing_rule_updated',
        entityType: 'pricing_rule',
        entityId: pricingRuleId,
        before: {
          name: existingRule.name,
          feePence: existingRule.feePence,
        },
        after: {
          name: updatedRule.name,
          feePence: updatedRule.feePence,
        },
      },
    })

    revalidatePath('/dashboard/settings')
    return { success: true, message: 'Pricing rules updated successfully' }
  } catch (error) {
    console.error('Pricing rule update error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update pricing rules'
    }
  }
}

export async function createPricingRule(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can create pricing rules')
    }

    const data = createPricingRuleSchema.parse({
      name: formData.get('name'),
      feePence: formData.get('fee'),
    })

    const pricingRule = await prisma.pricingRule.create({
      data: {
        orgId: currentUser.orgId,
        name: data.name,
        feePence: data.feePence,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'pricing_rule_created',
        entityType: 'pricing_rule',
        entityId: pricingRule.id,
        after: {
          name: pricingRule.name,
          feePence: pricingRule.feePence,
        },
      },
    })

    revalidatePath('/dashboard/settings')
    return { success: true, message: 'Pricing rule created successfully' }
  } catch (error) {
    console.error('Create pricing rule error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create pricing rule'
    }
  }
}

export async function deletePricingRule(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can delete pricing rules')
    }

    const pricingRuleId = formData.get('pricingRuleId') as string
    if (!pricingRuleId) {
      throw new Error('Pricing rule ID is required')
    }

    // Check if this is the last pricing rule
    const pricingRulesCount = await prisma.pricingRule.count({
      where: { orgId: currentUser.orgId },
    })

    if (pricingRulesCount <= 1) {
      throw new Error('Cannot delete the last pricing rule. Organizations must have at least one pricing rule.')
    }

    // Check if any sessions are using this pricing rule
    const sessionsUsingRule = await prisma.session.count({
      where: { pricingRuleId: pricingRuleId },
    })

    if (sessionsUsingRule > 0) {
      throw new Error('Cannot delete pricing rule that is being used by existing sessions')
    }

    // Get existing pricing rule for audit log
    const existingRule = await prisma.pricingRule.findFirst({
      where: {
        id: pricingRuleId,
        orgId: currentUser.orgId,
      },
    })

    if (!existingRule) {
      throw new Error('Pricing rule not found')
    }

    await prisma.pricingRule.delete({
      where: { id: pricingRuleId },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'pricing_rule_deleted',
        entityType: 'pricing_rule',
        entityId: pricingRuleId,
        before: {
          name: existingRule.name,
          feePence: existingRule.feePence,
        },
      },
    })

    revalidatePath('/dashboard/settings')
    return { success: true, message: 'Pricing rule deleted successfully' }
  } catch (error) {
    console.error('Delete pricing rule error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete pricing rule'
    }
  }
}

export async function getOrganizationSettings() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return null
    }

    const organization = await prisma.organization.findUnique({
      where: { id: currentUser.orgId },
      include: {
        pricingRules: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return organization
  } catch (error) {
    console.error('Error fetching organization settings:', error)
    return null
  }
}