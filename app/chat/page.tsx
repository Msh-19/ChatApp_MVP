'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import NavSidebar from '@/components/NavSidebar'
import ChatSidebar from '@/components/ChatSidebar'
import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'
import AIChatView from '@/components/AIChatView'
import ContactInfo from '@/components/ContactInfo'
import TopBar from '@/components/TopBar'
import { toast } from 'sonner'
import type { ChatSession, User, Notification, Message } from '@/types/chat'

type TabType = 'chats' | 'ai' | 'archived'

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState<TabType>('chats')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  
  // Close sidebar on mobile when active session changes
  useEffect(() => {
    if (activeSession && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [activeSession])

  // Reset active session when switching tabs
  useEffect(() => {
    if (activeTab === 'ai') {
      setActiveSession(null)
    }
  }, [activeTab])
  
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
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('auth-token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        setLoading(false)
        return
      }

      // Try to restore session from cookie
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.token && data.user) {
              setToken(data.token)
              setUser(data.user)
              // Restore to localStorage
              localStorage.setItem('auth-token', data.token)
              localStorage.setItem('user', JSON.stringify(data.user))
          } else {
              router.push('/login')
          }
        } else {
            router.push('/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!token) return

    // Fetch chat sessions
    fetchSessions()
  }, [token])

  // Track connection status for toasts
  const wasConnectedRef = useRef(false)

  useEffect(() => {
    if (!token) return

    if (isConnected) {
      if (wasConnectedRef.current === false) {
        toast.dismiss('connection-status')
        // Only show success toast if we were previously disconnected (avoids toast on every refresh if connection is fast)
        // However, since we show the warning immediately on load if disconnected, we should probably show success to confirm it's ready.
        // Actually, let's delay the initial warning slightly to avoid flash on fast connections.
        toast.success('Service is back online!', {
            id: 'connection-success',
            description: 'You can now send messages.',
            duration: 3000,
        })
      }
      wasConnectedRef.current = true
    } else {
      // Disconnected
      // We explicitly set the ID so it doesn't duplicate and we can dismiss it
      toast.warning('Server is waking up...', {
        id: 'connection-status',
        description: 'This may take a couple of minutes. Please wait patiently.',
        duration: Infinity, // Keep visible until connected
        action: {
            label: 'Dismiss',
            onClick: () => toast.dismiss('connection-status')
        }
      })
      wasConnectedRef.current = false
    }
  }, [isConnected, token])


  // Set up persistent socket listeners when socket connects or reconnects
  useEffect(() => {
    if (!socket) return

    // Listen for new messages - persistent listener
    const handleNewMessage = (message: Message) => {

      const currentSession = activeSessionRef.current
      const isForActive = currentSession && message.chatSessionId === currentSession.id

      // Update last message preview AND move to top
      setSessions((prev) => {
        const sessionIndex = prev.findIndex((s) => s.id === message.chatSessionId)
        if (sessionIndex === -1) return prev

        const updatedSession = {
          ...prev[sessionIndex],
          messages: [message, ...prev[sessionIndex].messages.filter((m) => m.id !== message.id)],
        }

        const newSessions = [...prev]
        newSessions.splice(sessionIndex, 1) // Remove from old position
        newSessions.unshift(updatedSession) // Add to top
        
        return newSessions
      })

      if (isForActive) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {

            return prev
          }

          return [...prev, message]
        })
      } else {

        // Increment unread count for that session
        setUnreadCounts((prev) => ({
          ...prev,
          [message.chatSessionId]: (prev[message.chatSessionId] ?? 0) + 1,
        }))
        
        // Add notification
        const newNotification: Notification = {
            id: crypto.randomUUID(),
            type: 'message',
            title: `New message from ${message.sender.name || 'User'}`,
            content: message.content,
            createdAt: new Date(),
            read: false,
        }
        setNotifications(prev => [newNotification, ...prev])
      }
      
      // Emit delivery receipt
      socket.emit('mark-delivered', {
          sessionId: message.chatSessionId,
          messageIds: [message.id]
      })

      // If we are looking at this chat, also emit read receipt
      if (isForActive) {
          socket.emit('mark-read', {
             sessionId: message.chatSessionId,
             messageIds: [message.id]
          })
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

    socket.on('new-message', handleNewMessage)
    socket.on('user-typing', handleUserTyping)
    
    socket.on('message-deleted', ({ messageId, sessionId }) => {

      
      // Update messages for active session
      if (activeSessionRef.current?.id === sessionId) {
        setMessages(prev => prev.filter(m => m.id !== messageId))
      }

      // Update session preview
      setSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
           return {
             ...session,
             messages: session.messages.filter(m => m.id !== messageId)
           }
        }
        return session
      }))
    })

    socket.on('messages-delivered', ({ sessionId, messageIds, userId }) => {
        // Update active messages
        if (activeSessionRef.current?.id === sessionId) {
            setMessages(prev => prev.map(msg => {
                if (messageIds.includes(msg.id)) {
                    const deliveredTo = msg.deliveredTo || []
                    if (!deliveredTo.includes(userId)) {
                        return { ...msg, deliveredTo: [...deliveredTo, userId] }
                    }
                }
                return msg
            }))
        }

        // Update sessions preview (for sidebar indicators)
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                // We only really care about the last message for the preview
                const updatedMessages = s.messages.map(msg => {
                    if (messageIds.includes(msg.id)) {
                        const deliveredTo = msg.deliveredTo || []
                        if (!deliveredTo.includes(userId)) {
                             return { ...msg, deliveredTo: [...deliveredTo, userId] }
                        }
                    }
                    return msg
                })
                return { ...s, messages: updatedMessages }
            }
            return s
        }))
    })

    socket.on('messages-read', ({ sessionId, messageIds, userId }) => {
        // Update active messages
        if (activeSessionRef.current?.id === sessionId) {
            setMessages(prev => prev.map(msg => {
                if (messageIds.includes(msg.id)) {
                    const readBy = msg.readBy || []
                    if (!readBy.includes(userId)) {
                        return { ...msg, readBy: [...readBy, userId] }
                    }
                }
                return msg
            }))
        }

        // Update sessions preview
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                 const updatedMessages = s.messages.map(msg => {
                    if (messageIds.includes(msg.id)) {
                        const readBy = msg.readBy || []
                        if (!readBy.includes(userId)) {
                             return { ...msg, readBy: [...readBy, userId] }
                        }
                    }
                    return msg
                })
                return { ...s, messages: updatedMessages }
            }
            return s
        }))
    })

    socket.on('reaction-updated', ({ sessionId, messageId, userId, emoji }) => {
        if (activeSessionRef.current?.id === sessionId) {
            setMessages(prev => prev.map(msg => {
                if (msg.id === messageId) {
                    const currentReactions = msg.reactions || []
                    let newReactions = [...currentReactions]
                    
                    if (emoji) {
                        // Add or Replace
                        const existingIndex = newReactions.findIndex(r => r.userId === userId)
                        if (existingIndex >= 0) {
                            newReactions[existingIndex] = { ...newReactions[existingIndex], emoji }
                        } else {
                            newReactions.push({
                                id: crypto.randomUUID(), // Temp ID until refresh
                                emoji,
                                userId,
                                messageId
                            })
                        }
                    } else {
                        // Remove
                        newReactions = newReactions.filter(r => r.userId !== userId)
                    }
                    
                    return { ...msg, reactions: newReactions }
                }
                return msg
            }))
        }
    })

    socket.on('message-updated', (updatedMessage: Message) => {

      const currentSession = activeSessionRef.current
      
      // Update active messages if this message is in the current session
      if (currentSession && updatedMessage.chatSessionId === currentSession.id) {
        setMessages((prev) => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ))
      }
      
      // Update sessions preview for sidebar
      setSessions((prev) => prev.map(s => {
        if (s.id === updatedMessage.chatSessionId) {
          return {
            ...s,
            messages: s.messages.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          }
        }
        return s
      }))
    })

    return () => {

      socket.off('new-message', handleNewMessage)
      socket.off('user-typing', handleUserTyping)
      socket.off('message-deleted')
      socket.off('message-updated')
    }
  }, [socket])

  // Handle joining/leaving sessions when activeSession changes or socket connects/reconnects
  useEffect(() => {
    if (!socket || !activeSession) {
      if (activeSession && !socket) {

      }
      return
    }

    const joinSession = () => {
      if (socket && socket.connected && activeSession) {

        socket.emit('join-session', activeSession.id)
      }
    }

    // Join immediately if already connected
    if (socket.connected) {
      joinSession()
    } else {

    }

    // Also join on connect/reconnect
    const handleConnect = () => {

      joinSession()
    }

    socket.on('connect', handleConnect)

    return () => {

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
        
        // Initialize local unread counts from server
        const initialUnread: Record<string, number> = {}
        data.sessions.forEach((s: ChatSession) => {
          if (s.unreadCount && s.unreadCount > 0) {
            initialUnread[s.id] = s.unreadCount
          }
        })
        setUnreadCounts(initialUnread)
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
        
        // Mark these messages as read via socket for real-time update to sender
        if (socket && user) {
             const unreadMessageIds = data.messages
                .filter((m: Message) => m.senderId !== user.id && !(m.readBy || []).includes(user.id))
                .map((m: Message) => m.id)
             
             if (unreadMessageIds.length > 0) {
                 socket.emit('mark-read', {
                     sessionId,
                     messageIds: unreadMessageIds
                 })
             }
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSelectSession = async (session: ChatSession) => {
    setActiveSession(session)
    setTypingUsers(new Set()) // Clear typing users when switching sessions
    setMessagesLoading(true)
    setMessages([]) // Clear previous messages immediately
    
    // Clear unread count locally
    setUnreadCounts((prev) => {
      const { [session.id]: _cleared, ...rest } = prev
      return rest
    })

    // Mark as read on server
    try {
        await fetch(`/api/chat/${session.id}/read`, { method: 'POST' })
    } catch (error) {
        console.error('Failed to mark as read:', error)
    }

    fetchMessages(session.id)
  }

  const handleArchiveSession = async (sessionId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/sessions/${sessionId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !currentStatus }),
      })
      
      // Update local state
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, isArchived: !currentStatus } : s
      ))
      
      // If we are in the wrong tab now, maybe deselect?
      // For now keep it active.

      // Notify
      const newNotification: Notification = {
          id: crypto.randomUUID(),
          type: 'system',
          title: !currentStatus ? 'Chat Archived' : 'Chat Unarchived',
          content: `Chat has been ${!currentStatus ? 'archived' : 'unarchived'}`,
          createdAt: new Date(),
          read: false,
      }
      setNotifications(prev => [newNotification, ...prev])
    } catch (error) {
      console.error('Failed to archive session:', error)
    }
  }

  const handleMuteSession = async (sessionId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/sessions/${sessionId}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMuted: !currentStatus }),
      })
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, isMuted: !currentStatus } : s
      ))
      
      const newNotification: Notification = {
          id: crypto.randomUUID(),
          type: 'system',
          title: !currentStatus ? 'Chat Muted' : 'Chat Unmuted',
          content: `Chat has been ${!currentStatus ? 'muted' : 'unmuted'}`,
          createdAt: new Date(),
          read: false,
      }
      setNotifications(prev => [newNotification, ...prev])
    } catch (error) {
      console.error('Failed to mute session:', error)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
        return
    }

    try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE',
        })

        if (response.ok) {
            setSessions(prev => prev.filter(s => s.id !== sessionId))
            
            if (activeSession?.id === sessionId) {
                setActiveSession(null)
                setMessages([])
            }

            const newNotification: Notification = {
                id: crypto.randomUUID(),
                type: 'system',
                title: 'Chat Deleted',
                content: 'Chat has been successfully deleted',
                createdAt: new Date(),
                read: false,
            }
            setNotifications(prev => [newNotification, ...prev])
        }
    } catch (error) {
        console.error('Failed to delete session:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeSession) return

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Update local state immediately
        setMessages(prev => prev.filter(m => m.id !== messageId))
        
        // Update sessions preview
        setSessions(prev => prev.map(s => {
            if (s.id === activeSession.id) {
                return {
                    ...s,
                    messages: s.messages.filter(m => m.id !== messageId)
                }
            }
            return s
        }))

        // Emit socket event
        if (socket) {
            socket.emit('message-deleted', { 
                sessionId: activeSession.id, 
                messageId 
            })
        }
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const handleReaction = (messageId: string, emoji: string) => {
    if (!activeSession || !socket) return
    socket.emit('toggle-reaction', {
        sessionId: activeSession.id,
        messageId,
        emoji
    })
  }

  const handleSendMessage = async (
    content: string, 
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO', 
    attachmentUrl?: string,
    fileName?: string,
    fileSize?: number
  ) => {
    if (!activeSession || !user) return

    try {
      // Send via socket with attachment info
      if (socket) {
        socket.emit('send-message', {
          sessionId: activeSession.id,
          content,
          type: type || 'TEXT',
          attachmentUrl: attachmentUrl || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
        })
      }
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
        setMessagesLoading(true)
        fetchMessages(data.session.id)
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

  const displayedSessions = sessions.filter(s => {
      if (activeTab === 'archived') {
          return s.isArchived
      }
      return !s.isArchived
  })

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--bg-primary)]">
      <NavSidebar 
        user={user} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar 
            user={user} 
            onMenuClick={() => setSidebarOpen(true)} 
            notifications={notifications}
            onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            onLogout={handleLogout}
            onSearch={setMessageSearchQuery}
        />

        <div className="flex flex-1 overflow-hidden relative p-4 pt-0 gap-4">
            {(activeTab === 'chats' || activeTab === 'archived') && (
              <ChatSidebar
                user={user}
                sessions={displayedSessions}
                activeSession={activeSession}
                onSelectSession={handleSelectSession}
                unreadCounts={unreadCounts}
                onCreateChat={handleNewChat}
                onlineUsers={onlineUsers}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onViewContact={(session) => {
                    handleSelectSession(session)
                    setShowContactInfo(true)
                }}
                onArchiveSession={handleArchiveSession}
                onMuteSession={handleMuteSession}
                onDeleteSession={handleDeleteSession}
                title={activeTab === 'archived' ? 'Archived Chats' : 'All Messages'}
              />
            )}

            <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
              {activeTab === 'ai' ? (
                <AIChatView />
              ) : activeSession ? (
                <>
                  {/* Chat Header */}
                  <div 
                    className="flex-shrink-0 px-8 py-5 flex items-center justify-between bg-white"
                  >
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowContactInfo(true)}>
                        <div className="relative">
                             <div className="w-12 h-12 rounded-full overflow-hidden relative shadow-sm">
                                 {activeSession.participants.find(p => p.user.id !== user.id)?.user.picture ? (
                                    <Image 
                                        src={activeSession.participants.find(p => p.user.id !== user.id)!.user.picture!}
                                        alt="User"
                                        fill
                                        className="object-cover"
                                    />
                                 ) : (
                                     <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                         {activeSession.participants.find(p => p.user.id !== user.id)?.user.name?.[0] || 'C'}
                                     </div>
                                 )}
                             </div>
                             {onlineUsers.some(u => activeSession.participants.some(p => p.user.id === u.userId && p.user.id !== user.id)) && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                             )}
                        </div>
                        <div>
                             <h2 className="font-bold text-gray-900 text-lg leading-tight">
                                {activeSession.participants
                                  .filter((p) => p.user.id !== user.id)
                                  .map((p) => p.user.name || p.user.email)
                                  .join(', ') || 'Chat'}
                             </h2>
                             <p className="text-sm text-green-500 font-medium">
                                 {onlineUsers.some(u => activeSession.participants.some(p => p.user.id === u.userId && p.user.id !== user.id)) ? 'Online' : 'Offline'}
                             </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <ActionButton icon={<SearchIcon />} onClick={() => toast.info('Search functionality coming soon!')} />
                        <ActionButton icon={<PhoneIcon />} onClick={() => toast.info('Voice calls coming soon!')} />
                        <ActionButton icon={<VideoIcon />} onClick={() => toast.info('Video calls coming soon!')} />
                        <ActionButton icon={<MoreIcon />} onClick={() => toast.info('More options coming soon!')} />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden relative rounded-[32px] bg-[#F3F4F1]"> {/* Main Content Area with Beige Background */}
                      {messagesLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (

                        <MessageList 
                            messages={messages.filter(m => !messageSearchQuery || m.content.toLowerCase().includes(messageSearchQuery.toLowerCase()))} 
                            currentUserId={user.id}  
                            typingUsers={typingUsers}
                            onDeleteMessage={handleDeleteMessage}
                            onReaction={handleReaction}
                        />
                      )}
                  </div>
                  
                  <div className="p-4 bg-[var(--bg-primary)]">
                      <MessageInput
                        onSendMessage={handleSendMessage}
                        onTyping={(isTyping) => setTyping(activeSession.id, isTyping)}
                        disabled={!isConnected}
                      />
                  </div>
                </>
              ) : (
                 <div className="flex-1 flex items-center justify-center p-4 bg-[var(--bg-primary)]">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome Back!</h3>
                        <p className="text-[var(--text-muted)]">Select a chat to start messaging.</p>
                    </div>
                 </div>
              )}
            </div>
        </div>
      </div>
      
      {activeSession && user && (
        <ContactInfo 
            isOpen={showContactInfo} 
            onClose={() => setShowContactInfo(false)}
            user={activeSession.participants.find(p => p.user.id !== user.id)?.user || null}
            messages={messages}
        />
      )}
    </div>
  );
}
// Helper Components
// Helper Components
function ActionButton({ icon, onClick }: { icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors bg-white shadow-sm"
    >
      {icon}
    </button>
  )
}

const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
)

const PhoneIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
)

const VideoIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H2a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
)

const MoreIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
)
