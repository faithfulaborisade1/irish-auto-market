// src/hooks/usePageTracking.ts - Client-side page tracking
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface TrackingOptions {
  enabled?: boolean;
  trackOnMount?: boolean;
  debounceMs?: number;
}

export function usePageTracking(options: TrackingOptions = {}) {
  const {
    enabled = true,
    trackOnMount = true,
    debounceMs = 1000
  } = options;

  const pathname = usePathname();
  const lastTrackedPath = useRef<string>('');
  const trackingTimeout = useRef<NodeJS.Timeout | null>(null);

  const trackPageView = async (path: string, title?: string) => {
    if (!enabled || path === lastTrackedPath.current) return;
    
    try {
      const referrer = document.referrer || undefined;
      const pageTitle = title || document.title || undefined;
      
      // Collect more fingerprinting data for better unique visitor detection
      const extraData = {
        screenResolution: `${screen.width}x${screen.height}`,
        timezoneOffset: new Date().getTimezoneOffset(),
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine,
      };
      
      await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path,
          title: pageTitle,
          referrer,
          extraData,
        }),
      });
      
      lastTrackedPath.current = path;
      console.log(`📊 Tracked page view: ${path}`);
    } catch (error) {
      console.warn('📊 Page tracking failed:', error);
      // Fail silently to avoid breaking the user experience
    }
  };

  useEffect(() => {
    if (!enabled || !trackOnMount) return;

    // Clear any existing timeout
    if (trackingTimeout.current) {
      clearTimeout(trackingTimeout.current);
    }

    // Debounce tracking to avoid rapid-fire requests
    trackingTimeout.current = setTimeout(() => {
      trackPageView(pathname);
    }, debounceMs);

    return () => {
      if (trackingTimeout.current) {
        clearTimeout(trackingTimeout.current);
      }
    };
  }, [pathname, enabled, trackOnMount, debounceMs]);

  // Manual tracking function
  const track = (path?: string, title?: string) => {
    const pathToTrack = path || pathname;
    trackPageView(pathToTrack, title);
  };

  return { track };
}

// Hook for tracking custom events
export function useEventTracking() {
  const trackEvent = async (eventName: string, data?: Record<string, any>) => {
    try {
      // This could be extended to track custom events
      console.log(`📊 Event tracked: ${eventName}`, data);
      // Add custom event tracking API call here if needed
    } catch (error) {
      console.warn('📊 Event tracking failed:', error);
    }
  };

  return { trackEvent };
}