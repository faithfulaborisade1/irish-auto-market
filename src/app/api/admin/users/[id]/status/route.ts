// src/app/api/admin/users/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for status update
const UpdateStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().optional()
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
    
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        adminProfile: true
      }
    });

    if (!adminUser || !adminUser.adminProfile) {
      return { error: 'Admin user not found', status: 401 };
    }

    if (adminUser.status !== 'ACTIVE') {
      return { error: 'Admin account is disabled', status: 403 };
    }

    // Only SUPER_ADMIN can manage other admins
    if (adminUser.adminProfile.adminRole !== 'SUPER_ADMIN') {
      return { error: 'Only Super Admins can manage admin accounts', status: 403 };
    }

    return { user: adminUser, adminProfile: adminUser.adminProfile };

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
        severity: details.reason === 'Server error' ? 'ERROR' : 'INFO', // Maps to LogSeverity enum
        description: `${action}: ${details.reason || 'Admin status updated'}`,
        oldValues: details.oldStatus ? { status: details.oldStatus } : undefined, // Optional JSON field
        newValues: details, // Required field in your schema
        userAgent: undefined, // Optional field
        endpoint: '/api/admin/users/[id]/status',
        tags: undefined // Optional JSON field
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't fail the main operation if logging fails
  }
}

// PUT /api/admin/users/[id]/status - Update admin user status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔄 PUT /api/admin/users/${params.id}/status - Updating admin status`);

    // Verify admin authentication and permissions
    const authResult = await verifyAdminAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const currentAdmin = authResult.user;
    const targetUserId = params.id;

    // Validate request body
    const body = await request.json();
    const validationResult = UpdateStatusSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      return NextResponse.json(
        { error: 'Validation failed', details: errorMessages },
        { status: 400 }
      );
    }

    const { isActive, reason } = validationResult.data;

    // Find the target admin user
    const targetAdmin = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        adminProfile: true
      }
    });

    if (!targetAdmin) {
      await logAdminAction(
        currentAdmin.id,
        'ADMIN_STATUS_UPDATE_FAILED',
        {
          reason: 'Target admin not found',
          targetUserId
        },
        request.headers.get('x-forwarded-for') || 'unknown'
      );

      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    if (!targetAdmin.adminProfile) {
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 400 }
      );
    }

    // Prevent admin from disabling themselves
    if (targetUserId === currentAdmin.id) {
      await logAdminAction(
        currentAdmin.id,
        'ADMIN_STATUS_UPDATE_FAILED',
        {
          reason: 'Cannot disable own account',
          targetUserId
        },
        request.headers.get('x-forwarded-for') || 'unknown'
      );

      return NextResponse.json(
        { error: 'Cannot disable your own admin account' },
        { status: 400 }
      );
    }

    // Prevent disabling the last SUPER_ADMIN
    if (!isActive && targetAdmin.adminProfile.adminRole === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.adminProfile.count({
        where: {
          adminRole: 'SUPER_ADMIN',
          user: {
            status: 'ACTIVE'
          }
        }
      });

      if (superAdminCount <= 1) {
        await logAdminAction(
          currentAdmin.id,
          'ADMIN_STATUS_UPDATE_FAILED',
          {
            reason: 'Cannot disable last SUPER_ADMIN',
            targetUserId
          },
          request.headers.get('x-forwarded-for') || 'unknown'
        );

        return NextResponse.json(
          { error: 'Cannot disable the last Super Admin account' },
          { status: 400 }
        );
      }
    }

    // Update admin status
    const newStatus = isActive ? 'ACTIVE' : 'INACTIVE';
    const updatedAdmin = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        status: newStatus,
        updatedAt: new Date()
      },
      include: {
        adminProfile: {
          select: {
            adminRole: true,
            lastLoginAt: true
          }
        }
      }
    });

    // Log successful status update
    await logAdminAction(
      currentAdmin.id,
      isActive ? 'USER_VERIFIED' : 'USER_SUSPENDED', // Use existing AdminAction enum values
      {
        targetUserId,
        targetEmail: targetAdmin.email,
        targetRole: targetAdmin.adminProfile.adminRole,
        newStatus,
        oldStatus: targetAdmin.status,
        reason: reason || 'No reason provided',
        updatedBy: currentAdmin.email
      },
      request.headers.get('x-forwarded-for') || 'unknown'
    );

    console.log(`✅ Admin status updated: ${targetAdmin.email} → ${newStatus}`);

    return NextResponse.json({
      success: true,
      message: `Admin account ${isActive ? 'enabled' : 'disabled'} successfully`,
      admin: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName,
        role: updatedAdmin.adminProfile?.adminRole,
        isActive: updatedAdmin.status === 'ACTIVE',
        updatedAt: updatedAdmin.updatedAt
      }
    });

  } catch (error: any) {
    console.error('❌ Error updating admin status:', error);

    // Log error
    try {
      const authResult = await verifyAdminAuth(request);
      if (authResult.user) {
        await logAdminAction(
          authResult.user.id,
          'ADMIN_STATUS_UPDATE_FAILED',
          {
            reason: 'Server error',
            error: error.message,
            targetUserId: params.id
          },
          request.headers.get('x-forwarded-for') || 'unknown'
        );
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to update admin status',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );

  } finally {
    await prisma.$disconnect();
  }
}