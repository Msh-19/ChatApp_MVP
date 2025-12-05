'use client'

import Image from 'next/image'
import { OnlineUser } from '@/hooks/useSocket'
import type { ChatSession, User } from '@/types/chat'

type TabType = 'chats' | 'ai'

interface ChatSidebarProps {
  user: User
  sessions: ChatSession[]
  activeSession: ChatSession | null
  onSelectSession: (session: ChatSession) => void
  unreadCounts: Record<string, number>
  onNewChat: () => void
  onLogout: () => void
  isConnected: boolean
  onlineUsers: OnlineUser[]
  isOpen?: boolean
  onClose?: () => void
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
}

export default function ChatSidebar({
  user,
  sessions,
  activeSession,
  onSelectSession,
  unreadCounts,
  onNewChat,
  onLogout,
  isConnected,
  onlineUsers,
  isOpen = true,
  onClose,
  activeTab = 'chats',
  onTabChange,
}: ChatSidebarProps) {
  const isUserOnline = (userId: string) => {
    return onlineUsers.some((u) => u.userId === userId)
  }

  const handleSelectSession = (session: ChatSession) => {
    onSelectSession(session)
    // Close sidebar on mobile after selecting a session
    if (onClose) {
      onClose()
    }
  }

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
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-80 max-w-[85vw] bg-[var(--bg-secondary)] border-r border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {user.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </div>
              )}
              {isConnected && <div className="status-online"></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-sm sm:text-base">{user.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors lg:hidden"
                title="Close"
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={onLogout}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              title="Logout"
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        {onTabChange && (
          <div className="mb-3 sm:mb-4 flex gap-2 bg-[var(--bg-tertiary)] p-1 rounded-lg">
            <button
              onClick={() => onTabChange('chats')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'chats'
                  ? 'bg-[var(--bg-secondary)] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => onTabChange('ai')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-[var(--bg-secondary)] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <svg
                className="w-4 h-4"
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
              AI Chat
            </button>
          </div>
        )}

        {activeTab === 'chats' && (
          <button onClick={onNewChat} className="btn-primary w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-3">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>
        )}
      </div>

      {/* Connection Status */}
      <div className="px-4 py-2 bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-500'
            }`}
          ></div>
          <span className="text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Chat Sessions */}
      {activeTab === 'chats' && (
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
          <div className="p-2">
            {sessions.map((session) => {
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
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full p-2 sm:p-3 rounded-lg mb-2 text-left transition-all ${
                    isActive
                      ? 'bg-[var(--bg-hover)] border border-indigo-500/30'
                      : 'hover:bg-[var(--bg-hover)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-shrink-0">
                      {otherParticipants[0]?.user.picture ? (
                        <></>
                        // <Image
                        //   src={otherParticipants[0].user.picture}
                        //   alt={otherParticipants[0].user.name || 'User'}
                        //   width={40}
                        //   height={40}
                        //   className="rounded-full"
                        // />
                      ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                          {otherParticipants[0]?.user.name?.[0] ||
                            otherParticipants[0]?.user.email[0].toUpperCase() ||
                            'C'}
                        </div>
                      )}
                      {hasOnlineUser && <div className="status-online"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm sm:text-base">
                        {session.name ||
                          otherParticipants
                            .map((p) => p.user.name || p.user.email)
                            .join(', ') ||
                          'Chat'}
                      </p>
                      {lastMessage && (
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm text-gray-400 truncate">
                            {(lastMessage.sender.name || 'User') + ': ' + lastMessage.content}
                          </p>
                          {unread > 0 && (
                            <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </div>
                      )}
                      {!lastMessage && unread > 0 && (
                        <div className="mt-0.5 flex items-center justify-end">
                          <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
