import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { MessageSquare, Archive, VolumeX, User, Share, XCircle, Trash2, Filter, Check, CheckCheck } from 'lucide-react'
import { OnlineUser } from '@/hooks/useSocket'
import type { ChatSession, User as ChatUser } from '@/types/chat'
import NewChatDropdown from './NewChatDropdown'
import SwipeableChatItem from './SwipeableChatItem'
import { formatSidebarDate } from '@/lib/dateUtils'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'

interface ChatSidebarProps {
  user: ChatUser
  sessions: ChatSession[]
  activeSession: ChatSession | null
  onSelectSession: (session: ChatSession) => void
  unreadCounts: Record<string, number>
  onCreateChat: (participantIds: string[]) => void
  onlineUsers: OnlineUser[]
  isOpen?: boolean
  onClose?: () => void
  onViewContact?: (session: ChatSession) => void
  onArchiveSession?: (sessionId: string, currentStatus: boolean) => void
  onMuteSession?: (sessionId: string, currentStatus: boolean) => void
  onDeleteSession?: (sessionId: string) => Promise<void>
  title?: string
}

export default function ChatSidebar({
  user,
  sessions,
  activeSession,
  onSelectSession,
  unreadCounts,
  onCreateChat,
  onlineUsers,
  isOpen = true,
  onClose,
  onViewContact,
  onArchiveSession,
  onMuteSession,
  onDeleteSession,
  title = 'All Messages'
}: ChatSidebarProps) {
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ChatUser[]>([])

  useEffect(() => {
    const timer = setTimeout(async () => {
        if (!searchQuery.trim()) {
            setSearchResults([])
            return
        }
        
        try {
            const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()
            setSearchResults(data.users || [])
        } catch(e) { console.error(e) }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const isUserOnline = (userId: string) => {
    return onlineUsers.some((u) => u.userId === userId)
  }

  const handleSelectSession = (session: ChatSession) => {
    onSelectSession(session)
    if (onClose) {
      onClose()
    }
  }

  const handleUserClick = (targetUser: ChatUser) => {
      // Create chat with this user
      onCreateChat([targetUser.id])
      setSearchQuery('')
      setSearchResults([])
  }

  const filteredSessions = sessions.filter((session) => {
    if (!showOnlineOnly) return true
    const otherParticipants = session.participants.filter(
      (p) => p.user.id !== user.id
    )
    return otherParticipants.some((p) => isUserOnline(p.user.id))
  })

  return (
    <>
      {/* Mobile overlay */}
      {onClose && (
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-20 w-80 lg:w-[350px] bg-[var(--bg-secondary)] border-r lg:border lg:rounded-2xl lg:shadow-sm border-[var(--border-color)] flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
                <NewChatDropdown currentUserId={user.id} onCreateChat={onCreateChat} />
            </div>

            <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for users..." 
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-3 pl-10 pr-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                    />
                    <svg className="absolute left-3 top-3.5 w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <button 
                  onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                  className={`p-3 border rounded-xl transition-colors ${
                      showOnlineOnly 
                        ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white' 
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
                  }`}
                  title={showOnlineOnly ? "Show all" : "Show online only"}
                >
                    <Filter className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {searchQuery ? (
                // Search Results
                searchResults.length === 0 ? (
                    <div className="text-center text-[var(--text-muted)] py-8">
                        No users found
                    </div>
                ) : (
                    searchResults.map((searchUser) => (
                        <button 
                            key={searchUser.id} 
                            onClick={() => handleUserClick(searchUser)}
                            className="w-full p-4 rounded-xl flex items-center gap-4 hover:bg-[var(--bg-hover)] transition-colors text-left"
                        >
                            <div className="relative flex-shrink-0">
                                {searchUser.picture ? (
                                    <Image
                                        src={searchUser.picture}
                                        alt={searchUser.name || 'User'}
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                        {searchUser.name?.[0] || 'U'}
                                    </div>
                                )}
                                {isUserOnline(searchUser.id) && (
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--bg-secondary)] rounded-full"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[var(--text-primary)] truncate">{searchUser.name}</h3>
                                <p className="text-sm text-[var(--text-muted)] truncate">{searchUser.email}</p>
                            </div>
                        </button>
                    ))
                )
            ) : (
                // Session List
                filteredSessions.length === 0 ? (
                     <div className="text-center text-[var(--text-muted)] py-8 space-y-2">
                        <p>No chats yet.</p>
                        <p className="text-sm">Search for users above to start chatting!</p>
                    </div>
                ) : (
                    filteredSessions.map((session) => {
                    const otherParticipants = session.participants.filter(
                        (p) => p.user.id !== user.id
                    )
                    const lastMessage = session.messages[0]
                    const isActive = activeSession?.id === session.id
                    const hasOnlineUser = otherParticipants.some((p) =>
                        isUserOnline(p.user.id)
                    )
                    const unread = unreadCounts[session.id] ?? 0

                    return (
                        <SwipeableChatItem 
                            key={session.id}
                            onArchive={() => onArchiveSession?.(session.id, session.isArchived || false)}
                            onMarkUnread={() => {}}
                            isArchived={session.isArchived}
                        >
                            <ContextMenu>
                                <ContextMenuTrigger asChild>
                                    <button
                                    onClick={() => handleSelectSession(session)}
                                    className={`w-full p-4 rounded-xl text-left transition-all group relative ${
                                        isActive
                                        ? 'bg-[#F3F3EE] shadow-sm'
                                        : 'hover:bg-[var(--bg-hover)]'
                                    }`}
                                    onContextMenu={(e) => {
                                        // e.preventDefault() // managed by ContextMenuTrigger
                                    }}
                                    >
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex-shrink-0">
                                        {otherParticipants[0]?.user.picture ? (
                                            <Image
                                            src={otherParticipants[0].user.picture}
                                            alt={otherParticipants[0].user.name || 'User'}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                            {otherParticipants[0]?.user.name?.[0] || 'C'}
                                            </div>
                                        )}
                                        {hasOnlineUser && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--bg-secondary)] rounded-full"></div>
                                        )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`font-bold text-sm truncate pr-2 ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'} flex items-center gap-2`}>
                                                {session.name ||
                                                otherParticipants
                                                    .map((p) => p.user.name || p.user.email)
                                                    .join(', ') ||
                                                'Chat'}
                                                {session.isMuted && <VolumeX className="w-3 h-3 text-[var(--text-muted)]" />}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {lastMessage && (
                                                    <span className="text-xs text-[var(--text-muted)]">
                                                        {formatSidebarDate(lastMessage.createdAt.toString())}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-[var(--text-muted)] truncate max-w-[80%]">
                                                {lastMessage ? (lastMessage.sender.name || 'User') + ': ' + lastMessage.content : 'No messages yet'}
                                            </p>
                                            {unread > 0 && (
                                                <span className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-[var(--accent-primary)] text-white text-[10px] h-5 w-5 font-bold">
                                                {unread > 9 ? '9+' : unread}
                                                </span>
                                            )}
                                            {lastMessage && lastMessage.senderId === user.id && unread === 0 && (
                                                <span className="flex-shrink-0 ml-1">
                                                    {(lastMessage.readBy && lastMessage.readBy.length > 0 && lastMessage.readBy.some(id => id !== user.id)) ? (
                                                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                                    ) : (lastMessage.deliveredTo && lastMessage.deliveredTo.length > 0 && lastMessage.deliveredTo.some(id => id !== user.id)) ? (
                                                        <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                                                    ) : (
                                                        <Check className="w-3.5 h-3.5 text-gray-400" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        </div>
                                    </div>
                                    </button>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-56 shadow-xl border-gray-100">
                                    <ContextMenuItem className="cursor-pointer">
                                        <MessageSquare className="mr-2 h-4 w-4 text-[var(--text-muted)]" />
                                        <span>Mark as unread</span>
                                    </ContextMenuItem>
                                    <ContextMenuItem
                                        className="cursor-pointer"
                                        onClick={() => onArchiveSession?.(session.id, session.isArchived || false)}
                                    >
                                        <Archive className="mr-2 h-4 w-4 text-[var(--text-muted)]" />
                                        <span>{session.isArchived ? 'Unarchive' : 'Archive'}</span>
                                    </ContextMenuItem>
                                    <ContextMenuItem
                                        className="cursor-pointer"
                                        onClick={() => onMuteSession?.(session.id, session.isMuted || false)}
                                    >
                                        <VolumeX className="mr-2 h-4 w-4 text-[var(--text-muted)]" />
                                        <span>{session.isMuted ? 'Unmute' : 'Mute'}</span>
                                    </ContextMenuItem>
                                    <ContextMenuItem className="cursor-pointer" onClick={() => onViewContact?.(session)}>
                                        <User className="mr-2 h-4 w-4 text-[var(--text-muted)]" />
                                        <span>Contact info</span>
                                    </ContextMenuItem>
                                    <ContextMenuItem className="cursor-pointer">
                                        <Share className="mr-2 h-4 w-4 text-[var(--text-muted)]" />
                                        <span>Export chat</span>
                                    </ContextMenuItem>
                                    <ContextMenuItem className="cursor-pointer">
                                        <XCircle className="mr-2 h-4 w-4 text-[var(--text-muted)]" />
                                        <span>Clear chat</span>
                                    </ContextMenuItem>
                                    <ContextMenuSeparator />
                                    <ContextMenuItem 
                                        className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
                                        onClick={() => onDeleteSession?.(session.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete chat</span>
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        </SwipeableChatItem>
                    )
                    })
                )
            )}
        </div>
      </div>
    </>
  )
}
