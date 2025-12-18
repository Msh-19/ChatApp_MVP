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
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: session.userId },
                NOT: {
                  readBy: { has: session.userId }
                }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
    })

    const sessionsWithDetails = sessions.map((s) => {
        const userParticipant = s.participants.find(p => p.userId === session.userId)
        return {
          ...s,
          unreadCount: s._count.messages,
          _count: undefined,
          isArchived: userParticipant?.isArchived || false,
          isMuted: userParticipant?.isMuted || false,
        }
    })

    return NextResponse.json({ sessions: sessionsWithDetails })
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
    // Note: we first find candidate sessions by participant IDs, then
    // fetch a single "full" session with the same shape as the GET handler.
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
      // Re-fetch the session with the same shape as the GET /api/sessions
      // response so the frontend can safely access participants.user.*
      // and messages without runtime crashes.
      const fullSession = await prisma.chatSession.findUnique({
        where: { id: exactMatch.id },
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
      })

      if (!fullSession) {
        // The session was deleted or became unavailable between the initial
        // lookup and this re-fetch.
        return NextResponse.json(
          { error: 'Session no longer exists' },
          { status: 404 }
        )
      }

      return NextResponse.json({ session: fullSession })
    }

    // Create new session with the same shape as the GET /api/sessions response
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
