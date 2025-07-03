// src/app/api/admin/auth/logout/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies (check both possible names)
    const adminToken = request.cookies.get('admin-token')?.value || 
                      request.cookies.get('auth-token')?.value;

    if (adminToken) {
      try {
        // Decode token to get admin info for session cleanup
        const decoded: any = jwt.verify(adminToken, process.env.JWT_SECRET!);
        
        // Find and deactivate admin sessions in database
        if (decoded.userId) {
          await prisma.adminSession.updateMany({
            where: {
              admin: {
                userId: decoded.userId
              },
              isActive: true
            },
            data: {
              isActive: false,
              revokedAt: new Date(),
              revokedReason: 'User logout'
            }
          });

          console.log('🔒 Admin logout successful for user:', decoded.userId);
        }
      } catch (jwtError) {
        // Token invalid, but still clear cookies
        console.log('Invalid token during logout, clearing cookies anyway');
      }
    }

    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });

    // Clear ALL possible cookies (both new and old paths)
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    // Also clear the old path-restricted cookie (in case it exists)
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin',
      maxAge: 0
    });

    return response;

  } catch (error: any) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });

    // Clear cookies even on error
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });

    return response;
  }
}