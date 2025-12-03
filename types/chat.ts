import { Message } from '@/hooks/useSocket'

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
}
