// src/hooks/useCSRFToken.ts - Actual React Hook Implementation
'use client';

import { useState, useEffect, useCallback } from 'react';

interface CSRFTokenData {
  token: string;
  expires: number;
  expiresAt: string;
}

interface UseCSRFTokenReturn {
  token: string | null;
  loading: boolean;
  error: string | null;
  makeSecureRequest: (url: string, options?: RequestInit) => Promise<Response>;
  refreshToken: () => Promise<void>;
  isTokenValid: boolean;
}

export function useCSRFToken(): UseCSRFTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenExpires, setTokenExpires] = useState<number>(0);

  const isTokenValid = token !== null && Date.now() < tokenExpires;

  const fetchCSRFToken = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authenticated. Please log in again.');
        }
        throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
      }

      const data: CSRFTokenData = await response.json();
      setToken(data.token);
      setTokenExpires(data.expires);
      
      console.log('🔒 CSRF token obtained:', {
        tokenPrefix: data.token.substring(0, 8) + '...',
        expiresAt: data.expiresAt
      });

    } catch (fetchError: any) {
      console.error('Failed to fetch CSRF token:', fetchError);
      setError(fetchError.message || 'Failed to fetch CSRF token');
      setToken(null);
      setTokenExpires(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh token when it's about to expire (5 minutes before)
  useEffect(() => {
    if (token && tokenExpires > 0) {
      const timeUntilExpiry = tokenExpires - Date.now();
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 30000); // 5 minutes before expiry, minimum 30 seconds

      const refreshTimer = setTimeout(() => {
        console.log('🔄 Auto-refreshing CSRF token');
        fetchCSRFToken();
      }, refreshTime);

      return () => clearTimeout(refreshTimer);
    }
  }, [token, tokenExpires, fetchCSRFToken]);

  // Initial token fetch
  useEffect(() => {
    fetchCSRFToken();
  }, [fetchCSRFToken]);

  const makeSecureRequest = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    // Check if we need a token for this request
    const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      options.method?.toUpperCase() || 'GET'
    );

    if (needsCSRF) {
      // Ensure we have a valid token
      if (!isTokenValid) {
        if (loading) {
          throw new Error('CSRF token is still loading. Please wait.');
        }
        if (error) {
          throw new Error(`CSRF token error: ${error}`);
        }
        if (!token) {
          throw new Error('No CSRF token available. Please refresh the page.');
        }
        if (Date.now() >= tokenExpires) {
          console.log('🔄 Token expired, refreshing...');
          await fetchCSRFToken();
          if (!token) {
            throw new Error('Failed to refresh CSRF token');
          }
        }
      }
    }

    // Prepare headers - FIXED TO AVOID TYPESCRIPT ERROR
    const headerRecord: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add existing headers from options
    if (options.headers) {
      if (options.headers instanceof Headers) {
        // Convert Headers object to record
        options.headers.forEach((value, key) => {
          headerRecord[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        // Handle array format [key, value][]
        options.headers.forEach(([key, value]) => {
          headerRecord[key] = value;
        });
      } else {
        // Handle plain object format
        Object.assign(headerRecord, options.headers);
      }
    }

    // Add CSRF token for state-changing operations
    if (needsCSRF && token) {
      headerRecord['X-CSRF-Token'] = token;
    }

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers: headerRecord, // Use our properly typed headers
      credentials: 'include', // Always include cookies for admin requests
    });

    // Handle CSRF token errors
    if (response.status === 403) {
      const responseText = await response.text();
      if (responseText.includes('CSRF')) {
        console.log('🔄 CSRF token rejected, refreshing...');
        await fetchCSRFToken();
        throw new Error('CSRF token was rejected. Please try again.');
      }
    }

    return response;
  }, [token, isTokenValid, loading, error, tokenExpires, fetchCSRFToken]);

  return {
    token,
    loading,
    error,
    makeSecureRequest,
    refreshToken: fetchCSRFToken,
    isTokenValid,
  };
}