// src/hooks/useAdminNotifications.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import notificationSoundManager from '@/lib/notification-sound';
import type { AdminNotification } from '@/lib/admin-notifications';

interface NotificationState {
  connected: boolean;
  notifications: AdminNotification[];
  connectionError: string | null;
  reconnecting: boolean;
}

export function useAdminNotifications() {
  const [state, setState] = useState<NotificationState>({
    connected: false,
    notifications: [],
    connectionError: null,
    reconnecting: false
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Show notification toast
  const showNotificationToast = useCallback((notification: AdminNotification) => {
    // Create and show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/iam-logo.svg',
        badge: '/iam-logo.svg',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical'
      });

      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto close after duration
      const duration = notification.priority === 'critical' ? 0 : 5000;
      if (duration > 0) {
        setTimeout(() => browserNotification.close(), duration);
      }
    }

    // Add to notifications list
    setState(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications.slice(0, 9)] // Keep last 10
    }));

    console.log(`📢 Notification received: ${notification.title}`);
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(async (notification: AdminNotification) => {
    if (notification.playSound) {
      try {
        await notificationSoundManager.playNotificationSound();
      } catch (error) {
        console.error('Failed to play notification sound:', error);
      }
    }
  }, []);

  // Handle incoming SSE messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'CONNECTED':
          console.log('✅ Admin notifications connected:', data.data.message);
          setState(prev => ({ 
            ...prev, 
            connected: true, 
            connectionError: null,
            reconnecting: false 
          }));
          reconnectAttempts.current = 0;
          break;

        case 'NOTIFICATION':
          const notification = data.notification as AdminNotification;
          showNotificationToast(notification);
          playNotificationSound(notification);
          break;

        case 'PING':
          // Keep-alive ping, no action needed
          break;

        default:
          console.log('📨 Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  }, [showNotificationToast, playNotificationSound]);

  // Handle connection errors
  const handleError = useCallback((error: Event) => {
    console.error('❌ SSE connection error:', error);
    setState(prev => ({ 
      ...prev, 
      connected: false, 
      connectionError: 'Connection lost',
      reconnecting: true 
    }));
  }, []);

  // Handle connection close
  const handleClose = useCallback(() => {
    console.log('🔌 SSE connection closed');
    setState(prev => ({ 
      ...prev, 
      connected: false,
      reconnecting: true
    }));
    
    // Attempt to reconnect
    if (mountedRef.current && reconnectAttempts.current < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000); // Exponential backoff, max 10s
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current++;
        connectToNotifications();
      }, delay);
    } else {
      setState(prev => ({ 
        ...prev, 
        connectionError: 'Failed to connect after multiple attempts',
        reconnecting: false
      }));
    }
  }, []);

  // Connect to SSE stream
  const connectToNotifications = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.log('🔗 Connecting to admin notifications...');
      
      const eventSource = new EventSource('/api/admin/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = handleMessage;
      eventSource.onerror = handleError;
      eventSource.onopen = () => {
        console.log('🚀 SSE connection opened');
      };

      // Handle close event
      eventSource.addEventListener('close', handleClose);

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setState(prev => ({ 
        ...prev, 
        connectionError: 'Failed to establish connection',
        reconnecting: false
      }));
    }
  }, [handleMessage, handleError, handleClose]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log(`🔔 Browser notification permission: ${permission}`);
      return permission === 'granted';
    }
    return false;
  }, []);

  // Request audio permission (call after user interaction)
  const requestAudioPermission = useCallback(async () => {
    try {
      const granted = await notificationSoundManager.requestAudioPermission();
      if (granted) {
        console.log('🔊 Audio permission granted');
      }
      return granted;
    } catch (error) {
      console.error('Failed to request audio permission:', error);
      return false;
    }
  }, []);

  // Test notification (for settings)
  const testNotification = useCallback(async () => {
    const testNotif: AdminNotification = {
      id: `test-${Date.now()}`,
      type: 'NEW_CAR',
      title: '🧪 Test Notification',
      message: 'This is a test notification with sound',
      priority: 'medium',
      timestamp: new Date().toISOString(),
      playSound: true
    };

    showNotificationToast(testNotif);
    await playNotificationSound(testNotif);
  }, [showNotificationToast, playNotificationSound]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  // Remove specific notification
  const removeNotification = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== notificationId)
    }));
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    setState(prev => ({ ...prev, connectionError: null, reconnecting: true }));
    connectToNotifications();
  }, [connectToNotifications]);

  // Initialize connection
  useEffect(() => {
    mountedRef.current = true;
    
    // Request permissions on mount
    requestNotificationPermission();
    
    // Connect to notifications
    connectToNotifications();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectToNotifications, requestNotificationPermission]);

  return {
    // State
    connected: state.connected,
    notifications: state.notifications,
    connectionError: state.connectionError,
    reconnecting: state.reconnecting,
    
    // Actions
    testNotification,
    clearNotifications,
    removeNotification,
    reconnect,
    requestAudioPermission,
    requestNotificationPermission,
    
    // Sound manager access
    soundManager: notificationSoundManager
  };
}