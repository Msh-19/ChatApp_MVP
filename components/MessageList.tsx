'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Message } from '@/hooks/useSocket'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  typingUsers: Set<string>
}

export default function MessageList({
  messages,
  currentUserId,
  typingUsers,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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

  let lastDate = ''

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUserId
            const messageDate = formatDate(message.createdAt)
            const showDateDivider = messageDate !== lastDate
            lastDate = messageDate

            return (
              <div key={message.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-6">
                    <div className="px-4 py-1 bg-[var(--bg-tertiary)] rounded-full text-xs text-gray-400">
                      {messageDate}
                    </div>
                  </div>
                )}

                <div
                  className={`flex gap-3 message-enter ${
                    isOwnMessage ? 'flex-row-reverse' : ''
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="flex-shrink-0">
                      {message.sender.picture ? (
                        <Image
                          src={message.sender.picture}
                          alt={message.sender.name || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                          {message.sender.name?.[0] ||
                            message.sender.email[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-md ${
                      isOwnMessage ? 'items-end' : 'items-start'
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs text-gray-400 mb-1 px-1">
                        {message.sender.name || message.sender.email}
                      </p>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'gradient-bg text-white rounded-br-sm'
                          : 'bg-[var(--bg-tertiary)] text-gray-100 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">
                        {message.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {typingUsers.size > 0 && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-8"></div>
              <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-sm px-4 py-3">
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
  )
}
