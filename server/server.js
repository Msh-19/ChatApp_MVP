const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const SOCKET_PORT = Number(process.env.SOCKET_PORT) || 3001
const SOCKET_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'

const app = express()
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' })
})

const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: SOCKET_ORIGIN,
    methods: ['GET', 'POST'],
  },
})

const onlineUsers = new Map()

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token

  if (!token) {
    return next(new Error('Authentication error: missing token'))
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
      },
    })

    if (!user) {
      return next(new Error('Authentication error: user not found'))
    }

    socket.user = user
    next()
  } catch (error) {
    console.error('Socket auth failed:', error.message)
    next(new Error('Authentication error'))
  }
})

io.on('connection', (socket) => {
  const user = socket.user
  console.log(`User connected ${user.email} (${socket.id})`)

  onlineUsers.set(user.id, {
    socketId: socket.id,
    userId: user.id,
    name: user.name,
    email: user.email,
  })
  io.emit('online-users', Array.from(onlineUsers.values()))

  socket.on('join-session', async (sessionId, ack) => {
    try {
      if (!sessionId) {
        throw new Error('Missing session id')
      }

      const participant = await prisma.chatSessionParticipant.findFirst({
        where: {
          chatSessionId: sessionId,
          userId: user.id,
        },
      })

      if (!participant) {
        throw new Error('User not part of this session')
      }

      socket.join(sessionId)
      ack?.({ ok: true })
    } catch (error) {
      console.error('Failed to join session:', error.message)
      ack?.({ error: error.message })
    }
  })

  socket.on('leave-session', (sessionId) => {
    if (!sessionId) return
    socket.leave(sessionId)
  })

  socket.on('send-message', async ({ sessionId, content }, ack) => {
    try {
      if (!sessionId || !content?.trim()) {
        throw new Error('Session and content required')
      }

      const participant = await prisma.chatSessionParticipant.findFirst({
        where: {
          chatSessionId: sessionId,
          userId: user.id,
        },
      })

      if (!participant) {
        throw new Error('User not part of this session')
      }

      const message = await prisma.message.create({
        data: {
          chatSessionId: sessionId,
          senderId: user.id,
          content: content.trim(),
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              picture: true,
            },
          },
        },
      })

      io.to(sessionId).emit('new-message', message)
      ack?.({ ok: true, message })
    } catch (error) {
      console.error('Send message failed:', error.message)
      ack?.({ error: error.message })
    }
  })

  socket.on('typing', async ({ sessionId, isTyping }) => {
    if (!sessionId) return

    const participant = await prisma.chatSessionParticipant.findFirst({
      where: {
        chatSessionId: sessionId,
        userId: user.id,
      },
      select: { id: true },
    })

    if (!participant) {
      return
    }

    socket.to(sessionId).emit('user-typing', {
      userId: user.id,
      userName: user.name || user.email,
      isTyping: Boolean(isTyping),
    })
  })

  socket.on('disconnect', () => {
    onlineUsers.delete(user.id)
    io.emit('online-users', Array.from(onlineUsers.values()))
    console.log(`User disconnected ${user.email} (${socket.id})`)
  })

  socket.on('error', (error) => {
    console.error(`Socket error for ${user.email}:`, error.message)
  })
})

httpServer.listen(SOCKET_PORT, () => {
  console.log(`Socket server running on http://localhost:${SOCKET_PORT}`)
})