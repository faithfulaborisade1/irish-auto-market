// src/app/api/admin/auth/login/route.ts - SCHEMA-COMPLIANT VERSION
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/database';
import { AdminAction, LogSeverity, ResourceType } from '@prisma/client';

// Enhanced rate limiting store
const loginAttempts = new Map<string, {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockExpires: number;
  permanentBlock: boolean;
}>();

const SECURITY_CONFIG = {
  RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION: 60 * 60 * 1000, // 1 hour
    PROGRESSIVE_DELAY: [1000, 2000, 5000, 10000, 30000], // Progressive delays
    PERMANENT_BLOCK_THRESHOLD: 20 // Permanent block after 20 failed attempts
  },
  SESSION: {
    JWT_EXPIRY: '30m', // 30 minutes
    ABSOLUTE_EXPIRY: '8h', // 8 hours absolute
    REFRESH_THRESHOLD: 10 * 60 * 1000 // Refresh if < 10 minutes left
  }
};

// Enhanced validation schema
const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email too short')
    .max(100, 'Email too long')
    .transform(email => email.toLowerCase().trim()),
  password: z.string()
    .min(1, 'Password required')
    .max(500, 'Password too long'), // Prevent DoS
  captcha: z.string().optional(), // For future captcha implementation
  deviceFingerprint: z.string().optional() // Device tracking
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const origin = request.headers.get('origin') || 'unknown';
  
  try {
    // Security pre-checks
    await securityPreChecks(ip, request);
    
    // Parse and validate input
    const body = await request.json().catch(() => ({}));
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      await logSecurityEvent('INVALID_LOGIN_DATA', ip, userAgent, {
        errors: validationResult.error.issues,
        providedKeys: Object.keys(body)
      });
      
      return createErrorResponse('Invalid request data', 400);
    }
    
    const { email, password } = validationResult.data;
    
    // Check rate limiting
    const rateLimitResult = checkRateLimit(ip, email);
    if (!rateLimitResult.allowed) {
      await logSecurityEvent('LOGIN_RATE_LIMITED', ip, userAgent, {
        email,
        attemptCount: rateLimitResult.attemptCount,
        blockExpires: rateLimitResult.blockExpires
      });
      
      return createErrorResponse(
        `Too many login attempts. Try again in ${Math.ceil(rateLimitResult.timeToReset / 60000)} minutes.`,
        429,
        { 'Retry-After': rateLimitResult.timeToReset.toString() }
      );
    }
    
    // Progressive delay to slow down brute force
    if (rateLimitResult.attemptCount > 1) {
      const delay = SECURITY_CONFIG.RATE_LIMIT.PROGRESSIVE_DELAY[
        Math.min(rateLimitResult.attemptCount - 1, SECURITY_CONFIG.RATE_LIMIT.PROGRESSIVE_DELAY.length - 1)
      ] || 30000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Database query with error handling
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: { adminProfile: true }
      });
    } catch (dbError: any) {
      await logSecurityEvent('DATABASE_ERROR', ip, userAgent, {
        error: dbError.message,
        email: email.substring(0, 3) + '***' // Partial email for logging
      });
      return createErrorResponse('Authentication temporarily unavailable', 503);
    }
    
    // Check if user exists and is admin
    if (!user || !user.adminProfile || !['ADMIN', 'SUPER_ADMIN', 'CONTENT_MOD', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(user.role)) {
      await recordFailedAttempt(ip, email, 'USER_NOT_FOUND');
      await logSecurityEvent('LOGIN_ATTEMPT_INVALID_USER', ip, userAgent, {
        email: email.substring(0, 3) + '***',
        userExists: !!user,
        isAdmin: user ? ['ADMIN', 'SUPER_ADMIN', 'CONTENT_MOD', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(user.role) : false
      });
      
      // Generic error to prevent user enumeration
      return createErrorResponse('Invalid email or password', 401);
    }
    
    // Check account status
    if (user.status !== 'ACTIVE') {
      await recordFailedAttempt(ip, email, 'ACCOUNT_DISABLED');
      await logSecurityEvent('LOGIN_ATTEMPT_DISABLED_ACCOUNT', ip, userAgent, {
        userId: user.id,
        adminId: user.adminProfile.id,
        email: email.substring(0, 3) + '***'
      });
      
      return createErrorResponse('Account has been disabled', 403);
    }
    
    // Check admin profile status
    if (!user.adminProfile.isActive) {
      await recordFailedAttempt(ip, email, 'ADMIN_DISABLED');
      await logSecurityEvent('LOGIN_ATTEMPT_DISABLED_ADMIN', ip, userAgent, {
        userId: user.id,
        adminId: user.adminProfile.id
      });
      
      return createErrorResponse('Admin access has been disabled', 403);
    }
    
    // Verify password with timing attack protection
    const passwordValid = await verifyPasswordSecure(password, user.password || '');
    
    if (!passwordValid) {
      await recordFailedAttempt(ip, email, 'INVALID_PASSWORD');
      await logSecurityEvent('LOGIN_ATTEMPT_WRONG_PASSWORD', ip, userAgent, {
        userId: user.id,
        adminId: user.adminProfile.id,
        email: email.substring(0, 3) + '***'
      });
      
      return createErrorResponse('Invalid email or password', 401);
    }
    
    // Generate secure session token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.adminProfile.adminRole, // Use adminRole from schema
      permissions: user.adminProfile.permissions || [],
      isAdmin: true,
      ip: ip,
      userAgent: userAgent.substring(0, 200), // Truncate long user agents
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + 30 * 60 * 1000) / 1000) // 30 minutes
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      algorithm: 'HS256',
      issuer: 'irishautomarket.ie',
      audience: 'admin'
    });
    
    // Create admin session record
    try {
      await prisma.adminSession.create({
        data: {
          adminId: user.adminProfile.id,
          sessionToken: token.substring(0, 50), // Store partial token for tracking
          ipAddress: ip,
          deviceInfo: {
            ip,
            userAgent: userAgent.substring(0, 500),
            origin,
            timestamp: new Date().toISOString()
          },
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          isActive: true
        }
      });
    } catch (sessionError: any) {
      await logSecurityEvent('SESSION_CREATION_ERROR', ip, userAgent, {
        error: sessionError.message,
        userId: user.id,
        adminId: user.adminProfile.id
      });
      // Continue anyway - session tracking is not critical for login
    }
    
    // Update user's last login
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
      
      // Also update admin profile last login
      await prisma.adminProfile.update({
        where: { id: user.adminProfile.id },
        data: { lastLoginAt: new Date() }
      });
    } catch (updateError) {
      // Non-critical error, continue
    }
    
    // Clear failed attempts on successful login
    clearFailedAttempts(ip, email);
    
    // Log successful login with correct admin profile ID
    await logSecurityEvent('SUCCESSFUL_ADMIN_LOGIN', ip, userAgent, {
      userId: user.id,
      adminId: user.adminProfile.id,
      role: user.adminProfile.adminRole,
      loginDuration: Date.now() - startTime
    });
    
    // Create secure response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.adminProfile.adminRole,
        permissions: user.adminProfile.permissions || [],
        lastLogin: user.lastLoginAt
      }
    });
    
    // 🔧 FIXED: Set secure cookie with correct path and sameSite settings
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for redirect compatibility
      path: '/', // Changed from '/admin' to '/' - CRUCIAL FIX!
      maxAge: 30 * 60, // 30 minutes
    });

    // Set backup auth-token for middleware compatibility
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 60
    });

    // Debug logging
    console.log('🍪 Cookies set successfully with path: / and sameSite: lax');
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
    
  } catch (error: any) {
    await logSecurityEvent('LOGIN_SYSTEM_ERROR', ip, userAgent, {
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return createErrorResponse('Authentication system error', 500);
  }
}

async function securityPreChecks(ip: string, request: NextRequest): Promise<void> {
  // Check for common attack patterns
  const suspiciousPatterns = [
    'sqlmap',
    'nmap',
    'masscan',
    'nikto',
    'dirb',
    'gobuster'
  ];
  
  const userAgent = request.headers.get('user-agent') || '';
  const hasSuspiciousUA = suspiciousPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern)
  );
  
  if (hasSuspiciousUA) {
    await logSecurityEvent('SUSPICIOUS_USER_AGENT', ip, userAgent, {
      detected: true
    });
    throw new Error('Suspicious request detected');
  }
  
  // Check content type
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    await logSecurityEvent('INVALID_CONTENT_TYPE', ip, userAgent, {
      contentType
    });
    throw new Error('Invalid content type');
  }
}

