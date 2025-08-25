// src/hooks/useAdminNotifications.ts - FIXED - NO RE-RENDER LOOP
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
  const hasRequestedAudioPermission = useRef(false);

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

  // Play notification sound with better error handling
  const playNotificationSound = useCallback(async (notification: AdminNotification) => {
    if (!notification.playSound) {
      console.log('🔇 Notification sound disabled for this notification');
      return;
    }

    try {
      // Check if we need audio permission first
      if (notificationSoundManager.needsPermission() && !hasRequestedAudioPermission.current) {
        console.log('🔊 Audio permission needed for notification sound');
        return; // Don't auto-request, let user enable manually
      }

      console.log('🔊 Playing notification sound...');
      await notificationSoundManager.playNotificationSound();
      console.log('✅ Notification sound played successfully');
    } catch (error) {
      console.error('❌ Failed to play notification sound:', error);
      
      // If it's an autoplay error, mark that we need permission
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.log('🔇 Audio autoplay blocked - user interaction required');
      }
    }
  }, []);

  // Handle incoming SSE messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 SSE message received:', data);
      
      switch (data.type) {
        case 'CONNECTED':
        case 'connected':
          console.log('✅ Admin notifications connected:', data.message || data.data?.message);
          setState(prev => ({ 
            ...prev, 
            connected: true, 
            connectionError: null,
            reconnecting: false 
          }));
          reconnectAttempts.current = 0;
          break;

        case 'NOTIFICATION':
          console.log('🔍 Raw notification data:', data);
          console.log('🔍 Looking for notification in data.data:', data.data);
          
          // Handle notification nested in data property
          const notification = data.data?.notification as AdminNotification;
          if (notification) {
            console.log('🔊 Processing SSE notification:', notification.title);
            console.log('🔊 Notification details:', notification);
            showNotificationToast(notification);
            playNotificationSound(notification);
          } else {
            console.log('❌ No notification found in SSE data:', data);
            console.log('❌ Available data keys:', Object.keys(data));
            if (data.data) {
              console.log('❌ data.data keys:', Object.keys(data.data));
            }
          }
          break;

        case 'PING':
        case 'ping':
          // Keep-alive ping, no action needed
          console.log('📡 SSE ping received');
          break;

        default:
          console.log('📨 Unknown notification type:', data.type, 'Full data:', data);
      }
    } catch (error) {
      console.error('❌ Failed to parse SSE message:', error);
      console.error('❌ Raw event data:', event.data);
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
    
    // Attempt to reconnect with exponential backoff
    if (mountedRef.current && reconnectAttempts.current < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000); // Max 10s
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

  // ✅ FIXED: Create stable connectToNotifications without dependencies
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

      // Handle close event manually since EventSource doesn't have onclose
      const originalClose = eventSource.close;
      eventSource.close = function() {
        handleClose();
        originalClose.call(this);
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setState(prev => ({ 
        ...prev, 
        connectionError: 'Failed to establish connection',
        reconnecting: false
      }));
    }
  }, []); // ✅ FIXED: Empty dependency array to prevent re-creation

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
      hasRequestedAudioPermission.current = true;
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
      type: 'TEST',
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

  // ✅ FIXED: Initialize connection ONCE ONLY - no changing dependencies
  useEffect(() => {
    console.log('🔄 Admin Notifications Hook: Initializing ONCE');
    mountedRef.current = true;
    
    // Request permissions on mount
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        console.log(`🔔 Browser notification permission: ${permission}`);
      });
    }
    
    // Connect to notifications
    connectToNotifications();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Admin Notifications Hook: Cleaning up');
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
  }, []); // ✅ CRITICAL: EMPTY DEPENDENCY ARRAY - RUNS ONCE ONLY

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
    soundManager: notificationSoundManager,
    
    // Audio permission status
    needsAudioPermission: () => typeof window !== 'undefined' && notificationSoundManager.needsPermission()
  };
}