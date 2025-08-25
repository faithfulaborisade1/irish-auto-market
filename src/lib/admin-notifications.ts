// src/lib/admin-notifications.ts
export interface AdminNotification {
  id: string;
  type: 'NEW_CAR' | 'NEW_USER' | 'NEW_DEALER' | 'URGENT_REPORT' | 'PAYMENT_ISSUE' | 'SYSTEM_ALERT' | 'NEW_MESSAGE' | 'TEST';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  playSound?: boolean;
  actionUrl?: string;
  metadata?: {
    userId?: string;
    carId?: string;
    dealerId?: string;
    messageId?: string;
    reportId?: string;
    [key: string]: any;
  };
   data?: any; 
}

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationSettings {
  soundEnabled: boolean;
  soundVolume: number;
  browserNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  notificationTypes: {
    [K in AdminNotification['type']]: {
      enabled: boolean;
      playSound: boolean;
      priority: NotificationPriority;
    };
  };
}

// Default notification settings
export const defaultNotificationSettings: NotificationSettings = {
  soundEnabled: true,
  soundVolume: 0.8,
  browserNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  notificationTypes: {
    NEW_CAR: {
      enabled: true,
      playSound: true,
      priority: 'medium'
    },
    NEW_USER: {
      enabled: true,
      playSound: false,
      priority: 'low'
    },
    NEW_DEALER: {
      enabled: true,
      playSound: true,
      priority: 'high'
    },
    URGENT_REPORT: {
      enabled: true,
      playSound: true,
      priority: 'critical'
    },
    PAYMENT_ISSUE: {
      enabled: true,
      playSound: true,
      priority: 'high'
    },
    SYSTEM_ALERT: {
      enabled: true,
      playSound: true,
      priority: 'critical'
    },
    NEW_MESSAGE: {
      enabled: true,
      playSound: false,
      priority: 'medium'
    },
    TEST: {
      enabled: true,
      playSound: true,
      priority: 'medium'
    }
  }
};

// Helper functions
export function createAdminNotification(
  type: AdminNotification['type'],
  title: string,
  message: string,
  options: Partial<Omit<AdminNotification, 'id' | 'type' | 'title' | 'message' | 'timestamp'>> = {}
): AdminNotification {
  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    priority: options.priority || 'medium',
    playSound: options.playSound ?? true,
    actionUrl: options.actionUrl,
    metadata: options.metadata
  };
}

export function shouldPlaySound(notification: AdminNotification, settings: NotificationSettings): boolean {
  if (!settings.soundEnabled) return false;
  if (!notification.playSound) return false;
  
  const typeSettings = settings.notificationTypes[notification.type];
  return typeSettings?.enabled && typeSettings?.playSound;
}

export function getNotificationIcon(type: AdminNotification['type']): string {
  const icons = {
    NEW_CAR: '🚗',
    NEW_USER: '👤',
    NEW_DEALER: '🏢',
    URGENT_REPORT: '🚨',
    PAYMENT_ISSUE: '💳',
    SYSTEM_ALERT: '⚠️',
    NEW_MESSAGE: '💬',
    TEST: '🧪'
  };
  
  return icons[type] || '📢';
}

export function getPriorityColor(priority: NotificationPriority): string {
  const colors = {
    low: 'text-gray-600 bg-gray-100',
    medium: 'text-blue-600 bg-blue-100',
    high: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100'
  };
  
  return colors[priority];
}
// Add these functions to the end of your admin-notifications.ts file

// Create notification for new car
export function createNewCarNotification(carData: any): AdminNotification {
  return createAdminNotification(
    'NEW_CAR',
    'New Car Listed',
    `${carData.make} ${carData.model} - €${carData.price?.toLocaleString()}`,
    {
      priority: 'medium',
      playSound: true,
      actionUrl: `/admin/cars/${carData.id}`,
      data: {
        carId: carData.id,
        make: carData.make,
        model: carData.model,
        price: carData.price,
        location: carData.location,
        seller: carData.seller
      }
    }
  );
}

// Broadcast notification to admins
export function broadcastAdminNotification(notification: AdminNotification) {
  // Import the broadcaster here to avoid circular imports
  const { broadcastToAdmins } = require('@/lib/admin-notification-broadcaster');
  
  broadcastToAdmins({
    type: 'NOTIFICATION',
    title: notification.title,
    message: notification.message,
    data: {
      notification: notification
    },
    timestamp: new Date().toISOString()
  });
}