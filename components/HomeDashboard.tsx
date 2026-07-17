'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChatSession, User } from '@/types/chat'
import { 
  MessageSquare, 
  Sparkles, 
  User as UserIcon, 
  PlusCircle, 
  Users, 
  ArrowRight,
  Send,
  MessageCircle
} from 'lucide-react'

interface HomeDashboardProps {
  user: User | null
  sessions: ChatSession[]
  unreadCounts: Record<string, number>
  onlineUsers: Array<{ userId: string }>
  onCreateChat: () => void
  onSelectSession: (session: ChatSession) => void
  onTabChange: (tab: 'home' | 'chats' | 'ai' | 'archived') => void
  onAskGemini: (prompt: string) => void
}

export default function HomeDashboard({
  user,
  sessions,
  unreadCounts,
  onlineUsers,
  onCreateChat,
  onSelectSession,
  onTabChange,
  onAskGemini,
}: HomeDashboardProps) {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')
  const [aiPrompt, setAiPrompt] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      )
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 60000)
    return () => clearInterval(timer)
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Filter out archived sessions
  const activeSessions = sessions.filter((s) => !s.isArchived)
  
  // Get top 3 recent chat sessions
  const recentChats = activeSessions.slice(0, 3)

  // Calculate stats
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)
  const onlineCount = onlineUsers.filter((u) => u.userId !== user?.id).length

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (aiPrompt.trim()) {
      onAskGemini(aiPrompt.trim())
      setAiPrompt('')
    }
  }

  // Get first name only for a cleaner greeting
  const firstName = user?.name?.split(' ')[0] || 'User'

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-4 sm:p-6 flex flex-col gap-5 h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1A836D] to-[#2EC4B6] px-5 py-5 sm:px-6 sm:py-6 text-white shadow-sm flex items-center justify-between gap-4">
        <div className="relative z-10 min-w-0">
          <p className="text-emerald-100/80 text-[11px] font-semibold tracking-wider uppercase">{currentDate}</p>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight mt-0.5 truncate">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-emerald-50/80 text-xs mt-0.5 leading-snug">
            {totalUnread > 0 ? `You have ${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up — no unread messages'}
          </p>
        </div>
        
        {/* Time Widget */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15 flex flex-col items-center justify-center shrink-0">
          <span className="text-xl font-bold tracking-tight leading-none">{currentTime}</span>
          <span className="text-[9px] uppercase font-semibold tracking-widest text-emerald-100/70 mt-1">Local</span>
        </div>

        {/* Decorative element */}
        <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mb-16"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--bg-secondary)] p-3.5 rounded-xl border border-[var(--border-color)] flex flex-col gap-0.5">
          <span className="text-[var(--text-muted)] font-medium text-[11px]">Active Chats</span>
          <span className="text-xl font-bold text-[var(--text-primary)]">{activeSessions.length}</span>
        </div>
        <div className="bg-[var(--bg-secondary)] p-3.5 rounded-xl border border-[var(--border-color)] flex flex-col gap-0.5">
          <span className="text-[var(--text-muted)] font-medium text-[11px]">Unread</span>
          <span className="text-xl font-bold text-[var(--accent-primary)]">{totalUnread}</span>
        </div>
        <div className="bg-[var(--bg-secondary)] p-3.5 rounded-xl border border-[var(--border-color)] flex flex-col gap-0.5">
          <span className="text-[var(--text-muted)] font-medium text-[11px]">Online</span>
          <span className="text-xl font-bold text-blue-600">{onlineCount}</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 flex-1 min-h-0">
        
        {/* Left Column (Recent Chats) */}
        <div className="xl:col-span-2 flex flex-col gap-5">

          {/* Recent Conversations */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 sm:p-5 border border-[var(--border-color)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--accent-primary)]" />
                Recent Conversations
              </h2>
              <button 
                onClick={() => onTabChange('chats')}
                className="text-xs font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1 group cursor-pointer"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {recentChats.length === 0 ? (
              <div className="py-6 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-[var(--accent-primary)]">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">No conversations yet</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Start chatting with a contact</p>
                </div>
                <button
                  onClick={onCreateChat}
                  className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-xs font-semibold hover:bg-[var(--accent-secondary)] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Start a Chat
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {recentChats.map((session) => {
                  const otherParticipant = session.participants.find(p => p.user.id !== user?.id)?.user
                  const displayTitle = session.name || otherParticipant?.name || otherParticipant?.email || 'Chat'
                  const displayPicture = otherParticipant?.picture
                  
                  // Get last message snippet
                  const lastMsg = session.messages && session.messages.length > 0 
                    ? session.messages[session.messages.length - 1] 
                    : null
                  
                  const isOnline = otherParticipant ? onlineUsers.some(u => u.userId === otherParticipant.id) : false
                  const unread = unreadCounts[session.id] || 0

                  return (
                    <div 
                      key={session.id}
                      onClick={() => onSelectSession(session)}
                      className="group flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-hover)] cursor-pointer transition-all duration-150"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden relative border border-[var(--border-color)]">
                            {displayPicture ? (
                              <Image src={displayPicture} alt={displayTitle} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                                {displayTitle[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>

                        {/* Name and snippet */}
                        <div className="min-w-0 flex flex-col">
                          <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                            {displayTitle}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                            {lastMsg ? lastMsg.content : 'No messages yet'}
                          </span>
                        </div>
                      </div>

                      {/* Right Details */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
                        {lastMsg && (
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {unread > 0 && (
                          <span className="bg-[var(--accent-primary)] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (AI Assist + Quick Actions) */}
        <div className="flex flex-col gap-5">
          
          {/* Ask Gemini Widget */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-800 rounded-2xl p-4 sm:p-5 text-white border border-indigo-950/50 shadow-sm flex flex-col gap-3 relative overflow-hidden">
            <div className="relative z-10 flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-indigo-200/80 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                AI Companion
              </span>
              <h2 className="text-sm font-bold tracking-tight">Ask Gemini anything</h2>
              <p className="text-indigo-100/60 text-[11px] leading-snug">
                Generate ideas, translate text, or draft plans.
              </p>
            </div>

            <form onSubmit={handleAiSubmit} className="relative z-10 flex items-center">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask something..."
                className="w-full bg-white/10 border border-white/15 rounded-lg py-2 pl-3 pr-10 text-xs text-white placeholder-indigo-200/40 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:bg-white/15 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!aiPrompt.trim()}
                className="absolute right-1.5 p-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:text-indigo-300 text-white rounded-md transition-colors flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Decorator */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50/10 rounded-full blur-2xl -mt-4 -mr-4"></div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 sm:p-5 border border-[var(--border-color)] flex flex-col gap-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[var(--accent-primary)]" />
              Quick Actions
            </h2>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={onCreateChat}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:border-gray-200 font-semibold text-[var(--text-primary)] text-xs transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                  <PlusCircle className="w-4 h-4" />
                </div>
                Start a New Chat
              </button>

              <button
                onClick={() => onTabChange('ai')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:border-gray-200 font-semibold text-[var(--text-primary)] text-xs transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                AI Chat Session
              </button>

              <button
                onClick={() => onTabChange('archived')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:border-gray-200 font-semibold text-[var(--text-primary)] text-xs transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                View Archived Chats
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
