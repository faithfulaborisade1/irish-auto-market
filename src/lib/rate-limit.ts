// src/lib/rate-limit.ts - FIXED VERSION WITH DEVELOPMENT MODE
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
      // ✅ CRITICAL FIX: Skip rate limiting entirely in development
      if (process.env.NODE_ENV === 'development') {
        return {
          limit,
          remaining: limit - 1,
          reset: Date.now() + interval,
          success: true // Always allow in development
        }
      }

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

// ✅ FIXED: Development-aware rate limiters
export const rateLimiters = {
  // General API rate limiting
  api: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: process.env.NODE_ENV === 'development' ? 10000 : 100, // Much higher for dev
  }),

  // ✅ CRITICAL: Login attempts (strict for security, but lenient in dev)
  login: rateLimit({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: process.env.NODE_ENV === 'development' ? 1000 : 5, // Very high for dev
  }),

  // ✅ FIXED: Authentication status checks (VERY lenient)
  auth: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: process.env.NODE_ENV === 'development' ? 50000 : 30, // Extremely high for dev
  }),

  // ✅ ADDED: Separate authCheck for backward compatibility
  authCheck: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: process.env.NODE_ENV === 'development' ? 50000 : 30, // Extremely high for dev
  }),

  // Car creation rate limiting (prevent spam)
  carCreation: rateLimit({
    interval: 60 * 1000, // 1 minute  
    uniqueTokenPerInterval: process.env.NODE_ENV === 'development' ? 1000 : 5,
  }),

  // Image upload rate limiting
  imageUpload: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: process.env.NODE_ENV === 'development' ? 1000 : 20,
  }),

  // Search rate limiting
  search: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: process.env.NODE_ENV === 'development' ? 10000 : 50,
  }),

  // ✅ FIXED: Notification checks (very lenient in dev)
  notifications: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: process.env.NODE_ENV === 'development' ? 10000 : 20,
  }),

  // ✅ FIXED: Message/conversation checks (very lenient in dev)
  messages: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: process.env.NODE_ENV === 'development' ? 10000 : 25,
  }),

  // ✅ FIXED: Admin operations (lenient in dev)
  admin: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: process.env.NODE_ENV === 'development' ? 5000 : 50,
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
    
    // ✅ More informative error messages
    const isDev = process.env.NODE_ENV === 'development'
    const errorMessage = isDev 
      ? `DEV: Rate limit exceeded (this shouldn't happen in dev). Try again at ${resetDate.toLocaleTimeString()}`
      : `Rate limit exceeded. Try again at ${resetDate.toLocaleTimeString()}`
    
    throw new Error(errorMessage)
  }

  return result
}

// ✅ NEW: Quick check function for common use cases
export async function checkRateLimit(
  request: NextRequest,
  type: 'api' | 'auth' | 'login' | 'search' | 'admin' = 'api'
): Promise<boolean> {
  // Always return true in development
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  try {
    const limiter = rateLimiters[type] || rateLimiters.api
    const result = await limiter.check(request)
    return result.success
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return false // Fail closed in production
  }
}