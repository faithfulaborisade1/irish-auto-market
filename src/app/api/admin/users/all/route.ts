// src/app/api/admin/users/all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for getting users
const GetUsersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  search: z.string().optional(),
  userType: z.enum(['all', 'regular', 'dealers', 'admins']).default('all'),
  role: z.enum(['all', 'USER', 'DEALER', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_MOD', 'FINANCE_ADMIN', 'SUPPORT_ADMIN']).optional(),
  status: z.enum(['all', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).default('all')
});

// Helper function to verify admin authentication and permissions
async function verifyAdminAuth(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin-token')?.value || 
                      request.cookies.get('auth-token')?.value;

    if (!adminToken) {
      return { error: 'No admin token provided', status: 401 };
    }

    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET!) as any;
    
    if (!decoded?.userId) {
      return { error: 'Invalid token format', status: 401 };
    }

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

    // Only SUPER_ADMIN can view all users (for now)
    if (adminUser.adminProfile.adminRole !== 'SUPER_ADMIN') {
      return { error: 'Only Super Admins can view all users', status: 403 };
    }

    return { 
      user: adminUser, 
      adminProfile: adminUser.adminProfile
    };

  } catch (error: any) {
    console.error('Admin auth verification error:', error);
    return { error: 'Token verification failed', status: 401 };
  }
}

// Helper function to log admin actions
async function logAdminAction(adminId: string, action: string, details: any, ip?: string) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'SYSTEM_MAINTENANCE' as any, // Use existing enum value
        resourceType: 'USER' as any,
        resourceId: null,
        ipAddress: ip || 'unknown',
        severity: 'INFO' as any,
        description: `${action}: Accessed user list with ${details.totalUsers || 0} users`,
        oldValues: undefined,
        newValues: details,
        userAgent: undefined,
        endpoint: '/api/admin/users/all',
        tags: undefined
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// GET /api/admin/users/all - Get all users with filtering
export async function GET(request: NextRequest) {
  try {
    console.log('👥 GET /api/admin/users/all - Fetching all users');

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
    const userType = url.searchParams.get('userType') || 'all';
    const roleFilter = url.searchParams.get('role') || 'all';
    const statusFilter = url.searchParams.get('status') || 'all';

    // Build where clause for filtering
    const whereClause: any = {};

    // Add search filter (name, email, business name)
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { 
          dealerProfile: {
            businessName: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Add user type filter
    if (userType !== 'all') {
      switch (userType) {
        case 'regular':
          whereClause.role = 'USER';
          break;
        case 'dealers':
          whereClause.role = 'DEALER';
          break;
        case 'admins':
          whereClause.role = {
            in: ['ADMIN', 'SUPER_ADMIN', 'CONTENT_MOD', 'FINANCE_ADMIN', 'SUPPORT_ADMIN']
          };
          break;
      }
    }

    // Add specific role filter
    if (roleFilter !== 'all') {
      whereClause.role = roleFilter;
    }

    // Add status filter
    if (statusFilter !== 'all') {
      whereClause.status = statusFilter;
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause
    });

    // Fetch users with all related data
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        dealerProfile: {
          select: {
            businessName: true,
            verified: true,
            subscriptionType: true,
            subscriptionExpires: true,
            description: true,
            logo: true,
            website: true
          }
        },
        adminProfile: {
          select: {
            adminRole: true,
            permissions: true,
            twoFactorEnabled: true,
            lastLoginAt: true,
            title: true,
            department: true
          }
        },
        // Get user statistics
        cars: {
          select: {
            id: true,
            status: true
          }
        },
        sentMessages: {
          select: {
            id: true
          }
        },
        // Get revenue data for dealers
        revenueRecords: {
          select: {
            amount: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // Admins first, then dealers, then users
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    // Transform data for frontend
    const transformedUsers = users.map(user => {
      // Calculate user statistics
      const activeCarsCount = user.cars?.filter(car => car.status === 'ACTIVE').length || 0;
      const totalCarsCount = user.cars?.length || 0;
      const messagesCount = user.sentMessages?.length || 0;
      const totalSpent = user.revenueRecords?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;

      // Build user object
      const userData: any = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name || `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        role: user.role,
        status: user.status,
        emailVerified: !!user.emailVerified,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        avatar: user.avatar,
        
        // User statistics
        carsCount: totalCarsCount,
        activeCarsCount: activeCarsCount,
        messagesCount: messagesCount
      };

      // Add total spent only if > 0
      if (totalSpent > 0) {
        userData.totalSpent = totalSpent;
      }

      // Add dealer-specific data
      if (user.dealerProfile) {
        userData.dealerProfile = {
          businessName: user.dealerProfile.businessName,
          verified: user.dealerProfile.verified,
          subscriptionType: user.dealerProfile.subscriptionType,
          subscriptionExpires: user.dealerProfile.subscriptionExpires?.toISOString() || null,
          description: user.dealerProfile.description,
          logo: user.dealerProfile.logo,
          website: user.dealerProfile.website
        };
      }

      // Add admin-specific data
      if (user.adminProfile) {
        userData.adminProfile = {
          adminRole: user.adminProfile.adminRole,
          permissions: user.adminProfile.permissions || [],
          twoFactorEnabled: user.adminProfile.twoFactorEnabled,
          lastLoginAt: user.adminProfile.lastLoginAt?.toISOString() || null,
          title: user.adminProfile.title,
          department: user.adminProfile.department
        };
      }

      return userData;
    });

    // Calculate summary statistics
    const userStats = {
      totalUsers: totalCount,
      regularUsers: users.filter(u => u.role === 'USER').length,
      dealers: users.filter(u => u.role === 'DEALER').length,
      admins: users.filter(u => ['ADMIN', 'SUPER_ADMIN', 'CONTENT_MOD', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(u.role)).length,
      activeUsers: users.filter(u => u.status === 'ACTIVE').length,
      pendingUsers: users.filter(u => u.status === 'PENDING_VERIFICATION').length,
      suspendedUsers: users.filter(u => u.status === 'SUSPENDED').length
    };

    // Log successful access
    await logAdminAction(
      currentAdmin.id,
      'USER_LIST_ACCESSED',
      {
        totalUsers: totalCount,
        filters: { search, userType, roleFilter, statusFilter },
        accessedBy: currentAdmin.email,
        userStats
      },
      request.headers.get('x-forwarded-for') || 'unknown'
    );

    console.log(`✅ Retrieved ${transformedUsers.length} users (${totalCount} total)`);

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      statistics: userStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      filters: {
        search,
        userType,
        role: roleFilter,
        status: statusFilter
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching users:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Additional user management endpoints

// PUT /api/admin/users/all - Bulk user operations (future)
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const body = await request.json();
    const { action, userIds, data } = body;

    // TODO: Implement bulk operations
    // - Bulk status updates
    // - Bulk user deletion
    // - Bulk dealer verification
    // - Export user data

    return NextResponse.json({
      success: true,
      message: 'Bulk operations not implemented yet',
      action,
      affectedUsers: userIds?.length || 0
    });

  } catch (error: any) {
    console.error('❌ Error in bulk user operation:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform bulk operation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}