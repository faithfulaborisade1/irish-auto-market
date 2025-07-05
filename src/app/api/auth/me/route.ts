// src/app/api/auth/me/route.ts - EMERGENCY PRODUCTION FIX
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 🚨 EMERGENCY FIX: COMPLETELY DISABLE RATE LIMITING FOR AUTH ENDPOINT
    // This endpoint needs to work reliably for user authentication
    console.log('🔓 Auth check - rate limiting disabled for stability');

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

    // ✅ EXTENDED: More lenient token age check (90 days)
    const tokenAge = Date.now() / 1000 - (decoded.iat || 0);
    const maxTokenAge = 90 * 24 * 60 * 60; // 90 days
    
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

    // ✅ EMERGENCY: Return successful response without any rate limit headers
    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error: any) {
    console.error('Auth me error:', error);
    
    // ✅ PRODUCTION: Don't expose internal error details
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        errorId: Date.now().toString()
      },
      { status: 500 }
    );
  }
}