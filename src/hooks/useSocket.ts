import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketHookReturn {
  socket: Socket | null
  connected: boolean
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  sendTyping: (conversationId: string, userName: string, userId: string) => void
  stopTyping: (conversationId: string, userId: string) => void
  broadcastMessage: (conversationId: string, message: any, senderId: string) => void
  broadcastRead: (conversationId: string, userId: string) => void
}

export function useSocket(userId?: string): SocketHookReturn {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Only enable WebSockets in development
    if (!userId || process.env.NODE_ENV === 'production') {
      console.log('🔌 WebSockets disabled in production - using fallback polling')
      return
    }

    console.log('🔌 Initializing socket connection for user:', userId)

    // Only try to connect if we're in development
    try {
      socketRef.current = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        timeout: 5000
      })

      const socket = socketRef.current

      socket.on('connect', () => {
        console.log('🔌 Connected to Socket.io server:', socket.id)
        setConnected(true)
        socket.emit('join_user_room', userId)
      })

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from Socket.io server')
        setConnected(false)
      })

      socket.on('connect_error', (error) => {
        console.log('🔌 Socket connection failed (using fallback):', error.message)
        setConnected(false)
      })
    } catch (error) {
      console.log('🔌 Socket.io not available, using fallback')
      setConnected(false)
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [userId])

  // Dummy functions that do nothing if not connected
  const joinConversation = (conversationId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('join_conversation', conversationId)
    }
  }

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('leave_conversation', conversationId)
    }
  }

  const sendTyping = (conversationId: string, userName: string, userId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('typing_start', { conversationId, userName, userId })
    }
  }

  const stopTyping = (conversationId: string, userId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('typing_stop', { conversationId, userId })
    }
  }

  const broadcastMessage = (conversationId: string, message: any, senderId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('broadcast_message', { conversationId, message, senderId })
    }
  }

  const broadcastRead = (conversationId: string, userId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('broadcast_read', { conversationId, userId })
    }
  }

  return {
    socket: socketRef.current,
    connected,
    joinConversation,
    leaveConversation,
    sendTyping,
    stopTyping,
    broadcastMessage,
    broadcastRead
  }
}