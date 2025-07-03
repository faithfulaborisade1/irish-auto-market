// src/app/api/admin/users/admins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for getting admins
const GetAdminsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  search: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN']).optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all')
});

// Helper function to verify admin authentication and permissions
async function verifyAdminAuth(request: NextRequest) {
  try {
    // Get token from both possible cookie names
    const adminToken = request.cookies.get('admin-token')?.value || 
                      request.cookies.get('auth-token')?.value;

    if (!adminToken) {
      return { error: 'No admin token provided', status: 401 };
    }

    // Verify JWT token
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET!) as any;
    
    if (!decoded?.userId) {
      return { error: 'Invalid token format', status: 401 };
    }

    // Get admin user from database
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        adminProfile: true
      }
    });

    if (!adminUser) {
      return { error: 'Admin user not found', status: 401 };
    }

    if (!adminUser.adminProfile) {
      return { error: 'User is not an admin', status: 403 };
    }

    if (adminUser.status !== 'ACTIVE') {
      return { error: 'Admin account is disabled', status: 403 };
    }

    if (!['SUPER_ADMIN', 'CONTENT_MOD'].includes(adminUser.adminProfile.adminRole)) {
      return { error: 'Insufficient admin privileges', status: 403 };
    }

    return { 
      user: adminUser, 
      adminProfile: adminUser.adminProfile,
      canManageAdmins: adminUser.adminProfile.adminRole === 'SUPER_ADMIN'
    };

  } catch (error: any) {
    console.error('Admin auth verification error:', error);
    return { error: 'Token verification failed', status: 401 };
  }
}

// Helper function to log admin actions - FIXED FOR YOUR SCHEMA
async function logAdminAction(adminId: string, action: string, details: any, ip?: string) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: action as any, // Maps to AdminAction enum
        resourceType: 'USER' as any, // Maps to ResourceType enum
        resourceId: details.targetUserId || null,
        ipAddress: ip || 'unknown',
        severity: 'INFO' as any, // Maps to LogSeverity enum
        description: `${action}: Admin list accessed with ${details.totalAdmins || 0} total admins`,
        oldValues: undefined, // Optional JSON field
        newValues: details, // Required field in your schema
        userAgent: undefined, // Optional field
        endpoint: '/api/admin/users/admins',
        tags: undefined // Optional JSON field
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't fail the main operation if logging fails
  }
}

// GET /api/admin/users/admins - List all admin users
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/admin/users/admins - Fetching admin users');

    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const currentAdmin = authResult.user;

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const roleFilter = url.searchParams.get('role') || 'all';
    const statusFilter = url.searchParams.get('status') || 'all';

    // Build where clause for filtering
    const whereClause: any = {
      adminProfile: {
        isNot: null
      }
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add role filter
    if (roleFilter !== 'all') {
      // Map frontend role to schema enum
      const schemaRole = roleFilter === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'CONTENT_MOD';
      whereClause.adminProfile = {
        ...whereClause.adminProfile,
        adminRole: schemaRole
      };
    }

    // Add status filter
    if (statusFilter !== 'all') {
      whereClause.status = statusFilter === 'active' ? 'ACTIVE' : 'INACTIVE';
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause
    });

    // Fetch admin users with pagination
    const adminUsers = await prisma.user.findMany({
      where: whereClause,
      include: {
        adminProfile: {
          select: {
            id: true,
            adminRole: true,
            permissions: true,
            lastLoginAt: true,
            createdAt: true,
            twoFactorEnabled: true
          }
        }
      },
      orderBy: [
        { adminProfile: { adminRole: 'asc' } }, // SUPER_ADMIN first
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    // Transform data for frontend
    const transformedAdmins = adminUsers.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.adminProfile?.adminRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN', // Map back to frontend
      isActive: user.status === 'ACTIVE',
      emailVerified: !!user.emailVerified,
      mustChangePassword: false, // Not in schema, default to false
      lastLoginAt: user.adminProfile?.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      twoFactorEnabled: user.adminProfile?.twoFactorEnabled || false,
      permissions: user.adminProfile?.permissions || []
    }));

    // Log successful admin list access
    await logAdminAction(
      currentAdmin.id,
      'SYSTEM_MAINTENANCE', // Use existing AdminAction enum value
      {
        totalAdmins: totalCount,
        filters: { search, roleFilter, statusFilter },
        accessedBy: currentAdmin.email,
        timestamp: new Date().toISOString()
      },
      request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({
      success: true,
      admins: transformedAdmins,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters: {
        search,
        role: roleFilter,
        status: statusFilter
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching admin users:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch admin users',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}