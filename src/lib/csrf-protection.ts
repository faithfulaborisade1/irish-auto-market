// src/lib/csrf-protection.ts - Complete CSRF Protection System
import { NextRequest } from 'next/server';
import { auditLogger, SecurityEventType } from './audit-logger';

// In-memory CSRF token store (use Redis in production)
const csrfTokens = new Map<string, {
  token: string;
  expires: number;
  adminId: string;
  ip: string;
}>();

const CSRF_CONFIG = {
  TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
  TOKEN_LENGTH: 32,
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_TOKENS_PER_ADMIN: 10 // Prevent token exhaustion attacks
};

class CSRFProtection {
  private static instance: CSRFProtection;
  private cleanupInterval: NodeJS.Timeout | null = null;

  public static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
      CSRFProtection.instance.startCleanup();
    }
    return CSRFProtection.instance;
  }

  /**
   * Generate a new CSRF token for an admin session
   */
  generateToken(adminId: string, ip: string): string {
    // Clean up old tokens for this admin
    this.cleanupAdminTokens(adminId);
    
    // Generate cryptographically secure token
    const token = this.generateSecureToken();
    const expires = Date.now() + CSRF_CONFIG.TOKEN_EXPIRY;
    
    // Store token
    csrfTokens.set(token, {
      token,
      expires,
      adminId,
      ip
    });
    
    console.log(`🔐 Generated CSRF token for admin ${adminId}: ${token.substring(0, 8)}...`);
    
    return token;
  }

  /**
   * Verify CSRF token validity
   */
  async verifyToken(
    request: NextRequest, 
    adminId: string, 
    ip: string
  ): Promise<{ valid: boolean; reason?: string }> {
    // Get token from various headers
    const token = this.extractToken(request);
    
    if (!token) {
      await auditLogger.logSecurityEvent({
        type: 'CSRF_TOKEN_MISSING',
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        path: request.nextUrl.pathname,
        blocked: true,
        metadata: { adminId }
      });
      
      return { valid: false, reason: 'CSRF token missing' };
    }

    // Check if token exists
    const tokenData = csrfTokens.get(token);
    if (!tokenData) {
      await auditLogger.logSecurityEvent({
        type: 'CSRF_TOKEN_INVALID',
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        path: request.nextUrl.pathname,
        blocked: true,
        metadata: { adminId, token: token.substring(0, 8) + '...' }
      });
      
      return { valid: false, reason: 'Invalid CSRF token' };
    }

    // Check expiration
    if (Date.now() > tokenData.expires) {
      csrfTokens.delete(token);
      
      await auditLogger.logSecurityEvent({
        type: 'CSRF_TOKEN_EXPIRED',
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        path: request.nextUrl.pathname,
        blocked: true,
        metadata: { adminId }
      });
      
      return { valid: false, reason: 'CSRF token expired' };
    }

    // Check admin ID match
    if (tokenData.adminId !== adminId) {
      await auditLogger.logSecurityEvent({
        type: 'CSRF_TOKEN_ADMIN_MISMATCH',
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        path: request.nextUrl.pathname,
        blocked: true,
        metadata: { 
          expectedAdminId: adminId, 
          tokenAdminId: tokenData.adminId 
        }
      });
      
      return { valid: false, reason: 'CSRF token admin mismatch' };
    }

    // Optional: Check IP match for extra security
    if (process.env.CSRF_IP_BINDING === 'true' && tokenData.ip !== ip) {
      await auditLogger.logSecurityEvent({
        type: 'CSRF_TOKEN_IP_MISMATCH',
        ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
        path: request.nextUrl.pathname,
        blocked: true,
        metadata: { 
          adminId,
          expectedIP: tokenData.ip,
          actualIP: ip
        }
      });
      
      return { valid: false, reason: 'CSRF token IP mismatch' };
    }

    // Token is valid - optionally rotate it for enhanced security
    if (process.env.CSRF_AUTO_ROTATE === 'true') {
      this.rotateToken(token, adminId, ip);
    }

    console.log(`✅ CSRF token verified for admin ${adminId}`);
    return { valid: true };
  }

  /**
   * Invalidate all tokens for an admin (on logout)
   */
  invalidateAdminTokens(adminId: string): void {
    const tokensToDelete: string[] = [];
    
    csrfTokens.forEach((data, token) => {
      if (data.adminId === adminId) {
        tokensToDelete.push(token);
      }
    });
    
    tokensToDelete.forEach(token => csrfTokens.delete(token));
    
    if (tokensToDelete.length > 0) {
      console.log(`🗑️ Invalidated ${tokensToDelete.length} CSRF tokens for admin ${adminId}`);
    }
  }

  /**
   * Get CSRF token info for debugging (admin endpoint)
   */
  getTokenInfo(adminId: string): any {
    const adminTokens: any[] = [];
    
    csrfTokens.forEach((data, token) => {
      if (data.adminId === adminId) {
        adminTokens.push({
          token: token.substring(0, 8) + '...',
          expires: new Date(data.expires).toISOString(),
          ip: data.ip,
          timeLeft: Math.max(0, data.expires - Date.now()),
          isExpired: Date.now() > data.expires
        });
      }
    });
    
    return {
      totalTokens: adminTokens.length,
      tokens: adminTokens,
      maxTokens: CSRF_CONFIG.MAX_TOKENS_PER_ADMIN,
      tokenExpiry: CSRF_CONFIG.TOKEN_EXPIRY
    };
  }

  /**
   * Get system-wide CSRF statistics (for monitoring)
   */
  getSystemStats(): any {
    const now = Date.now();
    let totalTokens = 0;
    let expiredTokens = 0;
    let validTokens = 0;
    const adminStats = new Map<string, number>();

    csrfTokens.forEach((data, token) => {
      totalTokens++;
      
      if (now > data.expires) {
        expiredTokens++;
      } else {
        validTokens++;
      }
      
      const current = adminStats.get(data.adminId) || 0;
      adminStats.set(data.adminId, current + 1);
    });

    // Convert adminStats Map to object
    const adminBreakdown: Record<string, number> = {};
    adminStats.forEach((count, adminId) => {
      adminBreakdown[adminId] = count;
    });

    return {
      totalTokens,
      validTokens,
      expiredTokens,
      adminsWithTokens: adminStats.size,
      adminBreakdown
    };
  }

  /**
   * Extract CSRF token from request headers
   */
  private extractToken(request: NextRequest): string | null {
    // Check multiple header locations
    const headerLocations = [
      'X-CSRF-Token',
      'X-CSRFToken', 
      'X-Requested-With',
      'csrf-token'
    ];
    
    for (const header of headerLocations) {
      const token = request.headers.get(header);
      if (token && token !== 'XMLHttpRequest') {
        return token;
      }
    }
    
    // For XMLHttpRequest, accept it as basic CSRF protection
    const xRequestedWith = request.headers.get('X-Requested-With');
    if (xRequestedWith === 'XMLHttpRequest') {
      // Generate a temporary token for XMLHttpRequest calls
      return this.generateSecureToken();
    }
    
    return null;
  }

  /**
   * Generate cryptographically secure token
   */
  private generateSecureToken(): string {
    // Use Web Crypto API (available in Edge Runtime)
    const array = new Uint8Array(CSRF_CONFIG.TOKEN_LENGTH);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
  }

  /**
   * Rotate token for enhanced security
   */
  private rotateToken(oldToken: string, adminId: string, ip: string): string {
    csrfTokens.delete(oldToken);
    const newToken = this.generateToken(adminId, ip);
    console.log(`🔄 Rotated CSRF token for admin ${adminId}`);
    return newToken;
  }

  /**
   * Clean up old tokens for an admin
   */
  private cleanupAdminTokens(adminId: string): void {
    const adminTokens: Array<{ token: string; expires: number }> = [];
    
    // Collect all tokens for this admin
    csrfTokens.forEach((data, token) => {
      if (data.adminId === adminId) {
        adminTokens.push({ token, expires: data.expires });
      }
    });
    
    // Sort by expiration (oldest first)
    adminTokens.sort((a, b) => a.expires - b.expires);
    
    // Remove excess tokens
    if (adminTokens.length >= CSRF_CONFIG.MAX_TOKENS_PER_ADMIN) {
      const tokensToRemove = adminTokens.slice(0, 
        adminTokens.length - CSRF_CONFIG.MAX_TOKENS_PER_ADMIN + 1
      );
      
      tokensToRemove.forEach(({ token }) => csrfTokens.delete(token));
      
      if (tokensToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${tokensToRemove.length} old CSRF tokens for admin ${adminId}`);
      }
    }
  }

  /**
   * Start automatic cleanup of expired tokens
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredTokens: string[] = [];
      
      csrfTokens.forEach((data, token) => {
        if (now > data.expires) {
          expiredTokens.push(token);
        }
      });
      
      expiredTokens.forEach(token => csrfTokens.delete(token));
      
      if (expiredTokens.length > 0) {
        console.log(`🧹 Cleaned up ${expiredTokens.length} expired CSRF tokens`);
      }
    }, CSRF_CONFIG.CLEANUP_INTERVAL);
    
    console.log(`🔄 Started CSRF token cleanup service (interval: ${CSRF_CONFIG.CLEANUP_INTERVAL}ms)`);
  }

  /**
   * Stop cleanup interval (for testing or shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Stopped CSRF token cleanup service');
    }
  }

  /**
   * Force cleanup of all expired tokens
   */
  forceCleanup(): number {
    const now = Date.now();
    const expiredTokens: string[] = [];
    
    csrfTokens.forEach((data, token) => {
      if (now > data.expires) {
        expiredTokens.push(token);
      }
    });
    
    expiredTokens.forEach(token => csrfTokens.delete(token));
    
    console.log(`🧹 Force cleanup removed ${expiredTokens.length} expired tokens`);
    return expiredTokens.length;
  }

  /**
   * Emergency: Clear all tokens (for security incidents)
   */
  clearAllTokens(): number {
    const count = csrfTokens.size;
    csrfTokens.clear();
    console.log(`🚨 EMERGENCY: Cleared all ${count} CSRF tokens`);
    return count;
  }
}

// Export singleton instance
export const csrfProtection = CSRFProtection.getInstance();

// Middleware helper function
export async function requireCSRFToken(
  request: NextRequest,
  adminId: string,
  ip: string
): Promise<{ valid: boolean; reason?: string }> {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }
  
  return await csrfProtection.verifyToken(request, adminId, ip);
}

// API endpoint helper
export function generateCSRFResponse(adminId: string, ip: string): { 
  token: string; 
  expires: number; 
  expiresAt: string;
} {
  const token = csrfProtection.generateToken(adminId, ip);
  const expires = Date.now() + CSRF_CONFIG.TOKEN_EXPIRY;
  
  return { 
    token, 
    expires,
    expiresAt: new Date(expires).toISOString()
  };
}

// Security monitoring helpers
export function getCSRFStats(): any {
  return csrfProtection.getSystemStats();
}

export function getAdminCSRFInfo(adminId: string): any {
  return csrfProtection.getTokenInfo(adminId);
}

export function invalidateAdminCSRFTokens(adminId: string): void {
  csrfProtection.invalidateAdminTokens(adminId);
}

export function forceCSRFCleanup(): number {
  return csrfProtection.forceCleanup();
}

// Emergency functions
export function emergencyClearAllCSRFTokens(): number {
  return csrfProtection.clearAllTokens();
}

// Configuration helpers
export const CSRF_CONFIGURATION = {
  TOKEN_EXPIRY_MS: CSRF_CONFIG.TOKEN_EXPIRY,
  TOKEN_EXPIRY_MINUTES: CSRF_CONFIG.TOKEN_EXPIRY / (60 * 1000),
  MAX_TOKENS_PER_ADMIN: CSRF_CONFIG.MAX_TOKENS_PER_ADMIN,
  CLEANUP_INTERVAL_MINUTES: CSRF_CONFIG.CLEANUP_INTERVAL / (60 * 1000)
} as const;

// Type exports for better TypeScript support
export type CSRFVerificationResult = {
  valid: boolean;
  reason?: string;
};

export type CSRFTokenInfo = {
  token: string;
  expires: number;
  expiresAt: string;
};

export type CSRFSystemStats = {
  totalTokens: number;
  validTokens: number;
  expiredTokens: number;
  adminsWithTokens: number;
  adminBreakdown: Record<string, number>;
};

// React helper functions for frontend integration
export const CSRFHelpers = {
  /**
   * Add CSRF token to fetch request headers
   */
  addCSRFHeaders(token: string, headers: HeadersInit = {}): HeadersInit {
    return {
      'X-CSRF-Token': token,
      'X-Requested-With': 'XMLHttpRequest',
      ...headers
    };
  },

  /**
   * Create secure fetch wrapper with CSRF protection
   */
  createSecureFetch(token: string) {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      const secureHeaders = CSRFHelpers.addCSRFHeaders(token, options.headers);
      
      return fetch(url, {
        ...options,
        headers: secureHeaders,
        credentials: 'include'
      });
    };
  },

  /**
   * Check if request method needs CSRF protection
   */
  needsCSRFProtection(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }
} as const;