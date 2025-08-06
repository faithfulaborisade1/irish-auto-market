// src/lib/admin-notification-broadcaster.ts
interface AdminConnection {
  controller: ReadableStreamDefaultController;
  isActive: boolean;
  keepAliveInterval?: NodeJS.Timeout;
}

// Global store for admin connections (in production, use Redis)
export const adminConnections = new Map<string, AdminConnection>()

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