function checkRateLimit(ip: string, email: string): {
  allowed: boolean;
  attemptCount: number;
  timeToReset: number;
  blockExpires: number;
} {
  const key = `${ip}:${email}`;
  const now = Date.now();
  
  let attempt = loginAttempts.get(key);
  
  if (!attempt) {
    attempt = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false,
      blockExpires: 0,
      permanentBlock: false
    };
  }
  
  // Check permanent block
  if (attempt.permanentBlock) {
    return {
      allowed: false,
      attemptCount: attempt.count,
      timeToReset: Infinity,
      blockExpires: Infinity
    };
  }
  
  // Check temporary block
  if (attempt.blocked && now < attempt.blockExpires) {
    return {
      allowed: false,
      attemptCount: attempt.count,
      timeToReset: attempt.blockExpires - now,
      blockExpires: attempt.blockExpires
    };
  }
  
  // Reset if window expired
  if (now - attempt.firstAttempt > SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS) {
    attempt = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false,
      blockExpires: 0,
      permanentBlock: false
    };
  } else {
    attempt.count++;
    attempt.lastAttempt = now;
  }
  
  // Check if should block
  if (attempt.count > SECURITY_CONFIG.RATE_LIMIT.MAX_ATTEMPTS) {
    attempt.blocked = true;
    attempt.blockExpires = now + SECURITY_CONFIG.RATE_LIMIT.BLOCK_DURATION;
    
    // Check for permanent block
    if (attempt.count >= SECURITY_CONFIG.RATE_LIMIT.PERMANENT_BLOCK_THRESHOLD) {
      attempt.permanentBlock = true;
    }
  }
  
  loginAttempts.set(key, attempt);
  
  return {
    allowed: !attempt.blocked,
    attemptCount: attempt.count,
    timeToReset: attempt.blocked ? attempt.blockExpires - now : 0,
    blockExpires: attempt.blockExpires
  };
}

