// src/app/api/admin/users/[id]/force-password-reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

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

    // Only SUPER_ADMIN can force password resets
    if (adminUser.adminProfile.adminRole !== 'SUPER_ADMIN') {
      return { error: 'Only Super Admins can force password resets', status: 403 };
    }

    return { user: adminUser, adminProfile: adminUser.adminProfile };

  } catch (error: any) {
    console.error('Admin auth verification error:', error);
    return { error: 'Token verification failed', status: 401 };
  }
}

// Helper function to generate password reset token
function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ⚠️ MOCK EMAIL FUNCTION - Replace with real email service later
async function sendPasswordResetEmail(email: string, resetToken: string, adminName: string): Promise<{success: boolean, message: string}> {
  // 🚧 MOCK IMPLEMENTATION - Will replace with real email service
  console.log(`📧 MOCK PASSWORD RESET EMAIL SENT to ${email}:`);
  console.log(`Admin Name: ${adminName}`);
  console.log(`Reset Token: ${resetToken}`);
  console.log(`Reset URL: ${process.env.NEXTAUTH_URL}/admin/reset-password?token=${resetToken}`);
  console.log(`Email Subject: Irish Auto Market - Admin Password Reset Required`);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  return {
    success: true,
    message: 'Password reset email sent successfully (mock)'
  };
}

// Helper function to log admin actions - FIXED FOR PRISMA JSON NULLS
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
        description: `${action}: ${details.reason || 'Password reset forced'}`,
        oldValues: undefined, // Use undefined instead of null for optional JSON fields
        newValues: details, // Required field in your schema
        userAgent: undefined, // Use undefined for optional fields
        endpoint: '/api/admin/users/[id]/force-password-reset',
        tags: undefined // Use undefined instead of null for optional JSON fields
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't fail the main operation if logging fails
  }
}

// POST /api/admin/users/[id]/force-password-reset - Force password reset for admin
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔑 POST /api/admin/users/${params.id}/force-password-reset - Forcing password reset`);

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
        'PASSWORD_RESET_FAILED',
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

    if (targetAdmin.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot reset password for disabled admin account' },
        { status: 400 }
      );
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken();
    const resetTokenExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    // Update user - simplified since your schema doesn't have password reset fields
    const updatedAdmin = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        updatedAt: new Date()
        // Note: In a real implementation, you'd store reset token in a separate table
        // or add passwordResetToken/passwordResetExpiry fields to your User model
      }
    });

    // Send password reset email (mock for now)
    const emailResult = await sendPasswordResetEmail(
      targetAdmin.email,
      resetToken,
      `${targetAdmin.firstName} ${targetAdmin.lastName}`
    );

    // Log successful password reset initiation
    await logAdminAction(
      currentAdmin.id,
      'USER_PASSWORD_RESET',
      {
        targetUserId,
        targetEmail: targetAdmin.email,
        targetRole: targetAdmin.adminProfile.adminRole,
        resetTokenGenerated: true,
        emailSent: emailResult.success,
        expiresAt: resetTokenExpiry.toISOString(),
        initiatedBy: currentAdmin.email
      },
      request.headers.get('x-forwarded-for') || 'unknown'
    );

    console.log(`✅ Password reset forced for admin: ${targetAdmin.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset initiated successfully',
      admin: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName,
        mustChangePassword: true // Always true for password reset (frontend display only)
      },
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined, // Only show in dev
      emailSent: emailResult.success,
      emailMessage: emailResult.message,
      expiresAt: resetTokenExpiry.toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error forcing password reset:', error);

    // Log error
    try {
      const authResult = await verifyAdminAuth(request);
      if (authResult.user) {
        await logAdminAction(
          authResult.user.id,
          'PASSWORD_RESET_FAILED',
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
        error: 'Failed to initiate password reset',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );

  } finally {
    await prisma.$disconnect();
  }
}