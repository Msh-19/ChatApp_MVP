'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket, Message } from '@/hooks/useSocket'
import ChatSidebar from '@/components/ChatSidebar'
import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'
import NewChatModal from '@/components/NewChatModal'

interface User {
  id: string
  email: string
  name: string | null
  picture: string | null
}

interface ChatSession {
  id: string
  name: string | null
  participants: Array<{
    user: User
  }>
  messages: Message[]
}

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  
  // Use refs to track current values for socket listeners
  const activeSessionRef = useRef<ChatSession | null>(null)
  const messagesRef = useRef<Message[]>([])

  const { socket, isConnected, onlineUsers, joinSession, leaveSession, sendMessage, setTyping } = useSocket(token)
  
  // Update refs when state changes
  useEffect(() => {
    activeSessionRef.current = activeSession
  }, [activeSession])
  
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    // Check authentication
    const storedToken = localStorage.getItem('auth-token')
    const storedUser = localStorage.getItem('user')

    if (!storedToken || !storedUser) {
      router.push('/login')
      return
    }

    setToken(storedToken)
    setUser(JSON.parse(storedUser))
  }, [router])

  useEffect(() => {
    if (!token) return

    // Fetch chat sessions
    fetchSessions()
  }, [token])

  // Set up persistent socket listeners when socket connects or reconnects
  useEffect(() => {
    if (!socket) return

    // Listen for new messages - persistent listener
    const handleNewMessage = (message: Message) => {
      console.log('Received new message via socket:', message)
      const currentSession = activeSessionRef.current
      if (currentSession && message.chatSessionId === currentSession.id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            console.log('Duplicate message ignored:', message.id)
            return prev
          }
          console.log('Adding new message to state:', message.id)
          return [...prev, message]
        })
      } else {
        console.log('Message ignored - not for current session. Current:', currentSession?.id, 'Message session:', message.chatSessionId)
      }
    }

    // Listen for typing indicators - persistent listener
    const handleUserTyping = (data: { userId: string; userName: string; isTyping: boolean }) => {
      const currentSession = activeSessionRef.current
      if (currentSession) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev)
          if (data.isTyping) {
            newSet.add(data.userName)
          } else {
            newSet.delete(data.userName)
          }
          return newSet
        })
      }
    }

    // Set up listeners (persistent - will work across reconnections)
    console.log('Setting up socket listeners, connected:', socket.connected)
    socket.on('new-message', handleNewMessage)
    socket.on('user-typing', handleUserTyping)

    return () => {
      console.log('Cleaning up socket listeners')
      socket.off('new-message', handleNewMessage)
      socket.off('user-typing', handleUserTyping)
    }
  }, [socket])

  // Handle joining/leaving sessions when activeSession changes or socket connects/reconnects
  useEffect(() => {
    if (!socket || !activeSession) {
      if (activeSession && !socket) {
        console.log('Waiting for socket before joining session:', activeSession.id)
      }
      return
    }

    const joinSession = () => {
      if (socket && socket.connected && activeSession) {
        console.log('Joining session:', activeSession.id)
        socket.emit('join-session', activeSession.id)
      }
    }

    // Join immediately if already connected
    if (socket.connected) {
      joinSession()
    } else {
      console.log('Waiting for socket connection before joining session:', activeSession.id)
    }

    // Also join on connect/reconnect
    const handleConnect = () => {
      console.log('Socket connected/reconnected, joining session:', activeSession?.id)
      joinSession()
    }

    socket.on('connect', handleConnect)

    return () => {
      console.log('Leaving session:', activeSession.id)
      socket.off('connect', handleConnect)
      if (socket && socket.connected) {
        socket.emit('leave-session', activeSession.id)
      }
    }
  }, [socket, activeSession])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/messages?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSelectSession = (session: ChatSession) => {
    setActiveSession(session)
    setTypingUsers(new Set()) // Clear typing users when switching sessions
    fetchMessages(session.id)
  }

  const handleSendMessage = async (content: string) => {
    if (!activeSession || !user) return

    try {
      // Let the server persist + broadcast; we rely on the 'new-message' socket
      // handler to update local state and avoid duplicates.
      await sendMessage(activeSession.id, content)
    } catch (error) {
      console.error('Failed to send message via socket:', error)
    }
  }

  const handleNewChat = async (participantIds: string[]) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchSessions()
        setActiveSession(data.session)
        fetchMessages(data.session.id)
        setShowNewChat(false)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <ChatSidebar
        user={user}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
        onNewChat={() => setShowNewChat(true)}
        onLogout={handleLogout}
        isConnected={isConnected}
        onlineUsers={onlineUsers}
      />

      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            <div className="h-16 border-b border-gray-700 flex items-center justify-between px-6 bg-[var(--bg-secondary)]">
              <div>
                <h2 className="font-semibold text-lg">
                  {activeSession.participants
                    .filter((p) => p.user.id !== user.id)
                    .map((p) => p.user.name || p.user.email)
                    .join(', ') || 'Chat'}
                </h2>
                <p className="text-sm text-gray-400">
                  {onlineUsers.some((u) =>
                    activeSession.participants.some((p) => p.user.id === u.userId && p.user.id !== user.id)
                  )
                    ? 'Online'
                    : 'Offline'}
                </p>
              </div>
            </div>

            <MessageList messages={messages} currentUserId={user.id} typingUsers={typingUsers} />
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={(isTyping) => setTyping(activeSession.id, isTyping)}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block p-6 rounded-2xl glass mb-4">
                <svg
                  className="w-16 h-16 text-gray-500"
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
              </div>
              <h3 className="text-xl font-semibold mb-2">No chat selected</h3>
              <p className="text-gray-400 mb-6">
                Select a conversation or start a new chat
              </p>
              <button onClick={() => setShowNewChat(true)} className="btn-primary">
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewChat && (
        <NewChatModal
          currentUserId={user.id}
          onClose={() => setShowNewChat(false)}
          onCreateChat={handleNewChat}
        />
      )}
    </div>
  )
}
