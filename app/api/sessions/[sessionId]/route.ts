import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await params

    // Check if the user is a participant in this session
    const existingParticipant = await prisma.chatSessionParticipant.findUnique({
      where: {
        userId_chatSessionId: {
          userId: session.userId,
          chatSessionId: sessionId,
        },
      },
    })

    if (!existingParticipant) {
      return NextResponse.json({ error: 'Not found or not a participant' }, { status: 404 })
    }

    // Remove the user from the session (effectively "deleting" it for them)
    await prisma.chatSessionParticipant.delete({
      where: {
        userId_chatSessionId: {
          userId: session.userId,
          chatSessionId: sessionId,
        },
      },
    })

    // Optional: If no participants left, delete the session entirely?
    // For now, let's keep it simple. If other users are in it, they keep it.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete session:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
