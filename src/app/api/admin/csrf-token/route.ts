// src/app/api/admin/csrf-token/route.ts - CSRF Token Generation API
import { NextRequest, NextResponse } from 'next/server';
import { csrfProtection } from '@/lib/csrf-protection';
import { auditLogger } from '@/lib/audit-logger';
import { SecurityEventType, SecuritySeverity, AdminAction, ResourceType, LogSeverity } from '@prisma/client';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      await auditLogger.logSecurityEvent({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,  // ✅ FIXED: Use eventType
        severity: SecuritySeverity.MEDIUM,                  // ✅ FIXED: Added required field
        description: `Unauthorized CSRF token request: ${authResult.reason}`,  // ✅ FIXED: Added required field
        targetIP: ip,                                       // ✅ FIXED: Use targetIP
        userAgent,
        endpoint: '/api/admin/csrf-token',                  // ✅ FIXED: Use endpoint
        blocked: true,
        requestData: { reason: authResult.reason }          // ✅ FIXED: Use requestData
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Ensure adminId is not undefined
    if (!authResult.adminId) {
      await auditLogger.logSecurityEvent({
        eventType: SecurityEventType.UNAUTHORIZED_ACCESS,  // ✅ FIXED: Use eventType
        severity: SecuritySeverity.MEDIUM,                  // ✅ FIXED: Added required field
        description: 'CSRF token request missing admin ID', // ✅ FIXED: Added required field
        targetIP: ip,                                       // ✅ FIXED: Use targetIP
        userAgent,
        endpoint: '/api/admin/csrf-token',                  // ✅ FIXED: Use endpoint
        blocked: true,
        requestData: { reason: 'missing_admin_id' }         // ✅ FIXED: Use requestData
      });
      
      return NextResponse.json(
        { error: 'Invalid admin session' },
        { status: 401 }
      );
    }

    // Generate CSRF token with validated adminId
    const token = csrfProtection.generateToken(authResult.adminId, ip);
    const expires = Date.now() + (60 * 60 * 1000); // 1 hour
    
    // Log token generation - ✅ FIXED: Use correct interface
    await auditLogger.logAdminAction({
      adminId: authResult.adminId,
      action: AdminAction.SECURITY_EVENT,                   // ✅ FIXED: Use proper enum
      resourceType: ResourceType.SYSTEM_SETTING,           // ✅ FIXED: Added required field
      resourceId: undefined,
      ipAddress: ip,
      userAgent,
      severity: LogSeverity.INFO,                          // ✅ FIXED: Use correct severity enum
      description: 'CSRF token generated',                 // ✅ FIXED: Added description
      newValues: {                                         // ✅ FIXED: Use newValues instead of metadata
        tokenPrefix: token.substring(0, 8),
        expires: new Date(expires).toISOString()
      }
    });
    
    return NextResponse.json({
      token,
      expires,
      expiresAt: new Date(expires).toISOString()
    });
    
  } catch (error: any) {
    await auditLogger.logSecurityEvent({
      eventType: SecurityEventType.UNAUTHORIZED_ACCESS,    // ✅ FIXED: Use eventType
      severity: SecuritySeverity.CRITICAL,                 // ✅ FIXED: Added required field
      description: `CSRF token generation error: ${error.message}`, // ✅ FIXED: Added required field
      targetIP: ip,                                         // ✅ FIXED: Use targetIP
      userAgent,
      endpoint: '/api/admin/csrf-token',                    // ✅ FIXED: Use endpoint
      blocked: true,
      requestData: { error: error.message }                // ✅ FIXED: Use requestData
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Debug endpoint for development (remove in production)
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!authResult.adminId) {
      return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 });
    }
    
    // Get debug info about CSRF tokens with validated adminId
    const tokenInfo = csrfProtection.getTokenInfo(authResult.adminId);
    
    return NextResponse.json({
      debug: true,
      adminId: authResult.adminId,
      ...tokenInfo
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function verifyAdminAuth(request: NextRequest): Promise<{
  success: boolean;
  adminId?: string;
  reason?: string;
}> {
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      return { success: false, reason: 'no_token' };
    }

    // Basic JWT validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { success: false, reason: 'invalid_token_format' };
    }

    try {
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return { success: false, reason: 'token_expired' };
      }

      // Validate required fields
      if (!payload.userId || !payload.role || !payload.isAdmin) {
        return { success: false, reason: 'invalid_payload' };
      }

      return { 
        success: true, 
        adminId: payload.userId
      };
    } catch (decodeError) {
      return { success: false, reason: 'token_decode_failed' };
    }
  } catch (error: any) {
    return { success: false, reason: 'auth_error' };
  }
}

function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get('admin-token')?.value || 
         request.cookies.get('auth-token')?.value || 
         null;
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