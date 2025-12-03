'use client'

import Image from 'next/image'
import { OnlineUser } from '@/hooks/useSocket'
import type { ChatSession, User } from '@/types/chat'

interface ChatSidebarProps {
  user: User
  sessions: ChatSession[]
  activeSession: ChatSession | null
  onSelectSession: (session: ChatSession) => void
  onNewChat: () => void
  onLogout: () => void
  isConnected: boolean
  onlineUsers: OnlineUser[]
}

export default function ChatSidebar({
  user,
  sessions,
  activeSession,
  onSelectSession,
  onNewChat,
  onLogout,
  isConnected,
  onlineUsers,
}: ChatSidebarProps) {
  const isUserOnline = (userId: string) => {
    return onlineUsers.some((u) => u.userId === userId)
  }

  return (
    <div className="w-80 bg-[var(--bg-secondary)] border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {user.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-semibold">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </div>
              )}
              {isConnected && <div className="status-online"></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
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

        <button onClick={onNewChat} className="btn-primary w-full flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
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

              return (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className={`w-full p-3 rounded-lg mb-2 text-left transition-all ${
                    isActive
                      ? 'bg-[var(--bg-hover)] border border-indigo-500/30'
                      : 'hover:bg-[var(--bg-hover)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {otherParticipants[0]?.user.name?.[0] ||
                            otherParticipants[0]?.user.email[0].toUpperCase() ||
                            'C'}
                        </div>
                      )}
                      {hasOnlineUser && <div className="status-online"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {session.name ||
                          otherParticipants
                            .map((p) => p.user.name || p.user.email)
                            .join(', ') ||
                          'Chat'}
                      </p>
                      {lastMessage && (
                        <p className="text-sm text-gray-400 truncate">
                          {lastMessage.sender.name || 'User'}:{' '}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
