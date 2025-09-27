'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { AttendanceStatus, PaymentMethod } from '@prisma/client'

const attendanceRowSchema = z.object({
  playerId: z.string().min(1),
  feeAppliedPence: z.number().int().min(0),
  status: z.enum(['unpaid', 'paid', 'waived', 'exempt']),
  notes: z.string().optional(),
})

const upsertAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  rows: z.array(attendanceRowSchema),
})

export async function upsertManyAttendance(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const sessionId = formData.get('sessionId') as string
    const rowsJson = formData.get('rows') as string
    
    const data = upsertAttendanceSchema.parse({
      sessionId,
      rows: JSON.parse(rowsJson),
    })

    // Verify session belongs to user's org
    const session = await prisma.session.findFirst({
      where: {
        id: data.sessionId,
        orgId: currentUser.orgId,
      },
    })

    if (!session) {
      throw new Error('Session not found')
    }

    const results = []
    
    for (const row of data.rows) {
      // Verify player belongs to user's org
      const player = await prisma.player.findFirst({
        where: {
          id: row.playerId,
          orgId: currentUser.orgId,
        },
      })

      if (!player) {
        continue // Skip invalid players
      }

      const attendanceData = {
        sessionId: data.sessionId,
        playerId: row.playerId,
        checkedInAt: new Date(),
        checkedInByUser: currentUser.id,
        feeAppliedPence: row.feeAppliedPence,
        status: row.status,
        notes: row.notes || null,
      }

      const attendance = await prisma.attendance.upsert({
        where: {
          sessionId_playerId: {
            sessionId: data.sessionId,
            playerId: row.playerId,
          },
        },
        update: attendanceData,
        create: attendanceData,
      })

      results.push(attendance)

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: currentUser.orgId,
          actorUserId: currentUser.id,
          action: 'UPSERT_ATTENDANCE',
          entityType: 'Attendance',
          entityId: attendance.id,
          after: attendance,
        },
      })
    }

    revalidatePath(`/dashboard/sessions/${data.sessionId}`)
    return { success: true, data: results }
  } catch (error) {
    console.error('Upsert attendance error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update attendance' 
    }
  }
}

export async function markPaid(attendanceId: string, method: PaymentMethod = 'cash', notes?: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Get existing attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        session: {
          orgId: currentUser.orgId,
        },
      },
      include: {
        player: true,
        session: true,
      },
    })

    if (!attendance) {
      throw new Error('Attendance record not found')
    }

    const beforeState = attendance

    // Update attendance status
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: 'paid',
        notes: notes || attendance.notes,
      },
    })

    // Create payment record if fee > 0
    let payment = null
    if (attendance.feeAppliedPence > 0) {
      payment = await prisma.payment.create({
        data: {
          orgId: currentUser.orgId,
          sessionId: attendance.sessionId,
          playerId: attendance.playerId,
          amountPence: attendance.feeAppliedPence,
          method,
          occurredOn: new Date(),
          recordedBy: currentUser.id,
          notes,
        },
      })

      // Link payment to attendance
      await prisma.attendance.update({
        where: { id: attendanceId },
        data: { paymentId: payment.id },
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'MARK_PAID',
        entityType: 'Attendance',
        entityId: attendance.id,
        before: beforeState,
        after: { ...updatedAttendance, payment },
      },
    })

    revalidatePath(`/dashboard/sessions/${attendance.sessionId}`)
    return { success: true, data: { attendance: updatedAttendance, payment } }
  } catch (error) {
    console.error('Mark paid error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to mark as paid' 
    }
  }
}

export async function undoPaid(attendanceId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Get existing attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        session: {
          orgId: currentUser.orgId,
        },
      },
      include: {
        payment: true,
      },
    })

    if (!attendance) {
      throw new Error('Attendance record not found')
    }

    const beforeState = attendance

    // Remove linked payment if exists
    if (attendance.paymentId) {
      await prisma.payment.delete({
        where: { id: attendance.paymentId },
      })
    }

    // Update attendance status back to unpaid
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: 'unpaid',
        paymentId: null,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'UNDO_PAID',
        entityType: 'Attendance',
        entityId: attendance.id,
        before: beforeState,
        after: updatedAttendance,
      },
    })

    revalidatePath(`/dashboard/sessions/${attendance.sessionId}`)
    return { success: true, data: updatedAttendance }
  } catch (error) {
    console.error('Undo paid error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to undo paid status' 
    }
  }
}

