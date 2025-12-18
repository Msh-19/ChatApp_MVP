import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params
    const { isMuted } = await request.json()

    if (typeof isMuted !== 'boolean') {
      return NextResponse.json({ error: 'Invalid isMuted value' }, { status: 400 })
    }

    // Update participant
    await prisma.chatSessionParticipant.update({
      where: {
        userId_chatSessionId: {
          userId: session.userId,
          chatSessionId: sessionId,
        },
      },
      data: {
        isMuted,
      },
    })

    return NextResponse.json({ success: true, isMuted })
  } catch (error) {
    console.error('Mute session error:', error)
    return NextResponse.json(
      { error: 'Failed to update mute status' },
      { status: 500 }
    )
  }
}
