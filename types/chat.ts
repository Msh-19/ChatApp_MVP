

export interface User {
  id: string
  email: string
  name: string | null
  picture: string | null
}

export interface ChatSession {
  id: string
  name: string | null
  participants: Array<{
    user: User
  }>
  messages: Message[]
  unreadCount?: number
  isArchived?: boolean
  isMuted?: boolean
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO'

export interface Message {
  id: string
  content: string
  type?: MessageType
  attachmentUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
  senderId: string
  chatSessionId: string
  createdAt: string | Date
  readBy: string[]
  deliveredTo?: string[]
  reactions?: Reaction[]
  sender: User
  linkPreview?: LinkPreview | null
}

export interface LinkPreview {
  url: string
  title: string
  description: string
  image: string | null
  siteName: string
  domain: string
}

export interface Notification {
  id: string
  type: 'message' | 'system'
  title: string
  content: string
  createdAt: Date
  read: boolean
  link?: string
}

export interface Reaction {
  id: string
  emoji: string
  userId: string
  user?: User
  messageId: string
}
