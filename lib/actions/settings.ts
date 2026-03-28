'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { normalizeToE164 } from '@/lib/utils'

const organizationSchema = z.object({
  name: z.string().min(1, 'Organisation name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  currency: z.string().min(1, 'Currency is required'),
})

const pricingRuleSchema = z.object({
  name: z.string().min(1, 'Pricing rule name is required'),
  feePence: z.string().transform(val => Math.round(parseFloat(val) * 100)),
})

const createPricingRuleSchema = pricingRuleSchema

const MONZO_PAY_URL_MAX_LEN = 2048

/** Hostnames we accept for org Monzo Pay links (https only). */
function isAllowedMonzoPayHostname(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'monzo.me' || h === 'www.monzo.me') return true
  if (/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.monzo\.me$/i.test(h)) return true
  if (h === 'monzo.com' || h === 'www.monzo.com') return true
  if (/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.monzo\.com$/i.test(h)) return true
  return false
}

function parseMonzoPayUrl(raw: string): { url: string | null; error?: string } {
  const trimmed = raw.trim()
  if (trimmed === '') return { url: null }
  if (trimmed.length > MONZO_PAY_URL_MAX_LEN) {
    return {
      url: null,
      error: `Monzo Pay link is too long (max ${MONZO_PAY_URL_MAX_LEN} characters).`,
    }
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return {
      url: null,
      error: 'Invalid Monzo Pay link. Use a full https URL from Monzo.',
    }
  }
  if (parsed.protocol !== 'https:') {
    return {
      url: null,
      error: 'Monzo Pay link must use https.',
    }
  }
  if (!isAllowedMonzoPayHostname(parsed.hostname)) {
    return {
      url: null,
      error:
        'Monzo Pay link must be on monzo.me or monzo.com (paste the link from Monzo).',
    }
  }
  return { url: trimmed }
}

const BANK_ACCOUNT_NAME_MAX_LEN = 120

type ParsedBankDetails =
  | {
      bankAccountName: string | null
      bankSortCode: string | null
      bankAccountNumber: string | null
    }
  | { error: string }

/**
 * All-or-nothing UK-style bank fields: empty → all null; any filled → all required and validated.
 * Sort code stored as XX-XX-XX; account number digits only.
 */
function parseUkBankDetails(
  rawName: unknown,
  rawSort: unknown,
  rawAcct: unknown
): ParsedBankDetails {
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  const sort = typeof rawSort === 'string' ? rawSort.trim() : ''
  const acct = typeof rawAcct === 'string' ? rawAcct.trim() : ''

  const anyNonEmpty = name !== '' || sort !== '' || acct !== ''
  if (!anyNonEmpty) {
    return {
      bankAccountName: null,
      bankSortCode: null,
      bankAccountNumber: null,
    }
  }

  if (name === '' || sort === '' || acct === '') {
    return {
      error:
        'Bank transfer: enter account name, sort code, and account number, or leave all three blank.',
    }
  }

  if (name.length > BANK_ACCOUNT_NAME_MAX_LEN) {
    return {
      error: `Account name is too long (max ${BANK_ACCOUNT_NAME_MAX_LEN} characters).`,
    }
  }

  const sortDigits = sort.replace(/\D/g, '')
  if (sortDigits.length !== 6) {
    return {
      error: 'Sort code must be 6 digits (e.g. 12-34-56).',
    }
  }
  const bankSortCode = `${sortDigits.slice(0, 2)}-${sortDigits.slice(2, 4)}-${sortDigits.slice(4, 6)}`

  const acctDigits = acct.replace(/\s/g, '').replace(/\D/g, '')
  if (acctDigits.length < 6 || acctDigits.length > 8) {
    return {
      error: 'Account number must be 6–8 digits.',
    }
  }

  return {
    bankAccountName: name,
    bankSortCode,
    bankAccountNumber: acctDigits,
  }
}

export async function updateOrganization(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can update organisation settings')
    }

    const data = organizationSchema.parse({
      name: formData.get('name'),
      timezone: formData.get('timezone'),
      currency: formData.get('currency'),
    })

    const rawWhatsapp = formData.get('whatsappSupportNumber')
    const whatsappTrimmed =
      typeof rawWhatsapp === 'string' ? rawWhatsapp.trim() : ''
    let whatsappSupportNumber: string | null = null
    if (whatsappTrimmed !== '') {
      const normalized = normalizeToE164(whatsappTrimmed)
      if (!normalized) {
        return {
          success: false,
          error:
            'Invalid WhatsApp number. Use international format, e.g. +447XXXXXXXXX',
        }
      }
      whatsappSupportNumber = normalized
    }

    const rawMonzo = formData.get('monzoPayUrl')
    const monzoRaw =
      typeof rawMonzo === 'string' ? rawMonzo : ''
    const monzoParsed = parseMonzoPayUrl(monzoRaw)
    if (monzoParsed.error) {
      return { success: false, error: monzoParsed.error }
    }
    const monzoPayUrl = monzoParsed.url

    const bankParsed = parseUkBankDetails(
      formData.get('bankAccountName'),
      formData.get('bankSortCode'),
      formData.get('bankAccountNumber')
    )
    if ('error' in bankParsed) {
      return { success: false, error: bankParsed.error }
    }
    const {
      bankAccountName,
      bankSortCode,
      bankAccountNumber,
    } = bankParsed

    await prisma.organization.update({
      where: { id: currentUser.orgId },
      data: {
        name: data.name,
        timezone: data.timezone,
        currency: data.currency,
        whatsappSupportNumber,
        monzoPayUrl,
        bankAccountName,
        bankSortCode,
        bankAccountNumber,
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
          whatsappSupportNumber,
          monzoPayUrl,
          bankAccountName,
          bankSortCode,
          bankAccountNumber,
        },
      },
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/player/payments')
    revalidatePath('/player/dashboard')
    return { success: true, message: 'Organisation settings updated successfully' }
  } catch (error) {
    console.error('Organization update error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update organisation settings'
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