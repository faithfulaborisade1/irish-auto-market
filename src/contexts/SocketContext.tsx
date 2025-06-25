'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Socket } from 'socket.io-client'
import { useSocket } from '@/hooks/useSocket'

interface SocketContextType {
  socket: Socket | null
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
  const { socket, connected } = useSocket(userId)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!socket) return

    // Listen for user status changes
    socket.on('user_status_change', (data) => {
      setOnlineUsers(prev => {
        if (data.status === 'online') {
          return prev.includes(data.userId) ? prev : [...prev, data.userId]
        } else {
          return prev.filter(id => id !== data.userId)
        }
      })
    })

    // Listen for global unread count updates
    socket.on('unread_counts_update', (data) => {
      setUnreadCounts(data.counts)
    })

    return () => {
      socket.off('user_status_change')
      socket.off('unread_counts_update')
    }
  }, [socket])

  const value = {
    socket,
    connected,
    onlineUsers,
    unreadCounts
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