// src/app/api/admin/notifications/stream/route.ts - Fixed TypeScript Version
import { NextRequest } from 'next/server'

// Define connection info type
interface AdminConnection {
  controller: ReadableStreamDefaultController;
  isActive: boolean;
  keepAliveInterval?: NodeJS.Timeout;
}

// Global store for admin connections (in production, use Redis)
const adminConnections = new Map<string, AdminConnection>()

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authToken = request.cookies.get('admin-token')?.value
  
  if (!authToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  console.log('🔗 SSE connection attempt...')

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const adminId = `admin_${Date.now()}_${Math.random()}`
      
      // Store connection info with proper typing
      const connectionInfo: AdminConnection = {
        controller,
        isActive: true,
        keepAliveInterval: undefined
      }
      adminConnections.set(adminId, connectionInfo)
      
      console.log(`✅ SSE connection authorized for admin: ${adminId}`)
      console.log(`🚀 SSE stream started for admin: ${adminId}`)

      // Send connection confirmation
      try {
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connected',
          message: 'Admin notification stream connected',
          timestamp: new Date().toISOString()
        })}\n\n`)
      } catch (error: any) {
        console.error('Failed to send connection confirmation:', error)
        connectionInfo.isActive = false
      }

      // Keep-alive ping with safer error handling
      const keepAliveInterval = setInterval(() => {
        const connection = adminConnections.get(adminId)
        
        // Check if connection is still active
        if (!connection || !connection.isActive) {
          clearInterval(keepAliveInterval)
          adminConnections.delete(adminId)
          return
        }

        try {
          controller.enqueue(`data: ${JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString()
          })}\n\n`)
        } catch (error: any) {
          console.error('Keep-alive failed:', error)
          // Mark connection as inactive
          connection.isActive = false
          clearInterval(keepAliveInterval)
          adminConnections.delete(adminId)
          
          // Try to close controller safely
          try {
            controller.close()
          } catch (closeError: any) {
            // Controller already closed, ignore
          }
        }
      }, 30000) // 30 seconds

      // Store interval reference
      connectionInfo.keepAliveInterval = keepAliveInterval

      // Cleanup on disconnect
      const cleanup = () => {
        console.log(`❌ SSE stream cancelled for admin: ${adminId}`)
        
        const connection = adminConnections.get(adminId)
        if (connection) {
          connection.isActive = false
          if (connection.keepAliveInterval) {
            clearInterval(connection.keepAliveInterval)
          }
        }
        
        adminConnections.delete(adminId)
        
        try {
          controller.close()
        } catch (error: any) {
          // Controller already closed, ignore
        }
      }

      // Handle disconnect events
      request.signal.addEventListener('abort', cleanup)
      
      // Also handle when the request ends
      const originalClose = controller.close.bind(controller)
      controller.close = () => {
        cleanup()
        return originalClose()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

// Enhanced broadcast function with error handling
export function broadcastToAdmins(notification: {
  type: string
  title: string
  message: string
  data?: any
  timestamp?: string
}) {
  const message = JSON.stringify({
    ...notification,
    timestamp: notification.timestamp || new Date().toISOString()
  })

  console.log(`📡 Broadcasting to ${adminConnections.size} admin connections`)

  // Create array of connection IDs to avoid modifying map during iteration
  const connectionIds = Array.from(adminConnections.keys())
  
  connectionIds.forEach((adminId) => {
    const connection = adminConnections.get(adminId)
    
    if (!connection || !connection.isActive) {
      // Clean up inactive connection
      adminConnections.delete(adminId)
      return
    }

    try {
      connection.controller.enqueue(`data: ${message}\n\n`)
      console.log(`✅ Notification sent to admin: ${adminId}`)
    } catch (error: any) {
      console.error(`❌ Failed to send notification to admin ${adminId}:`, error)
      
      // Mark connection as inactive and clean up
      connection.isActive = false
      if (connection.keepAliveInterval) {
        clearInterval(connection.keepAliveInterval)
      }
      adminConnections.delete(adminId)
      
      // Try to close controller
      try {
        connection.controller.close()
      } catch (closeError: any) {
        // Controller already closed, ignore
      }
    }
  })
  
  console.log(`📊 Active admin connections after broadcast: ${adminConnections.size}`)
}