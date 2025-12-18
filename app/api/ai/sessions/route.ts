import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Retrieve the most recent session's messages
    // Or return list of sessions?
    // "AI chats are not saved. If you refresh, the conversation is gone."
    // Implies restoring the conversation state.
    // Let's fetch the most recent session and its messages.

    const aiSession = await prisma.aIChatSession.findFirst({
        where: { userId: session.userId },
        orderBy: { updatedAt: 'desc' },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!aiSession) {
        return NextResponse.json({ messages: [] })
    }

    return NextResponse.json({ 
        messages: aiSession.messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.createdAt
        }))
    })

  } catch (error) {
    console.error('Get AI messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI messages' },
      { status: 500 }
    )
  }
}
