'use client'

import { useEffect, useRef, useState } from 'react'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  onTyping: (isTyping: boolean) => void
}

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    if (!isTyping) {
      setIsTyping(true)
      onTyping(true)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onTyping(false)
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    onSendMessage(trimmed)
    setMessage('')
    setIsTyping(false)
    onTyping(false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="border-t border-gray-700 bg-[var(--bg-secondary)] p-3 sm:p-4 flex-shrink-0">
      <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 items-end">
        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="input-field resize-none min-h-[44px] sm:min-h-[48px] max-h-32 py-2 sm:py-3 text-sm sm:text-base"
            rows={1}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-2.5 sm:p-3 rounded-xl transition-all flex-shrink-0 ${
            message.trim()
              ? 'gradient-bg hover:shadow-lg hover:-translate-y-0.5'
              : 'bg-gray-700 cursor-not-allowed opacity-50'
          }`}
          aria-label="Send message"
        >
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-1.5 sm:mt-2 hidden sm:block">Press Enter to send, Shift + Enter for new line</p>
    </div>
  )
}


