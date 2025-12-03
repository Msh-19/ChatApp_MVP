const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true)
            await handle(req, res, parsedUrl)
        } catch (err) {
            console.error('Error occurred handling', req.url, err)
            res.statusCode = 500
            res.end('internal server error')
        }
    })

    const io = new Server(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    })

    // Store online users
    const onlineUsers = new Map()

    // Socket.IO authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token
        if (!token) {
            console.error('Socket connection rejected: No token provided')
            return next(new Error('Authentication error: No token'))
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET)
            socket.userId = decoded.userId
            socket.userEmail = decoded.email
            socket.userName = decoded.name
            console.log(`Socket authentication successful for user: ${decoded.email}`)
            next()
        } catch (err) {
            console.error('Socket authentication failed:', err.message)
            next(new Error(`Authentication error: ${err.message}`))
        }
    })

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.userName} (${socket.userId}) - Socket ID: ${socket.id}`)

        // Add user to online users
        onlineUsers.set(socket.userId, {
            socketId: socket.id,
            userId: socket.userId,
            name: socket.userName,
            email: socket.userEmail,
        })

        // Broadcast online users
        io.emit('online-users', Array.from(onlineUsers.values()))

        // Join a chat session
        socket.on('join-session', (sessionId) => {
            socket.join(sessionId)
            console.log(`User ${socket.userName} joined session ${sessionId}`)
        })

        // Leave a chat session
        socket.on('leave-session', (sessionId) => {
            socket.leave(sessionId)
            console.log(`User ${socket.userName} left session ${sessionId}`)
        })

        // Send message
        socket.on('send-message', (data) => {
            const { sessionId, message } = data
            // Broadcast to all users in the session
            io.to(sessionId).emit('new-message', message)
        })

        // Typing indicator
        socket.on('typing', (data) => {
            const { sessionId, isTyping } = data
            socket.to(sessionId).emit('user-typing', {
                userId: socket.userId,
                userName: socket.userName,
                isTyping,
            })
        })

        // Disconnect
        socket.on('disconnect', (reason) => {
            console.log(`❌ User disconnected: ${socket.userName} (${socket.userId}) - Reason: ${reason}`)
            onlineUsers.delete(socket.userId)
            io.emit('online-users', Array.from(onlineUsers.values()))
        })
        
        // Error handling
        socket.on('error', (error) => {
            console.error(`Socket error for user ${socket.userName}:`, error)
        })
    })

    httpServer
        .once('error', (err) => {
            console.error(err)
            process.exit(1)
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`)
        })
})