async function verifyPasswordSecure(password: string, hash: string): Promise<boolean> {
  try {
    // Add small random delay to prevent timing attacks
    const randomDelay = Math.floor(Math.random() * 100) + 50;
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // Return false on any error
    return false;
  }
}

async function recordFailedAttempt(ip: string, email: string, reason: string): Promise<void> {
  await logSecurityEvent('FAILED_LOGIN_ATTEMPT', ip, 'unknown', {
    email: email.substring(0, 3) + '***',
    reason
  });
}

function clearFailedAttempts(ip: string, email: string): void {
  const key = `${ip}:${email}`;
  loginAttempts.delete(key);
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

// 🔧 FIXED: Schema-compliant audit logging
async function logSecurityEvent(
  event: string,
  ip: string,
  userAgent: string,
  metadata: any = {}
): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ip,
    userAgent: userAgent.substring(0, 200),
    metadata,
    severity: getEventSeverity(event)
  };
  
  // Console logging
  if (logEntry.severity === 'HIGH' || logEntry.severity === 'CRITICAL') {
    console.error(`🚨 HIGH SECURITY EVENT: ${JSON.stringify(logEntry)}`);
  } else {
    console.log(`🔒 Security Event: ${event} from ${ip}`);
  }
  
  // Store in database for audit trail - SCHEMA COMPLIANT
  try {
    // Map event string to AdminAction enum
    const adminAction = mapEventToAdminAction(event);
    
    // Only create audit log if we have a valid admin ID
    if (metadata.adminId && typeof metadata.adminId === 'string') {
      await prisma.adminAuditLog.create({
        data: {
          adminId: metadata.adminId,
          action: adminAction,
          resourceType: ResourceType.USER, // ✅ CORRECT: Using resourceType from your schema
          resourceId: metadata.userId || null,
          description: `Security Event: ${event}`,
          ipAddress: ip,
          userAgent: userAgent.substring(0, 500),
          oldValues: undefined,
          newValues: metadata,
          severity: mapSeverityToLogSeverity(logEntry.severity),
          createdAt: new Date()
        }
      });
    }
    
  } catch (auditError: any) {
    // Don't fail the entire request if audit logging fails
    console.error('Failed to store audit log:', auditError.message);
  }
}

