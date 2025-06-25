import { useEffect, useRef, useState } from 'react'

interface SocketHookReturn {
  socket: null
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

  useEffect(() => {
    // WebSockets disabled for Vercel deployment
    // In production, we use standard HTTP with manual refresh
    console.log('🔌 WebSockets disabled - using standard HTTP messaging')
    setConnected(false)
  }, [userId])

  // Dummy functions that do nothing (graceful fallback)
  const joinConversation = (conversationId: string) => {
    // No-op in production
  }

  const leaveConversation = (conversationId: string) => {
    // No-op in production
  }

  const sendTyping = (conversationId: string, userName: string, userId: string) => {
    // No-op in production
  }

  const stopTyping = (conversationId: string, userId: string) => {
    // No-op in production
  }

  const broadcastMessage = (conversationId: string, message: any, senderId: string) => {
    // No-op in production
  }

  const broadcastRead = (conversationId: string, userId: string) => {
    // No-op in production
  }

  return {
    socket: null,
    connected: false, // Always false in production
    joinConversation,
    leaveConversation,
    sendTyping,
    stopTyping,
    broadcastMessage,
    broadcastRead
  }
}