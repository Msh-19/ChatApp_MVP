'use client'

import { useEffect, useRef, useState } from 'react'
import MessageInput from './MessageInput'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIChatView() {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
      const fetchHistory = async () => {
          try {
              const res = await fetch('/api/ai/sessions')
              if (res.ok) {
                  const data = await res.json()
                  // Convert timestamp strings to Date objects
                  const loadedMessages = data.messages.map((m: any) => ({
                      ...m,
                      timestamp: new Date(m.timestamp)
                  }))
                  setMessages(loadedMessages)
              }
          } catch (error) {
              console.error('Failed to load AI history:', error)
          }
      }
      fetchHistory()
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      })
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Add the current user message to history
      conversationHistory.push({
        role: 'user',
        content: content.trim(),
      })

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          conversationHistory: conversationHistory.slice(-10), // Keep last 10 messages for context
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI response')
      }

      const data = await response.json()

      // Ensure message content is a string and handle edge cases
      const messageContent = typeof data.message === 'string' 
        ? data.message 
        : String(data.message || 'No response received')

      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: messageContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err: any) {
      console.error('AI chat error:', err)
      setError(err.message || 'Failed to get AI response')
      
      // Show error message in chat
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  let lastDate = ''

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)] overflow-hidden">
      {/* Header */}
      <div className="h-14 sm:h-16 border-b border-gray-700 flex items-center justify-between px-3 sm:px-4 md:px-6 bg-[var(--bg-secondary)] flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base sm:text-lg truncate text-[var(--text-primary)]">AI Assistant</h2>
            <p className="text-xs sm:text-sm text-gray-400">Powered by Gemini</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="text-center text-[var(--text-muted)] max-w-md">
              <div className="inline-block p-4 sm:p-6 rounded-2xl bg-white shadow-sm mb-4">
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <p className="text-base sm:text-lg font-medium mb-2 text-[var(--text-primary)]">Start chatting with AI</p> 
              <p className="text-xs sm:text-sm">
                Ask me anything! I can help with questions, explanations, creative writing, and more.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isUser = message.role === 'user'
              const messageDate = formatDate(message.timestamp)
              const showDateDivider = messageDate !== lastDate
              lastDate = messageDate

              return (
                <div key={message.id}>
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4 sm:my-6">
                      <div className="px-4 py-1.5 bg-[var(--bg-tertiary)] rounded-full text-xs font-medium text-[var(--text-secondary)] shadow-sm">
                        {messageDate}
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex gap-2 sm:gap-3 message-enter min-w-0 ${
                      isUser ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {!isUser && (
                      <div className="flex-shrink-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex flex-col min-w-0 max-w-[75%] sm:max-w-md ${
                        isUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      {!isUser && (
                        <p className="text-xs text-gray-500 mb-1 px-1 truncate w-full">AI Assistant</p>
                      )}
                      <div
                        className={`px-5 py-3 rounded-2xl shadow-sm relative group w-full min-w-0 ${
                          isUser
                            ? 'bg-emerald-50 text-gray-800 rounded-br-none border border-emerald-100'
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                        }`}
                      >
                        <div 
                          className="text-[15px] leading-relaxed break-words whitespace-pre-wrap min-w-0 w-full" 
                          style={{ 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word',
                            maxWidth: '100%',
                            hyphens: 'auto'
                          }}
                        >
                          {message.content}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-1">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex gap-2 sm:gap-3 animate-fade-in">
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                </div>
                <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-sm px-3 sm:px-4 py-2 sm:py-3">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={() => {}} // No typing indicator for AI chat
      />
    </div>
  )
}

