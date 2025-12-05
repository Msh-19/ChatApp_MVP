import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

    // Send the message
    const result = await chat.sendMessage(message.trim())
    const response = await result.response
    const text = response.text()

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

