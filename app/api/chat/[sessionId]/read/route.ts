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

    // Update all messages in this session that haven't been read by the user
    // We append the userId to the readBy array using an atomic update (push doesn't deduplicate, but logic prevents re-reading usually)
    // Actually, Prisma's `push` might add duplicates if not checked.
    // A better way is using updateMany but updateMany on scalar lists with unique constraints isn't direct.
    // However, for MVP, we can assume we only call this when valid.
    // To be safe, we can find messages first or just push.
    // Let's rely on logic: fetch messages where NOT readBy has userId, then update them.
    
    // Efficient approach:
    // UpdateMany with `push` is supported in recent Prisma versions for Postgres:
    /*
    await prisma.message.updateMany({
      where: {
        chatSessionId: sessionId,
        senderId: { not: session.userId },
        NOT: { readBy: { has: session.userId } }
      },
      data: {
        readBy: {
          push: session.userId
        }
      }
    })
    */
    // If specific generic provider issues arise, we might fall back, but this is standard.

    const result = await prisma.message.updateMany({
      where: {
        chatSessionId: sessionId,
        senderId: { not: session.userId },
        NOT: {
           readBy: { has: session.userId }
        }
      },
      data: {
        readBy: {
          push: session.userId
        }
      }
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}
