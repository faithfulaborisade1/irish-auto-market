import { NextRequest } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

// Global socket instance
let io: SocketIOServer

export async function GET(request: NextRequest) {
  if (!io) {
    console.log('🔌 Initializing Socket.io server...')
    
    // Create HTTP server for Socket.io
    const httpServer = new HTTPServer()
    
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://irish-auto-market.vercel.app'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    // Socket connection handling
    io.on('connection', (socket) => {
      console.log(`👤 User connected: ${socket.id}`)

      // Join user-specific room for notifications
      socket.on('join_user_room', (userId: string) => {
        socket.join(`user_${userId}`)
        console.log(`📱 User ${userId} joined personal room`)
      })

      // Join conversation room
      socket.on('join_conversation', (conversationId: string) => {
        socket.join(`conversation_${conversationId}`)
        console.log(`💬 Socket ${socket.id} joined conversation ${conversationId}`)
      })

      // Leave conversation room
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation_${conversationId}`)
        console.log(`👋 Socket ${socket.id} left conversation ${conversationId}`)
      })

      // Handle typing indicators
      socket.on('typing_start', (data: { conversationId: string, userName: string, userId: string }) => {
        socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
          userId: data.userId,
          userName: data.userName,
          isTyping: true
        })
      })

      socket.on('typing_stop', (data: { conversationId: string, userId: string }) => {
        socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
          userId: data.userId,
          isTyping: false
        })
      })

      // Handle user going online/offline
      socket.on('user_online', (userId: string) => {
        // Notify all relevant conversations that user is online
        io.emit('user_status_change', { userId, status: 'online' })
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`👋 User disconnected: ${socket.id}`)
      })
    })

    console.log('✅ Socket.io server initialized')
  }

  return new Response('Socket.io server running', { status: 200 })
}

// Make io server available globally
export { io }