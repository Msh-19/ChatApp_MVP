import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Search, Bell, Settings, ChevronDown, Menu, Check, LogOut, User } from 'lucide-react'
import Image from 'next/image'
import type { User as ChatUser, Notification } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopBarProps {
  user: ChatUser
  onMenuClick?: () => void
  notifications?: Notification[]
  onMarkAllRead?: () => void
  onLogout?: () => void
  onSearch?: (query: string) => void
}

export default function TopBar({ user, onMenuClick, notifications = [], onMarkAllRead, onLogout, onSearch }: TopBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="h-16 rounded-2xl border border-[var(--border-color)] bg-white flex items-center justify-between px-6 flex-shrink-0 z-30 relative shadow-sm mx-4 mt-4 mb-2">
      {/* Left: Breadcrumb / Title */}
      <div className="flex items-center gap-3 text-[var(--text-primary)]">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-[var(--bg-hover)] rounded-lg -ml-2"
        >
            <Menu className="w-6 h-6" />
        </button>
        <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
        <span className="font-semibold text-lg">Message</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[var(--text-muted)]" />
            </div>
            <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                onChange={(e) => onSearch?.(e.target.value)}
                className="pl-9 pr-12 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] w-64 transition-colors"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded border border-gray-300 font-medium">⌘K</span>
            </div>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[var(--bg-primary)] animate-pulse"></span>
                )}
            </button>

            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-xl overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="px-4 py-2 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={onMarkAllRead} className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1">
                                <Check className="w-3 h-3" /> Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                                No new notifications
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div key={notification.id} className={`px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-color)] last:border-0 cursor-pointer ${!notification.read ? 'bg-[var(--bg-secondary)]/30' : ''}`}>
                                    <div className="flex gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-[var(--accent-primary)]' : 'bg-transparent'}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{notification.title}</p>
                                            <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{notification.content}</p>
                                            <p className="text-[10px] text-[var(--text-muted)] mt-1">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Settings */}
        <button 
          onClick={() => alert("Settings coming soon!")}
          className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-full transition-colors"
        >
            <Settings className="w-5 h-5" />
        </button>
        
        {/* Divider */}
        <div className="h-8 w-px bg-[var(--border-color)] mx-2"></div>

        {/* User Profile */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-[var(--bg-hover)] p-1.5 rounded-lg transition-colors outline-none">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                        {user.picture ? (
                            <Image 
                                src={user.picture}
                                alt={user.name || 'User'}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                {user.name?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => alert("Profile coming soon!")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
