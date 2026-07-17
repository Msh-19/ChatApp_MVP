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

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FA] p-6 lg:p-10 flex flex-col gap-8 h-full">
      {/* Welcome Banner */}
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-[#1A836D] to-[#2EC4B6] p-8 lg:p-12 text-white shadow-lg shadow-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 flex flex-col gap-2">
          <p className="text-emerald-100 font-semibold tracking-wider text-sm uppercase">{currentDate}</p>
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight">
            {getGreeting()}, {user?.name || 'User'}!
          </h1>
          <p className="text-emerald-50 text-base lg:text-lg max-w-md mt-1 opacity-90">
            Welcome to your communications hub. You have {totalUnread > 0 ? `${totalUnread} unread messages` : 'no unread messages'} waiting.
          </p>
        </div>
        
        {/* Time Widget */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col items-center justify-center min-w-[150px] shadow-inner">
          <span className="text-3xl lg:text-4xl font-bold tracking-tight">{currentTime}</span>
          <span className="text-xs uppercase font-medium tracking-widest text-emerald-100 mt-1">Local Time</span>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mb-20"></div>
        <div className="absolute left-1/3 top-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -mt-10"></div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Columns (Recent Chats + AI Assist) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* Quick Stats Panel */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
              <span className="text-gray-400 font-medium text-xs lg:text-sm">Total Chats</span>
              <span className="text-2xl lg:text-3xl font-bold text-gray-800">{activeSessions.length}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
              <span className="text-gray-400 font-medium text-xs lg:text-sm">Unread Msg</span>
              <span className="text-2xl lg:text-3xl font-bold text-emerald-600">{totalUnread}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow">
              <span className="text-gray-400 font-medium text-xs lg:text-sm">Contacts Online</span>
              <span className="text-2xl lg:text-3xl font-bold text-blue-600">{onlineCount}</span>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#1A836D]" />
                Recent Conversations
              </h2>
              <button 
                onClick={() => onTabChange('chats')}
                className="text-sm font-semibold text-[#1A836D] hover:underline flex items-center gap-1 group"
              >
                View All
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {recentChats.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-[#1A836D]">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">No active conversations</p>
                  <p className="text-sm text-gray-500 mt-0.5">Start chatting with friends or Gemini!</p>
                </div>
                <button
                  onClick={onCreateChat}
                  className="px-5 py-2.5 bg-[#1A836D] text-white rounded-xl text-sm font-semibold hover:bg-[#156B59] transition-colors flex items-center gap-2"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  Start a Chat
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
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
                      className="group flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-emerald-100 hover:bg-emerald-50/20 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden relative shadow-sm border border-gray-100">
                            {displayPicture ? (
                              <Image src={displayPicture} alt={displayTitle} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base">
                                {displayTitle[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>

                        {/* Name and snippet */}
                        <div className="min-w-0 flex flex-col">
                          <span className="font-bold text-gray-800 group-hover:text-[#1A836D] transition-colors truncate">
                            {displayTitle}
                          </span>
                          <span className="text-sm text-gray-500 truncate max-w-[200px] sm:max-w-md mt-0.5 font-medium">
                            {lastMsg ? lastMsg.content : 'No messages yet'}
                          </span>
                        </div>
                      </div>

                      {/* Right Details */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {lastMsg && (
                          <span className="text-[11px] text-gray-400 font-medium">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {unread > 0 && (
                          <span className="bg-emerald-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full shadow-sm">
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

        {/* Right Column (AI Assist prompt + Quick Actions) */}
        <div className="flex flex-col gap-8">
          
          {/* Ask Gemini Widget */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-800 rounded-3xl p-6 text-white border border-indigo-950 shadow-lg shadow-indigo-100 flex flex-col gap-5 relative overflow-hidden">
            <div className="relative z-10 flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-indigo-200 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-300" />
                AI Companion
              </span>
              <h2 className="text-xl font-bold tracking-tight">Ask Gemini anything</h2>
              <p className="text-indigo-100/80 text-sm mt-0.5">
                Generate ideas, translate text, draft plans, or just chat with the Google Gemini model.
              </p>
            </div>

            <form onSubmit={handleAiSubmit} className="relative z-10 mt-2 flex items-center">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask something..."
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/20 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!aiPrompt.trim()}
                className="absolute right-2 p-2 bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:text-indigo-300 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Decorator */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-purple-50/10 rounded-full blur-2xl -mt-5 -mr-5"></div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-[#1A836D]" />
              Quick Actions
            </h2>
            
            <div className="flex flex-col gap-3 mt-1">
              <button
                onClick={onCreateChat}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 font-bold text-gray-700 text-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1A836D] flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                Start a New Chat
              </button>

              <button
                onClick={() => onTabChange('ai')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 font-bold text-gray-700 text-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                AI Chat Session
              </button>

              <button
                onClick={() => onTabChange('archived')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 font-bold text-gray-700 text-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
