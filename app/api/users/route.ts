import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    // Get all users with their email addresses
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        email: 'asc',
      },
    })

    // Extract just the email addresses
    const emails = users.map(user => user.email)

    return NextResponse.json({
      success: true,
      count: emails.length,
      emails: emails,
      details: users, // Include full details for more context
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    )
  }
}
