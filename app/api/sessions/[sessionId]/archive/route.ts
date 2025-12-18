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
    const { isArchived } = await request.json()

    if (typeof isArchived !== 'boolean') {
      return NextResponse.json({ error: 'Invalid isArchived value' }, { status: 400 })
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
        isArchived,
      },
    })

    return NextResponse.json({ success: true, isArchived })
  } catch (error) {
    console.error('Archive session error:', error)
    return NextResponse.json(
      { error: 'Failed to update archive status' },
      { status: 500 }
    )
  }
}
