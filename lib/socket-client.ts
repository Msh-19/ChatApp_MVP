'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let currentToken: string | null = null

export function getSocket(token: string): Socket {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

  if (!socket || currentToken !== token) {
    if (socket) {
      console.log('Token changed, disconnecting old socket')
      socket.disconnect()
      socket.removeAllListeners()
    }

    currentToken = token
    socket = io(socketUrl, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })

    console.log('Created new socket instance for URL:', socketUrl)

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
    })
  }

  return socket
}

export function disconnectSocket() {
  if (socket) {
    console.log('Disconnecting socket')
    socket.disconnect()
    socket.removeAllListeners()
    socket = null
    currentToken = null
  }
}
