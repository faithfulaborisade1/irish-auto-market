// src/app/api/admin/auth/me/route.ts - Admin auth verification endpoint
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies with multiple fallback methods
    const adminToken = request.cookies.get('admin-token')?.value || 
                      request.cookies.get('auth-token')?.value;

    if (!adminToken) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(adminToken, process.env.JWT_SECRET!);
    } catch (jwtError: any) {
      console.log('JWT verification failed:', jwtError.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user still exists and is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        adminProfile: true 
      }
    });

    if (!user || !user.adminProfile || !user.adminProfile.isActive) {
      return NextResponse.json(
        { error: 'Admin account not found or disabled' },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 401 }
      );
    }

    // Return user info (matching your layout expectations)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.adminProfile.adminRole,
      permissions: user.adminProfile.permissions || [],
      lastLogin: user.lastLoginAt
    });

  } catch (error: any) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'Authentication verification failed' },
      { status: 500 }
    );
  }
}