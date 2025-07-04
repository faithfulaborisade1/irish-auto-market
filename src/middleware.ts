// src/middleware.ts - FIXED VERSION WITH PROPER DEVELOPMENT HANDLING
import { NextRequest, NextResponse } from 'next/server';

// In-memory stores (move to Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean }>();
const failedAttempts = new Map<string, { count: number; lastAttempt: number; permanentBlock: boolean }>();
const csrfTokens = new Map<string, { token: string; expires: number }>();

// ✅ FIXED: Much more lenient rate limiting for development
const SECURITY_CONFIG = {
  development: {
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_ATTEMPTS: 10000,       // ✅ VERY HIGH for development
      BLOCK_DURATION: 10 * 1000, // Only 10 seconds blocks in dev
      PERMANENT_BLOCK_THRESHOLD: 100000, // ✅ Practically disabled in dev
      SKIP_AUTH_ENDPOINTS: true  // ✅ Skip rate limiting for auth checks entirely
    }
  },
  production: {
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_ATTEMPTS: 5,            // Strict for production
      BLOCK_DURATION: 60 * 60 * 1000, // 1 hour
      PERMANENT_BLOCK_THRESHOLD: 20, // permanent block after 20 failed attempts
      SKIP_AUTH_ENDPOINTS: false
    }
  },
  SESSION: {
    MAX_AGE: 30 * 60 * 1000, // 30 minutes
    ABSOLUTE_TIMEOUT: 8 * 60 * 60 * 1000 // 8 hours absolute
  },
  CSRF: {
    TOKEN_EXPIRY: 60 * 60 * 1000 // 1 hour
  }
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // ✅ DEVELOPMENT MODE - Much more lenient security
  if (isDevelopment) {
    console.log(`🚧 DEV MODE: ${pathname} from ${ip}`);
    
    // ✅ SKIP RATE LIMITING for auth endpoints in development
    if (pathname.includes('/api/auth/me') || 
        pathname.includes('/api/auth/') ||
        pathname.includes('/api/cars/') ||
        pathname.includes('/like')) {
      console.log(`🔓 DEV: Skipping rate limit for ${pathname}`);
      // Just do basic auth check without rate limiting
      return handleDevelopmentAuth(request, pathname);
    }
    
    // Basic admin auth for development (no rate limiting)
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      const authResult = await verifyAdminAuth(request, ip, userAgent);
      if (!authResult.authenticated) {
        console.log('🔓 DEV: Admin auth failed, redirecting to login');
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }
    
    // Basic API auth for development (no rate limiting)
    if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth/login') {
      const authResult = await verifyAdminAuth(request, ip, userAgent);
      if (!authResult.authenticated) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }), 
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    // Add basic security headers even in development
    const response = NextResponse.next();
    addBasicSecurityHeaders(response);
    return response;
  }

  // 🔒 PRODUCTION MODE - Full security enabled
  console.log(`🔒 PROD MODE: Full security active for ${pathname}`);
  
  // Create response with security headers
  const response = NextResponse.next();
  addSecurityHeaders(response);
  
  // Check for blocked IPs first
  if (isIPBlocked(ip)) {
    console.warn(`🚨 SECURITY: Blocked IP attempted access: ${ip} to ${pathname}`);
    return new NextResponse('Access Denied', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        ...getSecurityHeaders()
      }
    });
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    return await handleAdminSecurity(request, response, ip, userAgent);
  }

  // API route protection
  if (pathname.startsWith('/api/admin')) {
    return await handleAdminAPISecurity(request, response, ip, userAgent);
  }

  // Apply rate limiting to sensitive endpoints
  if (isSensitiveEndpoint(pathname)) {
    const rateLimitResult = checkRateLimit(ip, pathname);
    if (!rateLimitResult.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', ip, pathname, userAgent);
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '900', // 15 minutes
          ...getSecurityHeaders()
        }
      });
    }
  }

  return response;
}

