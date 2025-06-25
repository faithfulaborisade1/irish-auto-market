import { useEffect, useRef } from 'react'

interface UseAutoRefreshProps {
  callback: () => void
  interval?: number
  enabled?: boolean
}

export function useAutoRefresh({ callback, interval = 5000, enabled = true }: UseAutoRefreshProps) {
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled) return

    // Only auto-refresh in production (no WebSockets)
    if (process.env.NODE_ENV === 'production') {
      intervalRef.current = setInterval(callback, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [callback, interval, enabled])

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }
}