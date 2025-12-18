import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. AI chat will not work.')
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if API key is configured
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please set GEMINI_API_KEY in environment variables.' },
        { status: 500 }
      )
    }

    const { message, conversationHistory } = await request.json()

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Format conversation history for Gemini
    // Gemini expects an array of message objects with role and parts
    const chatHistory = Array.isArray(conversationHistory) 
      ? conversationHistory.map((msg: { role: string; content: string }) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }))
      : []

    // Start a chat session with history
    const chat = model.startChat({
      history: chatHistory,
    })

    // Save user message to DB
    // First find or create a session for the user (for MVP single session per user or multiple? User asked for persistence. Let's start with a single "current" session or look for one).
    // Let's assume one main AI session for now, or create a new one if none exists.
    // Or we can treat `conversationHistory` as just context and store linear messages.
    
    // Check if we have an active AI session ID passed? No, we just have history.
    // Let's find the most recent AI session for this user or create one.
    let aiSession = await prisma.aIChatSession.findFirst({
        where: { userId: session.userId },
        orderBy: { updatedAt: 'desc' }
    })

    if (!aiSession) {
        aiSession = await prisma.aIChatSession.create({
            data: {
                userId: session.userId,
                title: 'New Chat'
            }
        })
    }

    await prisma.aIMessage.create({
        data: {
            aiChatSessionId: aiSession.id,
            role: 'user',
            content: message.trim()
        }
    })

    // Send the message
    const result = await chat.sendMessage(message.trim())
    const response = await result.response
    const text = response.text()

    // Save AI response to DB
    await prisma.aIMessage.create({
        data: {
            aiChatSessionId: aiSession.id,
            role: 'assistant',
            content: text
        }
    })

    await prisma.aIChatSession.update({
        where: { id: aiSession.id },
        data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      message: text,
      success: true,
    })
  } catch (error: any) {
    console.error('Gemini API error:', error)
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your GEMINI_API_KEY.' },
        { status: 401 }
      )
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'API quota exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