// ✅ NEW: Handle development mode authentication without rate limiting
async function handleDevelopmentAuth(request: NextRequest, pathname: string): Promise<NextResponse> {
  // For development, just pass through most requests
  // Only block obviously admin requests without proper auth
  
  if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth/login') {
    const authResult = await verifyAdminAuth(request, 'dev', 'dev');
    if (!authResult.authenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  const response = NextResponse.next();
  addBasicSecurityHeaders(response);
  return response;
}

async function handleAdminSecurity(
  request: NextRequest, 
  response: NextResponse, 
  ip: string, 
  userAgent: string
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  
  // Skip auth check for login page
  if (pathname === '/admin/login') {
    return response;
  }

  // Check authentication with enhanced cookie detection
  const authResult = await verifyAdminAuth(request, ip, userAgent);
  
  if (!authResult.authenticated) {
    logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', ip, pathname, userAgent, {
      reason: authResult.reason,
      token: authResult.token ? 'present' : 'missing',
      allCookies: request.headers.get('cookie') || 'none'
    });
    
    // Redirect to login with security tracking
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('reason', 'auth_required');
    
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Add cache control to prevent caching of redirects
    redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    
    return redirectResponse;
  }

  // Log successful admin access
  logSecurityEvent('ADMIN_ACCESS', ip, pathname, userAgent, {
    adminId: authResult.adminId,
    role: authResult.role
  });

  return response;
}

async function handleAdminAPISecurity(
  request: NextRequest, 
  response: NextResponse, 
  ip: string, 
  userAgent: string
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  
  // Skip CSRF check for login endpoint
  if (pathname === '/api/admin/auth/login') {
    return response;
  }

  // Verify authentication for all other admin APIs
  const authResult = await verifyAdminAuth(request, ip, userAgent);
  
  if (!authResult.authenticated) {
    logSecurityEvent('UNAUTHORIZED_API_ACCESS', ip, pathname, userAgent);
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }), 
      { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...getSecurityHeaders()
        }
      }
    );
  }

  // CSRF protection for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfValid = await verifyCsrfToken(request);
    if (!csrfValid) {
      logSecurityEvent('CSRF_VIOLATION', ip, pathname, userAgent, {
        method: request.method,
        adminId: authResult.adminId
      });
      return new NextResponse(
        JSON.stringify({ error: 'CSRF token invalid' }), 
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders()
          }
        }
      );
    }
  }

  return response;
}

async function verifyAdminAuth(request: NextRequest, ip: string, userAgent: string) {
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      return { authenticated: false, reason: 'no_token' };
    }

    // Basic JWT validation for Edge Runtime
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { authenticated: false, reason: 'invalid_token_format', token };
    }

    try {
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return { authenticated: false, reason: 'token_expired', token };
      }

      // Validate required fields
      if (!payload.userId || !payload.role || !payload.isAdmin) {
        return { authenticated: false, reason: 'invalid_payload', token };
      }

      // Check session timeout
      const sessionAge = Date.now() - payload.iat * 1000;
      if (sessionAge > SECURITY_CONFIG.SESSION.ABSOLUTE_TIMEOUT) {
        return { authenticated: false, reason: 'session_timeout', token };
      }

      return { 
        authenticated: true, 
        adminId: payload.userId,
        role: payload.role,
        token 
      };
    } catch (decodeError) {
      return { authenticated: false, reason: 'token_decode_failed', token };
    }
  } catch (error: any) {
    logSecurityEvent('AUTH_ERROR', ip, 'middleware', userAgent, { error: error.message });
    return { authenticated: false, reason: 'auth_error' };
  }
}

// Enhanced cookie detection with multiple fallback methods
function getAuthToken(request: NextRequest): string | null {
  // Method 1: Try Next.js cookies API
  let token = request.cookies.get('admin-token')?.value || 
              request.cookies.get('auth-token')?.value;
  
  // Method 2: Fallback to manual cookie parsing (more reliable in Edge Runtime)
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      token = cookies['admin-token'] || cookies['auth-token'];
    }
  }
  
  // Method 3: Debug logging for troubleshooting (only in development)
  if (process.env.NODE_ENV === 'development') {
    if (!token) {
      const allCookies = request.headers.get('cookie') || '';
      console.log('🔍 Cookie Debug - No token found. All cookies:', allCookies);
    } else {
      console.log('✅ Cookie Debug - Token found');
    }
  }
  
  return token || null;
}

