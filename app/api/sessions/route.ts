import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await prisma.chatSession.findMany({
      where: {
        participants: {
          some: {
            userId: session.userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { participantIds, name } = await request.json()

    if (!participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json(
        { error: 'Participant IDs required' },
        { status: 400 }
      )
    }

    // Include current user in participants
    const allParticipants = [...new Set([session.userId, ...participantIds])]

    // Check if a session with these exact participants already exists
    const existingSessions = await prisma.chatSession.findMany({
      where: {
        participants: {
          every: {
            userId: {
              in: allParticipants,
            },
          },
        },
      },
      include: {
        participants: true,
      },
    })

    const exactMatch = existingSessions.find(
      (s) =>
        s.participants.length === allParticipants.length &&
        s.participants.every((p) => allParticipants.includes(p.userId))
    )

    if (exactMatch) {
      return NextResponse.json({ session: exactMatch })
    }

    // Create new session
    const newSession = await prisma.chatSession.create({
      data: {
        name,
        participants: {
          create: allParticipants.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ session: newSession })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
