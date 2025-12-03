'use client'

import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket, disconnectSocket } from '@/lib/socket-client'

export interface Message {
  id: string
  content: string
  senderId: string
  chatSessionId: string
  createdAt: string
  sender: {
    id: string
    name: string | null
    email: string
    picture: string | null
  }
}

export interface OnlineUser {
  socketId: string
  userId: string
  name: string
  email: string
}

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  useEffect(() => {
    if (!token) {
      console.log('No token, skipping socket setup')
      return
    }

    console.log('Setting up socket with token')
    const socketInstance = getSocket(token)
    setSocket(socketInstance)

    // Set initial connection state
    setIsConnected(socketInstance.connected)

    const handleConnect = () => {
      console.log('✅ Socket connected successfully')
      setIsConnected(true)
    }

    const handleDisconnect = (reason: string) => {
      console.log('❌ Socket disconnected:', reason)
      setIsConnected(false)
      
      // If disconnected due to auth error, don't try to reconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('Disconnected by server, may need to reconnect')
      }
    }

    const handleConnectError = (err: Error) => {
      console.error('❌ Socket connection error:', err.message)
      console.error('Full error:', err)
      setIsConnected(false)
    }

    const handleOnlineUsers = (users: OnlineUser[]) => {
      console.log('Received online users:', users.length)
      setOnlineUsers(users)
    }

    // Set up all event listeners
    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('connect_error', handleConnectError)
    socketInstance.on('online-users', handleOnlineUsers)

    // Debug: Log all incoming events
    socketInstance.onAny((event, ...args) => {
      if (event !== 'connect' && event !== 'disconnect' && event !== 'connect_error') {
        console.log('📨 SOCKET EVENT:', event, args)
      }
    })

    // Connect the socket
    console.log('Attempting to connect socket...')
    if (!socketInstance.connected) {
      socketInstance.connect()
    } else {
      console.log('Socket already connected')
      setIsConnected(true)
    }

    return () => {
      console.log('Cleaning up socket hook')
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
      socketInstance.off('connect_error', handleConnectError)
      socketInstance.off('online-users', handleOnlineUsers)
      // Don't disconnect socket here - let it persist for reconnections
      setIsConnected(false)
    }
  }, [token])

  const joinSession = (sessionId: string) => {
    socket?.emit('join-session', sessionId)
  }

  const leaveSession = (sessionId: string) => {
    socket?.emit('leave-session', sessionId)
  }

  const sendMessage = (sessionId: string, content: string) => {
    if (!socket) {
      return Promise.reject(new Error('Socket not initialized'))
    }

    return new Promise<Message>((resolve, reject) => {
      socket.emit('send-message', { sessionId, content }, (response?: { ok?: boolean; error?: string; message?: Message }) => {
        if (!response || !response.ok || !response.message) {
          const error = response?.error || 'Failed to send message'
          reject(new Error(error))
          return
        }

        resolve(response.message)
      })
    })
  }

  const setTyping = (sessionId: string, isTyping: boolean) => {
    if (!socket) return
    socket.emit('typing', { sessionId, isTyping })
  }

  return {
    socket,
    isConnected,
    onlineUsers,
    joinSession,
    leaveSession,
    sendMessage,
    setTyping,
  }
}
