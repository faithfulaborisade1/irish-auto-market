// src/app/api/admin/notifications/stream/route.ts - FIXED VERSION
import { NextRequest } from 'next/server'
import { AdminAuth } from '@/lib/admin-auth'
import { adminConnections, broadcastToAdmins } from '@/lib/admin-notification-broadcaster'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authToken = request.cookies.get('admin-token')?.value
  
  if (!authToken) {
    return new Response('Unauthorized', { status: 401 })
  }

  // ✅ FIXED: Use actual admin ID from token
  const adminSession = await AdminAuth.verifyToken(authToken)
  
  if (!adminSession) {
    return new Response('Invalid admin token', { status: 401 })
  }

  const adminId = adminSession.userId // ✅ Use real admin ID
  console.log(`🔗 SSE connection attempt for admin: ${adminId}`)

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // ✅ FIXED: Store connection with real admin ID
      const connectionInfo = {
        controller,
        isActive: true,
        keepAliveInterval: undefined as NodeJS.Timeout | undefined
      }
      adminConnections.set(adminId, connectionInfo)
      
      console.log(`✅ SSE connection stored for admin: ${adminId}`)
console.log(`📊 Total admin connections after storage: ${adminConnections.size}`)
console.log(`📊 All stored connection IDs: [${Array.from(adminConnections.keys()).join(', ')}]`)

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
        console.log(`📊 Remaining admin connections: ${adminConnections.size}`) // ✅ ADDED
        
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