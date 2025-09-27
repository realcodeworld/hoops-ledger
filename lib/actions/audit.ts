'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const auditFilterSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional().default(50),
})

export async function getAuditLogs(
  entityType?: string,
  entityId?: string,
  action?: string,
  limit = 50
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Only admins can view audit logs
    if (currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    const filters = auditFilterSchema.parse({
      entityType,
      entityId,
      action,
      limit,
    })

    const whereClause: any = {
      orgId: currentUser.orgId,
    }

    if (filters.entityType) {
      whereClause.entityType = filters.entityType
    }

    if (filters.entityId) {
      whereClause.entityId = filters.entityId
    }

    if (filters.action) {
      whereClause.action = filters.action
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit,
    })

    // Enhance with actor names
    const enhancedLogs = await Promise.all(
      auditLogs.map(async (log) => {
        let actorName = 'System'
        if (log.actorUserId) {
          const actor = await prisma.user.findUnique({
            where: { id: log.actorUserId },
            select: { name: true },
          })
          actorName = actor?.name || 'Unknown User'
        }
        
        return {
          ...log,
          actorName,
        }
      })
    )

    return { success: true, data: enhancedLogs }
  } catch (error) {
    console.error('Get audit logs error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch audit logs' 
    }
  }
}

export async function getEntityAuditHistory(entityType: string, entityId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Only admins can view audit logs
    if (currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        orgId: currentUser.orgId,
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Enhance with actor names
    const enhancedLogs = await Promise.all(
      auditLogs.map(async (log) => {
        let actorName = 'System'
        if (log.actorUserId) {
          const actor = await prisma.user.findUnique({
            where: { id: log.actorUserId },
            select: { name: true },
          })
          actorName = actor?.name || 'Unknown User'
        }
        
        return {
          ...log,
          actorName,
        }
      })
    )

    return { success: true, data: enhancedLogs }
  } catch (error) {
    console.error('Get entity audit history error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch entity audit history' 
    }
  }
}

export async function getAuditSummary() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Only admins can view audit logs
    if (currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    // Get counts by action type in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const actionCounts = await prisma.auditLog.groupBy({
      where: {
        orgId: currentUser.orgId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      by: ['action'],
      _count: true,
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    })

    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        orgId: currentUser.orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Enhance recent activity with actor names
    const enhancedRecentActivity = await Promise.all(
      recentActivity.map(async (log) => {
        let actorName = 'System'
        if (log.actorUserId) {
          const actor = await prisma.user.findUnique({
            where: { id: log.actorUserId },
            select: { name: true },
          })
          actorName = actor?.name || 'Unknown User'
        }
        
        return {
          ...log,
          actorName,
        }
      })
    )

    return {
      success: true,
      data: {
        actionCounts: actionCounts.map(item => ({
          action: item.action,
          count: item._count,
        })),
        recentActivity: enhancedRecentActivity,
        period: { days: 30, startDate: thirtyDaysAgo },
      },
    }
  } catch (error) {
    console.error('Get audit summary error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch audit summary' 
    }
  }
}

// Helper function to create audit log (used internally by other actions)
export async function createAuditLog(
  orgId: string,
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  before?: any,
  after?: any
) {
  try {
    return await prisma.auditLog.create({
      data: {
        orgId,
        actorUserId,
        action,
        entityType,
        entityId,
        before: before || null,
        after: after || null,
      },
    })
  } catch (error) {
    console.error('Create audit log error:', error)
    // Don't throw here as we don't want audit failures to break main operations
    return null
  }
}