function checkRateLimit(ip: string, endpoint: string): { allowed: boolean; remaining: number } {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const config = isDevelopment ? SECURITY_CONFIG.development : SECURITY_CONFIG.production;
  
  // ✅ CRITICAL FIX: Skip rate limiting for auth endpoints in development
  if (isDevelopment && config.RATE_LIMIT.SKIP_AUTH_ENDPOINTS) {
    if (endpoint.includes('/api/auth/') || 
        endpoint.includes('/api/cars/') ||
        endpoint.includes('/like')) {
      return { allowed: true, remaining: 999 };
    }
  }
  
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  
  // Check for permanent blocks (only in production)
  if (!isDevelopment) {
    const failedAttempt = failedAttempts.get(ip);
    if (failedAttempt?.permanentBlock) {
      return { allowed: false, remaining: 0 };
    }
  }
  
  let bucket = rateLimitStore.get(key);
  
  if (!bucket || now > bucket.resetTime) {
    bucket = {
      count: 1,
      resetTime: now + config.RATE_LIMIT.WINDOW_MS,
      blocked: false
    };
  } else {
    bucket.count++;
  }
  
  // Check if limit exceeded
  if (bucket.count > config.RATE_LIMIT.MAX_ATTEMPTS) {
    bucket.blocked = true;
    
    // Track failed attempts for permanent blocking (only in production)
    if (!isDevelopment) {
      const current = failedAttempts.get(ip) || { count: 0, lastAttempt: 0, permanentBlock: false };
      current.count++;
      current.lastAttempt = now;
      
      if (current.count >= config.RATE_LIMIT.PERMANENT_BLOCK_THRESHOLD) {
        current.permanentBlock = true;
        logSecurityEvent('PERMANENT_IP_BLOCK', ip, endpoint, 'unknown', { 
          totalAttempts: current.count 
        });
      }
      
      failedAttempts.set(ip, current);
    }
  }
  
  rateLimitStore.set(key, bucket);
  
  return {
    allowed: !bucket.blocked,
    remaining: Math.max(0, config.RATE_LIMIT.MAX_ATTEMPTS - bucket.count)
  };
}

function isIPBlocked(ip: string): boolean {
  // Only check IP blocks in production
  if (process.env.NODE_ENV === 'development') {
    return false;
  }
  
  const failedAttempt = failedAttempts.get(ip);
  return failedAttempt?.permanentBlock || false;
}

function isSensitiveEndpoint(pathname: string): boolean {
  // ✅ FIXED: Don't apply rate limiting to auth check endpoints in development
  if (process.env.NODE_ENV === 'development') {
    const devSensitivePatterns = [
      '/api/admin/auth/login', // Only login attempts are rate limited in dev
    ];
    return devSensitivePatterns.some(pattern => pathname.startsWith(pattern));
  }
  
  // Production - all sensitive endpoints
  const sensitivePatterns = [
    '/api/admin/',
    '/api/auth/',
    '/admin',
    '/api/users',
    '/api/cars'
  ];
  
  return sensitivePatterns.some(pattern => pathname.startsWith(pattern));
}

async function verifyCsrfToken(request: NextRequest): Promise<boolean> {
  const token = request.headers.get('X-CSRF-Token') || 
                request.headers.get('X-Requested-With');
  
  if (!token) return false;
  
  // For now, accept XMLHttpRequest header as CSRF protection
  // In production, implement proper CSRF tokens
  return token === 'XMLHttpRequest' || csrfTokens.has(token);
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}

function addBasicSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
}

function addSecurityHeaders(response: NextResponse): void {
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

function getSecurityHeaders(): Record<string, string> {
  return {
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs these
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'"
    ].join('; '),
    
    // Security headers
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), location=()',
    
    // HTTPS enforcement (when in production)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    })
  };
}

function logSecurityEvent(
  event: string, 
  ip: string, 
  path: string, 
  userAgent: string, 
  metadata?: any
): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip,
    path,
    userAgent,
    metadata: metadata || {},
    severity: getSeverity(event)
  };
  
  // Enhanced logging with debug info
  if (isDevelopment) {
    console.log(`🔒 Security: ${event} from ${ip} on ${path}`);
    if (metadata && Object.keys(metadata).length > 0) {
      console.log('🔍 Debug metadata:', metadata);
    }
  } else {
    console.warn(`🚨 SECURITY EVENT: ${JSON.stringify(logEntry)}`);
  }
  
  // Store in database for audit trail (implement in production)
  // await storeSecurityEvent(logEntry);
}

function getSeverity(event: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
    'ADMIN_ACCESS': 'LOW',
    'UNAUTHORIZED_ADMIN_ACCESS': 'HIGH',
    'UNAUTHORIZED_API_ACCESS': 'HIGH',
    'RATE_LIMIT_EXCEEDED': 'MEDIUM',
    'CSRF_VIOLATION': 'HIGH',
    'PERMANENT_IP_BLOCK': 'CRITICAL',
    'AUTH_ERROR': 'MEDIUM'
  };
  
  return severityMap[event] || 'MEDIUM';
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/auth/:path*',
    '/api/users/:path*',
    '/api/cars/:path*'
  ]
};