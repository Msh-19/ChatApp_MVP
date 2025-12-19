'use client'

import Image from 'next/image'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavSidebarProps {
  user: {
    picture?: string | null
    name?: string | null
  } | null
  activeTab: 'chats' | 'ai' | 'archived'
  onTabChange: (tab: 'chats' | 'ai' | 'archived') => void
  onLogout?: () => void
}

export default function NavSidebar({ user, activeTab, onTabChange, onLogout }: NavSidebarProps) {
  return (
    <div className="w-20 md:w-24 bg-transparent flex flex-col items-center py-6 h-full flex-shrink-0">
      {/* Logo */}
      <div className="mb-10">
        <div className="bg-[#1E9A80] rounded-[915.75px] p-[11px] flex items-center justify-center shadow-lg shadow-emerald-200">
           <Image src="/logo.svg" alt="App Logo" width={24} height={24} className="w-auto h-auto" />
        </div>
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col gap-6 w-full px-4">
        <NavItem active={false} icon={<HomeIcon />} onClick={() => toast.info('Home view coming soon!')} />
        
        <NavItem 
            active={activeTab === 'chats'} 
            icon={<ChatIcon />} 
            onClick={() => onTabChange('chats')}
        />
        
        <NavItem 
            active={activeTab === 'ai'} 
            icon={<SparklesIcon />} 
            onClick={() => onTabChange('ai')}
        />

        <NavItem 
            active={activeTab === 'archived'} 
            icon={<FolderIcon />} 
            onClick={() => onTabChange('archived')} 
        />
        <NavItem active={false} icon={<GalleryIcon />} onClick={() => toast.info('Gallery view coming soon!')} />
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-6 w-full px-4 items-center">

        {user ? (
            <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md hover:ring-2 hover:ring-[var(--accent-primary)] transition-all cursor-pointer">
                         {user.picture ? (
                            <Image src={user.picture} alt="User" fill className="object-cover" />
                         ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                {user.name?.[0]}
                            </div>
                         )}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-48 mb-2">
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer" onClick={onLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        )}
      </div>
    </div>
  )
}

function NavItem({ active, icon, onClick }: { active: boolean; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 ${
        active
          ? 'bg-emerald-50 text-[var(--accent-primary)] border border-emerald-100 shadow-sm'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
      }`}
    >
      {icon}
    </button>
  )
}

// Icons
const HomeIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
)

const ChatIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
)

const SparklesIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
)

const CompassIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
)

const FolderIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
)

const GalleryIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

const StarIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
)
