// src/lib/admin-notifications.ts - Fixed TypeScript Version
export interface AdminNotification {
  id: string;
  type: 'NEW_CAR' | 'NEW_USER' | 'NEW_DEALER' | 'URGENT_REPORT' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  actionUrl?: string;
  playSound?: boolean;
}

// Create notification for new car listing
export function createNewCarNotification(carData: any, userData: any): AdminNotification {
  const location = carData.location?.area 
    ? `${carData.location.area}, ${carData.location.county}`
    : carData.location?.county || 'Unknown location';

  return {
    id: `car-${carData.id}-${Date.now()}`,
    type: 'NEW_CAR',
    title: '🚗 New Car Listed!',
    message: `${carData.year} ${carData.make} ${carData.model} - €${carData.price.toLocaleString()} in ${location}`,
    data: {
      carId: carData.id,
      make: carData.make,
      model: carData.model,
      year: carData.year,
      price: carData.price,
      location: location,
      images: carData.images || [],
      seller: {
        name: userData.dealerProfile?.businessName || `${userData.firstName} ${userData.lastName}`,
        type: userData.role === 'DEALER' ? 'dealer' : 'private',
        email: userData.email
      }
    },
    priority: 'medium',
    timestamp: new Date().toISOString(),
    actionUrl: `/admin/cars/${carData.id}`,
    playSound: true
  };
}

// Create notification for new user registration
export function createNewUserNotification(userData: any): AdminNotification {
  const isDealer = userData.role === 'DEALER';
  
  return {
    id: `user-${userData.id}-${Date.now()}`,
    type: isDealer ? 'NEW_DEALER' : 'NEW_USER',
    title: isDealer ? '🏢 New Dealer Registered!' : '👤 New User Registered!',
    message: `${userData.firstName} ${userData.lastName} (${userData.email}) has joined${isDealer ? ' as a dealer' : ''}`,
    data: {
      userId: userData.id,
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      role: userData.role,
      isDealer: isDealer
    },
    priority: isDealer ? 'high' : 'low',
    timestamp: new Date().toISOString(),
    actionUrl: `/admin/users/${userData.id}`,
    playSound: isDealer // Only play sound for dealer registrations
  };
}

// Create notification for urgent reports
export function createUrgentReportNotification(reportData: any): AdminNotification {
  return {
    id: `report-${reportData.id}-${Date.now()}`,
    type: 'URGENT_REPORT',
    title: '🚨 Urgent Report Received!',
    message: `${reportData.type}: ${reportData.title}`,
    data: {
      reportId: reportData.id,
      type: reportData.type,
      severity: reportData.severity,
      title: reportData.title
    },
    priority: 'critical',
    timestamp: new Date().toISOString(),
    actionUrl: `/admin/reports/${reportData.id}`,
    playSound: true
  };
}

// Broadcast notification to all admins via SSE
export async function broadcastAdminNotification(notification: AdminNotification) {
  try {
    console.log(`📡 Broadcasting notification: ${notification.type} - ${notification.title}`);
    
    // Import the broadcast function dynamically to avoid circular imports
    const { broadcastToAdmins } = await import('@/app/api/admin/notifications/stream/route');
    
    // ✅ FIXED: Send notification in the correct format that broadcastToAdmins expects
    broadcastToAdmins({
      type: 'NEW_CAR_NOTIFICATION', // The SSE message type
      title: notification.title,
      message: notification.message,
      data: {
        // Include the full notification object in the data
        notification: notification,
        // Also include specific fields for easy access
        id: notification.id,
        notificationType: notification.type,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        playSound: notification.playSound,
        carData: notification.data
      },
      timestamp: notification.timestamp
    });
    
    // Log to database for persistence (optional)
    await logNotificationToDatabase(notification);
    
    console.log(`✅ Notification broadcast successful: ${notification.id}`);
  } catch (error: any) {
    console.error('❌ Failed to broadcast notification:', error);
  }
}

// Log notification to database for admin notification history
async function logNotificationToDatabase(notification: AdminNotification) {
  try {
    const { db } = await import('@/lib/database');
    
    // Create admin notification record (you might want to add this table to your schema)
    // For now, we'll use the existing notification system
    const admins = await db.user.findMany({
      where: {
        adminProfile: {
          isNot: null
        }
      },
      include: {
        adminProfile: true
      }
    });

    // Create notification for each admin
    const notificationPromises = admins.map((admin: any) => 
      db.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM_UPDATE', // Map to existing enum
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          metadata: {
            originalType: notification.type,
            priority: notification.priority,
            notificationId: notification.id,
            data: notification.data
          }
        }
      }).catch((error: any) => {
        console.error(`Failed to create notification for admin ${admin.id}:`, error);
      })
    );

    await Promise.allSettled(notificationPromises);
    console.log(`📝 Notification logged to database for ${admins.length} admins`);
  } catch (error: any) {
    console.error('❌ Failed to log notification to database:', error);
  }
}

// Get notification sound configuration
export function getNotificationConfig(type: AdminNotification['type']) {
  const configs = {
    NEW_CAR: {
      sound: 'custom', // Will use uploaded custom sound
      duration: 6000, // 6 seconds
      persistent: false
    },
    NEW_DEALER: {
      sound: 'custom',
      duration: 6000,
      persistent: false
    },
    URGENT_REPORT: {
      sound: 'custom',
      duration: 6000,
      persistent: true // Keep notification until dismissed
    },
    NEW_USER: {
      sound: null, // No sound for regular users
      duration: 4000,
      persistent: false
    },
    SYSTEM_ALERT: {
      sound: 'custom',
      duration: 6000,
      persistent: true
    }
  };

  return configs[type] || configs.NEW_CAR;
}