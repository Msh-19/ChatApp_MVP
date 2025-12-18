'use client'

import { motion, useMotionValue, useTransform, PanInfo, useAnimation } from 'framer-motion'
import { ReactNode } from 'react'
import { Archive, MessageSquare } from 'lucide-react'

interface SwipeableChatItemProps {
  children: ReactNode
  onArchive?: () => void
  onMarkUnread?: () => void
  className?: string
  isArchived?: boolean
}

export default function SwipeableChatItem({ children, onArchive, onMarkUnread, className = '', isArchived = false }: SwipeableChatItemProps) {
  const x = useMotionValue(0)
  const controls = useAnimation()

  // Background opacity for visual feedback - balanced
  const leftOpacity = useTransform(x, [20, 60], [0, 1])
  const rightOpacity = useTransform(x, [-20, -60], [0, 1])
  
  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 60
    if (info.offset.x > threshold && onMarkUnread) {
        // Swiped Right -> Unread
        onMarkUnread()
    } else if (info.offset.x < -threshold && onArchive) {
        // Swiped Left -> Archive
        onArchive()
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left Action (Swiping Right reveals this: Unread) */}
      <div className="absolute inset-y-0 left-0 w-24 bg-emerald-500 rounded-xl flex items-center justify-center text-white my-1 ml-1">
         <motion.div style={{ opacity: leftOpacity, scale: leftOpacity }}>
            <div className="flex flex-col items-center">
                <MessageSquare className="w-5 h-5 mb-1" />
                <span className="text-xs font-semibold">Unread</span>
            </div>
         </motion.div>
      </div>

       {/* Right Action (Swiping Left reveals this: Archive) */}
      <div className="absolute inset-y-0 right-0 w-24 bg-[#1e957f] rounded-xl flex items-center justify-center text-white my-1 mr-1">
         <motion.div style={{ opacity: rightOpacity, scale: rightOpacity }}>
            <div className="flex flex-col items-center">
                 <Archive className="w-5 h-5 mb-1" />
                 <span className="text-xs font-semibold">{isArchived ? 'Unarchive' : 'Archive'}</span>
            </div>
         </motion.div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        style={{ x, position: 'relative', zIndex: 10 }}
        className="w-full bg-[var(--bg-secondary)] rounded-xl"
      >
        {children}
      </motion.div>
    </div>
  )
}
