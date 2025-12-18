const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Use 3001 in development (to avoid conflict with Next.js on 3000)
// In production, use PORT env var (Render, etc.)
const PORT = Number(process.env.PORT) || 3001

const SOCKET_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  'http://localhost:3000'

const app = express()

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' })
})

const httpServer = http.createServer(app)

// 👇 Attach Socket.IO to the SAME server (same port)
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
  socket.join(user.id) // Join personal room
  io.emit('online-users', Array.from(onlineUsers.values()))

  socket.on('join-session', async (sessionId, ack) => {
    try {
      if (!sessionId) throw new Error('Missing session id')

      const participant = await prisma.chatSessionParticipant.findFirst({
        where: { chatSessionId: sessionId, userId: user.id },
      })

      if (!participant) throw new Error('User not part of this session')

      socket.join(sessionId)
      ack?.({ ok: true })
    } catch (error) {
      console.error('Failed to join session:', error.message)
      ack?.({ error: error.message })
    }
  })

  socket.on('leave-session', (sessionId) => {
    if (sessionId) socket.leave(sessionId)
  })

  socket.on('send-message', async ({ sessionId, content, type, attachmentUrl, fileName, fileSize }, ack) => {
    try {
      if (!sessionId) {
        throw new Error('Session required')
      }

      const msgContent = content?.trim() || ''

      if (!msgContent && !attachmentUrl) {
        throw new Error('Content or attachment required')
      }

      const participant = await prisma.chatSessionParticipant.findFirst({
        where: { chatSessionId: sessionId, userId: user.id },
      })

      if (!participant) {
        throw new Error('User not part of this session')
      }

      // Create message immediately WITHOUT preview (fast path)
      const message = await prisma.message.create({
        data: {
          chatSessionId: sessionId,
          senderId: user.id,
          content: msgContent,
          type: type || 'TEXT',
          attachmentUrl: attachmentUrl || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
          linkPreview: null, // Will be updated async
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

      console.log('✅ Message sent immediately (no preview yet)')

      // Update session updatedAt to move it to top
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      })

      // Fetch ALL participants to notify them
      const sessionParticipants = await prisma.chatSessionParticipant.findMany({
        where: { chatSessionId: sessionId },
        select: { userId: true },
      })

      // Emit message immediately to all participants
      sessionParticipants.forEach((p) => {
        io.to(p.userId).emit('new-message', message)
      })

      ack?.({ ok: true, message })

      // ========= ASYNC PREVIEW FETCHING (non-blocking) =========
      // Detect URL and fetch preview in background
      const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i
      const urlMatch = msgContent.match(urlRegex)

      if (urlMatch) {
        // Don't await this - let it run in background
        (async () => {
          try {
            let detectedUrl = urlMatch[0]
            if (detectedUrl.startsWith('www.')) {
              detectedUrl = 'https://' + detectedUrl
            }

            console.log('🔄 Fetching preview for:', detectedUrl)

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
            const previewResponse = await fetch(`${appUrl}/api/link-preview`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: detectedUrl }),
            })

            if (previewResponse.ok) {
              const linkPreviewData = await previewResponse.json()
              console.log('✅ Preview fetched:', linkPreviewData.title)

              // Update message with preview
              const updatedMessage = await prisma.message.update({
                where: { id: message.id },
                data: { linkPreview: linkPreviewData },
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

              // Broadcast preview update to all participants
              sessionParticipants.forEach((p) => {
                io.to(p.userId).emit('message-updated', updatedMessage)
              })

              console.log('📨 Preview broadcast to participants')
            } else {
              console.log('❌ Preview fetch failed:', previewResponse.status)
            }
          } catch (previewError) {
            console.error('❌ Background preview fetch error:', previewError.message)
          }
        })()
      }

    } catch (error) {
      console.error('Send message failed:', error.message)
      ack?.({ error: error.message })
    }
  })

  socket.on('typing', async ({ sessionId, isTyping }) => {
    if (!sessionId) return

    const participant = await prisma.chatSessionParticipant.findFirst({
      where: { chatSessionId: sessionId, userId: user.id },
      select: { id: true },
    })

    if (!participant) return

    socket.to(sessionId).emit('user-typing', {
      userId: user.id,
      userName: user.name || user.email,
      isTyping: Boolean(isTyping),
    })
  })

  socket.on('message-deleted', async ({ sessionId, messageId }) => {
    if (!sessionId || !messageId) return

    const sessionParticipants = await prisma.chatSessionParticipant.findMany({
      where: { chatSessionId: sessionId },
      select: { userId: true },
    })

    sessionParticipants.forEach((p) => {
      io.to(p.userId).emit('message-deleted', { messageId, sessionId })
    })
  })

  socket.on('mark-delivered', async ({ sessionId, messageIds }) => {
    // messageIds is an array of IDs to mark as delivered for this user
    if (!sessionId || !messageIds || !Array.isArray(messageIds) || messageIds.length === 0) return

    try {
      // Update DB
      // We want to add user.id to deliveredTo if not present.
      // Prisma updateMany approach for arrays:
      /*
      await prisma.message.updateMany({
        where: { id: { in: messageIds } },
        data: { deliveredTo: { push: user.id } }
      })
      */
      // However, push might duplicate. 
      // For MVP, simple push is "okay" but risky.
      // Better: find messages where user.id is NOT in deliveredTo.

      const messagesToUpdate = await prisma.message.findMany({
        where: {
          id: { in: messageIds },
          NOT: { deliveredTo: { has: user.id } }
        },
        select: { id: true }
      })

      const idsToUpdate = messagesToUpdate.map(m => m.id)

      if (idsToUpdate.length > 0) {
        await prisma.message.updateMany({
          where: { id: { in: idsToUpdate } },
          data: { deliveredTo: { push: user.id } }
        })

        // Notify participants (specifically the senders)
        // We can just emit to the session or specifically to senders.
        // Emitting to session is easiest for MVP so everyone sees the status update.
        io.to(sessionId).emit('messages-delivered', {
          sessionId,
          messageIds: idsToUpdate,
          userId: user.id
        })
      }
    } catch (error) {
      console.error('Mark delivered error:', error.message)
    }
  })

  socket.on('mark-read', async ({ sessionId, messageIds }) => {
    // Similar to delivered but for readBy.
    // NOTE: This usually runs in parallel with API call or INSTEAD of it.
    // If we use API call, API should emit.
    // But user requested "Sent, Recieved, Seen" indicators.
    // Let's allow socket to drive real-time "seen" update.
    if (!sessionId || !messageIds || !Array.isArray(messageIds) || messageIds.length === 0) return

    try {
      const messagesToUpdate = await prisma.message.findMany({
        where: {
          id: { in: messageIds },
          NOT: { readBy: { has: user.id } }
        },
        select: { id: true }
      })

      const idsToUpdate = messagesToUpdate.map(m => m.id)

      if (idsToUpdate.length > 0) {
        await prisma.message.updateMany({
          where: { id: { in: idsToUpdate } },
          data: { readBy: { push: user.id } }
        })

        io.to(sessionId).emit('messages-read', {
          sessionId,
          messageIds: idsToUpdate,
          userId: user.id
        })
      }
    } catch (error) {
      console.error('Mark read socket error:', error.message)
    }
  })

  socket.on('toggle-reaction', async ({ sessionId, messageId, emoji }) => {
    if (!sessionId || !messageId || !emoji) return

    try {
      const existingReaction = await prisma.reaction.findUnique({
        where: {
          userId_messageId: {
            userId: user.id,
            messageId: messageId
          }
        }
      })

      let action = 'added'
      let finalEmoji = emoji

      if (existingReaction) {
        if (existingReaction.emoji === emoji) {
          // Toggle off
          await prisma.reaction.delete({
            where: { id: existingReaction.id }
          })
          action = 'removed'
          finalEmoji = null
        } else {
          // Replace
          await prisma.reaction.update({
            where: { id: existingReaction.id },
            data: { emoji }
          })
          action = 'updated'
        }
      } else {
        // Create
        await prisma.reaction.create({
          data: {
            userId: user.id,
            messageId,
            emoji
          }
        })
      }

      // Broadcast to all participants
      const sessionParticipants = await prisma.chatSessionParticipant.findMany({
        where: { chatSessionId: sessionId },
        select: { userId: true },
      })

      sessionParticipants.forEach((p) => {
        io.to(p.userId).emit('reaction-updated', {
          sessionId,
          messageId,
          userId: user.id,
          emoji: finalEmoji
        })
      })

    } catch (error) {
      console.error('Toggle reaction error:', error.message)
    }
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

httpServer.listen(PORT, () => {
  console.log(`Server + Socket.IO running on port ${PORT}`)
})
