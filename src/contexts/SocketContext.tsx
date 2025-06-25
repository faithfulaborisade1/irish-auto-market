'use client'

import { createContext, useContext, ReactNode } from 'react'

interface SocketContextType {
  socket: null
  connected: boolean
  onlineUsers: string[]
  unreadCounts: Record<string, number>
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  onlineUsers: [],
  unreadCounts: {}
})

interface SocketProviderProps {
  children: ReactNode
  userId?: string
}

export function SocketProvider({ children, userId }: SocketProviderProps) {
  // Disabled for production - no WebSocket functionality
  const value = {
    socket: null,
    connected: false,
    onlineUsers: [],
    unreadCounts: {}
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocketContext() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}