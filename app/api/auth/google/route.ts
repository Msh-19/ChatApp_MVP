import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json()

    if (!credential) {
      return NextResponse.json(
        { error: 'No credential provided' },
        { status: 400 }
      )
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { sub: googleId, email, name, picture } = payload

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      )
    }

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { googleId },
      update: {
        name,
        picture,
        email,
      },
      create: {
        googleId,
        email,
        name,
        picture,
      },
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      picture: user.picture || undefined,
    })

    // Set cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      token,
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
