// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { rateLimiters } from '@/lib/rate-limit';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Get client IP helper
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    // ✅ CRITICAL FIX: Use authCheck rate limiter (not login limiter)
    const rateLimitResult = await rateLimiters.authCheck.check(request);
    
    if (!rateLimitResult.success) {
      const clientIP = getClientIP(request);
      console.log(`🚨 Auth check rate limit exceeded for IP: ${clientIP}`);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many authentication requests. Please wait a moment.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Get authentication token
    const authToken = request.cookies.get('auth-token')?.value;
    const adminToken = request.cookies.get('admin-token')?.value;
    const token = authToken || adminToken;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify JWT token with enhanced error handling
    let decoded: any;
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError: any) {
      console.error('JWT verification failed:', jwtError.message);
      
      // Clear invalid cookies
      const response = NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
      
      // Clear both possible auth cookies
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(0)
      });
      
      response.cookies.set('admin-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(0)
      });
      
      return response;
    }

    // Validate decoded token structure
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token payload' },
        { status: 401 }
      );
    }

    // Find user with enhanced security checks
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        // Include dealer profile if exists
        dealerProfile: {
          select: {
            id: true,
            businessName: true,
            verified: true,
            subscriptionType: true,
            logo: true,
            description: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // ✅ SECURITY: Check account status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Account is not active',
          accountStatus: user.status 
        },
        { status: 403 }
      );
    }

    // ✅ SECURITY: Check if token is too old (optional security measure)
    const tokenAge = Date.now() / 1000 - (decoded.iat || 0);
    const maxTokenAge = 30 * 24 * 60 * 60; // 30 days
    
    if (tokenAge > maxTokenAge) {
      return NextResponse.json(
        { success: false, message: 'Token expired, please login again' },
        { status: 401 }
      );
    }

    // Return sanitized user data
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      dealerProfile: user.dealerProfile
    };

    // ✅ SECURITY: Add rate limit headers to response
    const response = NextResponse.json({
      success: true,
      user: userData
    });

    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    return response;

  } catch (error: any) {
    console.error('Auth me error:', error);
    
    // ✅ SECURITY: Don't expose internal error details
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        errorId: Date.now().toString() // For debugging without exposing details
      },
      { status: 500 }
    );
  }
}