export async function markWaived(attendanceId: string, reason: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Get existing attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        session: {
          orgId: currentUser.orgId,
        },
      },
    })

    if (!attendance) {
      throw new Error('Attendance record not found')
    }

    const beforeState = attendance

    // Update attendance status
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: 'waived',
        notes: reason,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'MARK_WAIVED',
        entityType: 'Attendance',
        entityId: attendance.id,
        before: beforeState,
        after: updatedAttendance,
      },
    })

    revalidatePath(`/dashboard/sessions/${attendance.sessionId}`)
    return { success: true, data: updatedAttendance }
  } catch (error) {
    console.error('Mark waived error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to mark as waived' 
    }
  }
}

// Additional functions for the AttendanceManager component
export async function markAttendance(sessionId: string, playerId: string, data: { checkedIn: boolean; notes?: string }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Get or create attendance record
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        sessionId,
        playerId,
      },
    })

    let attendance
    if (existingAttendance) {
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkedInAt: data.checkedIn ? new Date() : null,
          checkedInByUser: data.checkedIn ? currentUser.id : null,
          notes: data.notes || existingAttendance.notes,
        },
      })
    } else {
      // Get player and session for fee calculation
      const [player, session] = await Promise.all([
        prisma.player.findUnique({
          where: { id: playerId },
          include: { pricingRule: true }
        }),
        prisma.session.findUnique({ 
          where: { id: sessionId },
          include: { pricingRule: true }
        })
      ])

      if (!player || !session) {
        throw new Error('Player or session not found')
      }

      // Calculate fee based on player's pricing rule
      let feeAppliedPence = 0
      if (player.pricingRule && !player.isExempt) {
        feeAppliedPence = player.pricingRule.feePence
      }

      attendance = await prisma.attendance.create({
        data: {
          sessionId,
          playerId,
          checkedInAt: data.checkedIn ? new Date() : null,
          checkedInByUser: data.checkedIn ? currentUser.id : null,
          feeAppliedPence,
          status: player.isExempt ? 'exempt' : 'unpaid',
          notes: data.notes,
        },
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: data.checkedIn ? 'MARK_ATTENDANCE' : 'UNMARK_ATTENDANCE',
        entityType: 'Attendance',
        entityId: attendance.id,
        after: attendance,
      },
    })

    revalidatePath(`/dashboard/sessions/${sessionId}`)
    return { success: true, data: attendance }
  } catch (error) {
    console.error('Mark attendance error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to mark attendance' 
    }
  }
}

export async function markPayment(attendanceId: string, method: 'cash' | 'bank_transfer' | 'other' | 'waived', notes?: string) {
  if (method === 'waived') {
    return markWaived(attendanceId, notes || 'Fee waived')
  } else {
    return markPaid(attendanceId, method as PaymentMethod, notes)
  }
}

export async function addPlayerToSession(sessionId: string, playerId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Check if player is already in session
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        sessionId,
        playerId,
      },
    })

    if (existingAttendance) {
      throw new Error('Player is already registered for this session')
    }

    // Get player and session for fee calculation
    const [player, session] = await Promise.all([
      prisma.player.findUnique({
        where: { id: playerId },
        include: { pricingRule: true }
      }),
      prisma.session.findUnique({ 
        where: { id: sessionId },
        include: { pricingRule: true }
      })
    ])

    if (!player || !session) {
      throw new Error('Player or session not found')
    }

    // Check session capacity
    if (session.capacity) {
      const currentAttendance = await prisma.attendance.count({
        where: { sessionId },
      })
      
      if (currentAttendance >= session.capacity) {
        throw new Error('Session is at full capacity')
      }
    }

    // Calculate fee based on player's pricing rule
    let feeAppliedPence = 0
    if (player.pricingRule && !player.isExempt) {
      feeAppliedPence = player.pricingRule.feePence
    }

    const attendance = await prisma.attendance.create({
      data: {
        sessionId,
        playerId,
        feeAppliedPence,
        status: player.isExempt ? 'exempt' : 'unpaid',
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'ADD_PLAYER_TO_SESSION',
        entityType: 'Attendance',
        entityId: attendance.id,
        after: attendance,
      },
    })

    revalidatePath(`/dashboard/sessions/${sessionId}`)
    return { success: true, data: attendance }
  } catch (error) {
    console.error('Add player to session error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add player to session' 
    }
  }
}