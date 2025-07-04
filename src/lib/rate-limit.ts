// src/lib/rate-limit.ts
import { NextRequest } from 'next/server'

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

interface RateLimitResult {
  limit: number
  remaining: number
  reset: number
  success: boolean
}

// In-memory store for rate limiting (use Redis in production for multiple servers)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  rateLimitStore.forEach((value, key) => {
    if (value.resetTime <= now) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => {
    rateLimitStore.delete(key)
  })
}, 60000) // Clean every minute

export function rateLimit(options: RateLimitOptions) {
  const { interval, uniqueTokenPerInterval } = options

  return {
    check: async (
      request: NextRequest, 
      limit: number = uniqueTokenPerInterval, 
      token?: string
    ): Promise<RateLimitResult> => {
      // Get identifier (IP address or custom token)
      const identifier = token || getClientIP(request) || 'unknown'
      const key = `rate_limit:${identifier}`
      const now = Date.now()
      const resetTime = now + interval

      // Get current rate limit data
      const current = rateLimitStore.get(key)

      if (!current || current.resetTime <= now) {
        // First request or window has reset
        rateLimitStore.set(key, { count: 1, resetTime })
        return {
          limit,
          remaining: limit - 1,
          reset: resetTime,
          success: true
        }
      }

      // Check if limit exceeded
      if (current.count >= limit) {
        return {
          limit,
          remaining: 0,
          reset: current.resetTime,
          success: false
        }
      }

      // Increment counter
      current.count += 1
      rateLimitStore.set(key, current)

      return {
        limit,
        remaining: limit - current.count,
        reset: current.resetTime,
        success: true
      }
    }
  }
}

// Get client IP address
function getClientIP(request: NextRequest): string | null {
  // Check various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return null
}

// ✅ FIXED: Separate rate limiters for different use cases
export const rateLimiters = {
  // General API rate limiting
  api: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100, // 100 requests per minute
  }),

  // ✅ CRITICAL: Login attempts (strict for security)
  login: rateLimit({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5, // 5 login attempts per 15 minutes
  }),

  // ✅ NEW: Authentication status checks (lenient for normal usage)
  authCheck: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 auth checks per minute (normal browsing)
  }),

  // Car creation rate limiting (prevent spam)
  carCreation: rateLimit({
    interval: 60 * 1000, // 1 minute  
    uniqueTokenPerInterval: 5, // 5 car listings per minute
  }),

  // Image upload rate limiting
  imageUpload: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 20, // 20 image uploads per minute
  }),

  // Search rate limiting
  search: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 50, // 50 searches per minute
  }),

  // ✅ NEW: Notification checks (moderate)
  notifications: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 20, // 20 notification checks per minute
  }),

  // ✅ NEW: Message/conversation checks (moderate)
  messages: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 25, // 25 message checks per minute
  }),

  // ✅ NEW: Admin operations (more restrictive)
  admin: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 50, // 50 admin operations per minute
  }),
}

// Rate limit middleware helper
export async function withRateLimit(
  request: NextRequest,
  limiter: ReturnType<typeof rateLimit>,
  options?: { limit?: number; token?: string }
) {
  const result = await limiter.check(
    request, 
    options?.limit, 
    options?.token
  )

  if (!result.success) {
    const resetDate = new Date(result.reset)
    throw new Error(
      `Rate limit exceeded. Try again at ${resetDate.toLocaleTimeString()}`
    )
  }

  return result
}