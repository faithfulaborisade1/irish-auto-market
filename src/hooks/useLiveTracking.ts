// src/hooks/useLiveTracking.ts - Live visitor tracking hook
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface LiveTrackingOptions {
  enabled?: boolean;
  heartbeatInterval?: number; // ms
  sessionId?: string;
}

export function useLiveTracking(options: LiveTrackingOptions = {}) {
  const {
    enabled = true,
    heartbeatInterval = 30000, // 30 seconds
    sessionId
  } = options;

  const pathname = usePathname();
  const heartbeatInterval_ref = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(sessionId || null);
  const isVisibleRef = useRef(true);
  const lastPathRef = useRef(pathname);

  // Send heartbeat to server
  const sendHeartbeat = async (action: 'heartbeat' | 'page_change' | 'disconnect' = 'heartbeat') => {
    if (!enabled || !sessionIdRef.current) return;

    try {
      await fetch('/api/live-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          path: pathname,
          sessionId: sessionIdRef.current,
        }),
      });
      
      if (action === 'heartbeat') {
        console.log(`💓 Heartbeat sent: ${pathname}`);
      }
    } catch (error) {
      console.warn('💓 Heartbeat failed:', error);
    }
  };

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (document.hidden) {
        // Page is hidden, stop heartbeat
        if (heartbeatInterval_ref.current) {
          clearInterval(heartbeatInterval_ref.current);
          heartbeatInterval_ref.current = null;
        }
      } else {
        // Page is visible again, resume heartbeat
        startHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for reliable disconnect tracking
        navigator.sendBeacon('/api/live-tracking', JSON.stringify({
          action: 'disconnect',
          sessionId: sessionIdRef.current,
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Start heartbeat interval
  const startHeartbeat = () => {
    if (heartbeatInterval_ref.current) {
      clearInterval(heartbeatInterval_ref.current);
    }

    if (!isVisibleRef.current || !enabled) return;

    heartbeatInterval_ref.current = setInterval(() => {
      if (isVisibleRef.current) {
        sendHeartbeat('heartbeat');
      }
    }, heartbeatInterval);
  };

  // Handle path changes
  useEffect(() => {
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      sendHeartbeat('page_change');
    }
  }, [pathname]);

  // Initialize tracking
  useEffect(() => {
    if (!enabled) return;

    // Start heartbeat
    startHeartbeat();

    // Cleanup on unmount
    return () => {
      if (heartbeatInterval_ref.current) {
        clearInterval(heartbeatInterval_ref.current);
      }
    };
  }, [enabled, heartbeatInterval]);

  // Set session ID
  const setSessionId = (newSessionId: string) => {
    sessionIdRef.current = newSessionId;
  };

  return {
    setSessionId,
    sendHeartbeat,
  };
}