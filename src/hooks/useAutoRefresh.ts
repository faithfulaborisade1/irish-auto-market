import { useEffect, useRef, useCallback } from 'react'

interface UseAutoRefreshProps {
  callback: () => void
  interval?: number
  enabled?: boolean
}

export function useAutoRefresh({ callback, interval = 5000, enabled = true }: UseAutoRefreshProps) {
  const intervalRef = useRef<NodeJS.Timeout>()
  
  // ✅ FIXED: Create stable callback reference using useCallback
  const stableCallback = useCallback(callback, [callback])

  useEffect(() => {
    if (!enabled) return

    // Only auto-refresh in production (no WebSockets)
    if (process.env.NODE_ENV === 'production') {
      intervalRef.current = setInterval(stableCallback, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [stableCallback, interval, enabled]) // ✅ Use stable callback reference

  // Return cleanup function
  return useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])
}