// Map security event strings to AdminAction enum values
function mapEventToAdminAction(event: string): AdminAction {
  const eventToActionMap: Record<string, AdminAction> = {
    'SUCCESSFUL_ADMIN_LOGIN': AdminAction.USER_VERIFIED,
    'FAILED_LOGIN_ATTEMPT': AdminAction.SECURITY_EVENT,
    'LOGIN_RATE_LIMITED': AdminAction.SECURITY_EVENT,
    'LOGIN_ATTEMPT_INVALID_USER': AdminAction.SECURITY_EVENT,
    'LOGIN_ATTEMPT_DISABLED_ACCOUNT': AdminAction.USER_SUSPENDED,
    'LOGIN_ATTEMPT_DISABLED_ADMIN': AdminAction.USER_SUSPENDED,
    'LOGIN_ATTEMPT_WRONG_PASSWORD': AdminAction.SECURITY_EVENT,
    'SUSPICIOUS_USER_AGENT': AdminAction.SECURITY_EVENT,
    'INVALID_CONTENT_TYPE': AdminAction.SECURITY_EVENT,
    'INVALID_LOGIN_DATA': AdminAction.SECURITY_EVENT,
    'DATABASE_ERROR': AdminAction.SYSTEM_MAINTENANCE,
    'SESSION_CREATION_ERROR': AdminAction.SECURITY_EVENT,
    'LOGIN_SYSTEM_ERROR': AdminAction.SYSTEM_MAINTENANCE
  };
  
  return eventToActionMap[event] || AdminAction.SECURITY_EVENT;
}

// Map severity levels to LogSeverity enum
function mapSeverityToLogSeverity(severity: string): LogSeverity {
  const severityMap: Record<string, LogSeverity> = {
    'LOW': LogSeverity.INFO,
    'MEDIUM': LogSeverity.WARNING, 
    'HIGH': LogSeverity.ERROR,
    'CRITICAL': LogSeverity.CRITICAL
  };
  
  return severityMap[severity] || LogSeverity.INFO;
}

function getEventSeverity(event: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
    'SUCCESSFUL_ADMIN_LOGIN': 'LOW',
    'FAILED_LOGIN_ATTEMPT': 'MEDIUM',
    'LOGIN_RATE_LIMITED': 'HIGH',
    'LOGIN_ATTEMPT_INVALID_USER': 'MEDIUM',
    'LOGIN_ATTEMPT_DISABLED_ACCOUNT': 'HIGH',
    'LOGIN_ATTEMPT_DISABLED_ADMIN': 'HIGH',
    'LOGIN_ATTEMPT_WRONG_PASSWORD': 'MEDIUM',
    'SUSPICIOUS_USER_AGENT': 'HIGH',
    'INVALID_CONTENT_TYPE': 'MEDIUM',
    'INVALID_LOGIN_DATA': 'MEDIUM',
    'DATABASE_ERROR': 'HIGH',
    'SESSION_CREATION_ERROR': 'MEDIUM',
    'LOGIN_SYSTEM_ERROR': 'CRITICAL'
  };
  
  return severityMap[event] || 'MEDIUM';
}

function createErrorResponse(
  message: string, 
  status: number, 
  headers: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString()
    },
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        ...headers
      }
    }
  );
}