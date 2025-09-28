import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { User, Player } from '@prisma/client'

const SESSION_COOKIE_NAME = 'hoops-session'

export interface SessionData {
  userId?: string
  playerId?: string
  orgId: string
  type: 'user' | 'player'
  role?: 'admin' | 'coach'
}

export async function createUserSession(user: User) {
  const sessionData: SessionData = {
    userId: user.id,
    orgId: user.orgId,
    type: 'user',
    role: user.role,
  }

  const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')
  
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return sessionToken
}

export async function createPlayerSession(player: Player) {
  const sessionData: SessionData = {
    playerId: player.id,
    orgId: player.orgId,
    type: 'player',
  }

  const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')
  
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 2, // 2 hours for player sessions
  })

  return sessionToken
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie) {
      return null
    }

    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    ) as SessionData

    return sessionData
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  
  if (!session || session.type !== 'user' || !session.userId) {
    return null
  }

  return await prisma.user.findUnique({
    where: { id: session.userId },
    include: { org: true },
  })
}

export async function getCurrentPlayer() {
  const session = await getSession()
  
  if (!session || session.type !== 'player' || !session.playerId) {
    return null
  }

  return await prisma.player.findUnique({
    where: { id: session.playerId },
    include: { org: true },
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function generateMagicLink(playerId: string): Promise<string> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  })

  if (!player || !player.email) {
    throw new Error('Player not found or no email address')
  }

  // Clean up old magic links for this player
  await prisma.magicLink.deleteMany({
    where: {
      playerId,
      expiresAt: { lt: new Date() },
    },
  })

  const token = uuidv4()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await prisma.magicLink.create({
    data: {
      orgId: player.orgId,
      playerId,
      email: player.email,
      token,
      expiresAt,
    },
  })

  const baseUrl = process.env.APP_URL || 'http://localhost:3000'
  return `${baseUrl}/auth/magic?token=${token}`
}

export async function consumeMagicLink(token: string): Promise<Player | null> {
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
  })

  if (!magicLink) {
    return null
  }

  if (magicLink.consumedAt) {
    throw new Error('Magic link has already been used')
  }

  if (magicLink.expiresAt < new Date()) {
    throw new Error('Magic link has expired')
  }

  // Mark as consumed
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { consumedAt: new Date() },
  })

  const player = await prisma.player.findUnique({
    where: { id: magicLink.playerId },
    include: {
      pricingRule: true
    }
  })

  return player
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}