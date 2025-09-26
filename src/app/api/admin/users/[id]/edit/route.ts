// src/app/api/admin/users/[id]/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// Comprehensive validation schema for user editing
const EditUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  role: z.enum(['USER', 'DEALER', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_MOD', 'FINANCE_ADMIN', 'SUPPORT_ADMIN']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']),
  emailVerified: z.boolean(),
  dealerProfile: z.object({
    businessName: z.string().min(1),
    description: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    subscriptionType: z.string(),
    verified: z.boolean()
  }).optional(),
  adminProfile: z.object({
    title: z.string().optional(),
    department: z.string().optional(),
    adminRole: z.string()
  }).optional()
});

// Helper function to verify admin authentication
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
      include: { adminProfile: true }
    });

    if (!adminUser || !adminUser.adminProfile) {
      return { error: 'Admin user not found', status: 401 };
    }

    if (adminUser.status !== 'ACTIVE') {
      return { error: 'Admin account is disabled', status: 403 };
    }

    // Only SUPER_ADMIN can edit users
    if (adminUser.adminProfile.adminRole !== 'SUPER_ADMIN') {
      return { error: 'Only Super Admins can edit users', status: 403 };
    }

    return { user: adminUser, adminProfile: adminUser.adminProfile };

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
        action: action as any,
        resourceType: 'USER' as any,
        resourceId: details.targetUserId || null,
        ipAddress: ip || 'unknown',
        severity: 'INFO',
        description: `${action}: ${details.reason || 'User edit action'}`,
        oldValues: details.oldValues || {},
        newValues: details.newValues || {},
        userAgent: undefined,
        endpoint: '/api/admin/users/[id]/edit',
        tags: undefined
      }
    });
  } catch (error: any) {
    console.log('📝 Audit logging failed (non-critical):', error.message);
  }
}

// PUT /api/admin/users/[id]/edit - Comprehensive user editing
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`✏️ PUT /api/admin/users/${params.id}/edit - Comprehensive user editing`);

    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const currentAdmin = authResult.user;
    const userId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = EditUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid user data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const userData = validationResult.data;

    // Get current user data for comparison
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dealerProfile: true,
        adminProfile: true
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for email uniqueness if email is changing
    if (userData.email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email address is already in use' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone || null,
      bio: userData.bio || null,
      role: userData.role,
      status: userData.status,
      emailVerified: userData.emailVerified ? new Date() : null,
      updatedAt: new Date()
    };

    // Use transaction to update user and related profiles
    await prisma.$transaction(async (tx) => {
      // Update main user record
      await tx.user.update({
        where: { id: userId },
        data: updateData
      });

      // Handle dealer profile
      if (userData.role === 'DEALER') {
        if (userData.dealerProfile) {
          if (currentUser.dealerProfile) {
            // Update existing dealer profile
            await tx.dealerProfile.update({
              where: { userId: userId },
              data: {
                businessName: userData.dealerProfile.businessName,
                description: userData.dealerProfile.description || null,
                website: userData.dealerProfile.website || null,
                subscriptionType: userData.dealerProfile.subscriptionType as any,
                verified: userData.dealerProfile.verified,
                updatedAt: new Date()
              }
            });
          } else {
            // Create new dealer profile
            await tx.dealerProfile.create({
              data: {
                userId: userId,
                businessName: userData.dealerProfile.businessName,
                description: userData.dealerProfile.description || null,
                website: userData.dealerProfile.website || null,
                subscriptionType: userData.dealerProfile.subscriptionType as any,
                verified: userData.dealerProfile.verified
              }
            });
          }
        }
      } else {
        // If user is no longer a dealer, delete dealer profile
        if (currentUser.dealerProfile) {
          await tx.dealerProfile.delete({
            where: { userId: userId }
          });
        }
      }

      // Handle admin profile
      const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'CONTENT_MOD', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(userData.role);

      if (isAdminRole) {
        if (userData.adminProfile) {
          if (currentUser.adminProfile) {
            // Update existing admin profile
            await tx.adminProfile.update({
              where: { userId: userId },
              data: {
                title: userData.adminProfile.title || null,
                department: userData.adminProfile.department || null,
                adminRole: userData.role as any,
                updatedAt: new Date()
              }
            });
          } else {
            // Create new admin profile
            await tx.adminProfile.create({
              data: {
                userId: userId,
                adminRole: userData.role as any,
                title: userData.adminProfile.title || null,
                department: userData.adminProfile.department || null,
                permissions: ['READ'] // Default permissions
              }
            });
          }
        }
      } else {
        // If user is no longer an admin, delete admin profile
        if (currentUser.adminProfile) {
          await tx.adminProfile.delete({
            where: { userId: userId }
          });
        }
      }
    });

    // Log the update
    if (currentAdmin.adminProfile) {
      await logAdminAction(
        currentAdmin.adminProfile.id,
        'USER_UPDATED',
        {
          targetUserId: userId,
          targetEmail: currentUser.email,
          updatedBy: currentAdmin.email,
          oldValues: {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
            phone: currentUser.phone,
            role: currentUser.role,
            status: currentUser.status,
            emailVerified: !!currentUser.emailVerified
          },
          newValues: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            status: userData.status,
            emailVerified: userData.emailVerified
          },
          reason: 'Comprehensive user edit via admin panel'
        },
        request.headers.get('x-forwarded-for') || 'unknown'
      );
    }

    // Fetch and return updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dealerProfile: true,
        adminProfile: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        firstName: updatedUser!.firstName,
        lastName: updatedUser!.lastName,
        phone: updatedUser!.phone,
        bio: updatedUser!.bio,
        role: updatedUser!.role,
        status: updatedUser!.status,
        emailVerified: !!updatedUser!.emailVerified,
        dealerProfile: updatedUser!.dealerProfile,
        adminProfile: updatedUser!.adminProfile,
        updatedAt: updatedUser!.updatedAt
      }
    });

  } catch (error: any) {
    console.error('❌ Error updating user:', error);

    return NextResponse.json(
      {
        error: 'Failed to update user',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}