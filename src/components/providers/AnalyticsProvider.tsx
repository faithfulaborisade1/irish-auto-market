// src/components/providers/AnalyticsProvider.tsx - Analytics tracking provider
'use client';

import { usePageTracking } from '@/hooks/usePageTracking';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { useRef, useEffect } from 'react';

interface AnalyticsProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function AnalyticsProvider({ children, enabled = true }: AnalyticsProviderProps) {
  const sessionIdRef = useRef<string | null>(null);
  
  // Initialize page tracking for the entire app
  const { track } = usePageTracking({
    enabled,
    trackOnMount: true,
    debounceMs: 500, // Faster for development
  });

  // Initialize live tracking
  const { setSessionId } = useLiveTracking({
    enabled,
    heartbeatInterval: 30000, // 30 seconds
    sessionId: sessionIdRef.current || undefined,
  });

  // Override the track function to capture session ID
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      
      // Capture session ID from tracking API response
      if (typeof input === 'string' && input.includes('/api/track') && init?.method === 'POST') {
        try {
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();
          if (data.sessionId && !sessionIdRef.current) {
            sessionIdRef.current = data.sessionId;
            setSessionId(data.sessionId);
            console.log(`💓 Live tracking initialized with session: ${data.sessionId}`);
          }
        } catch (error) {
          // Ignore JSON parsing errors
        }
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [setSessionId]);

  return <>{children}</>;
}