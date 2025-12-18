import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, getTokenFromRequest, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    let session = await getServerSession()
    
    // Fallback: Check for Authorization header
    if (!session) {
        const token = getTokenFromRequest(request)
        if (token) {
            session = verifyToken(token)
        }
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: session.userId,
        },
        ...(query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    )
  }
}
