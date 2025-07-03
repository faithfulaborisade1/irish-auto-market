// src/app/api/admin/users/[id]/verify-dealer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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

    // Only SUPER_ADMIN can verify dealers
    if (adminUser.adminProfile.adminRole !== 'SUPER_ADMIN') {
      return { error: 'Only Super Admins can verify dealers', status: 403 };
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
        resourceType: 'DEALER_PROFILE' as any,
        resourceId: details.targetUserId || null,
        ipAddress: ip || 'unknown',
        severity: 'INFO' as any,
        description: `${action}: Dealer verification for ${details.businessName}`,
        oldValues: undefined,
        newValues: details,
        userAgent: undefined,
        endpoint: '/api/admin/users/[id]/verify-dealer',
        tags: undefined
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// ⚠️ MOCK EMAIL FUNCTION - Replace with real email service later
async function sendDealerVerificationEmail(email: string, businessName: string, dealerName: string): Promise<{success: boolean, message: string}> {
  // 🚧 MOCK IMPLEMENTATION - Will replace with real email service
  console.log(`📧 MOCK DEALER VERIFICATION EMAIL SENT to ${email}:`);
  console.log(`Business Name: ${businessName}`);
  console.log(`Dealer Name: ${dealerName}`);
  console.log(`Subject: Irish Auto Market - Dealer Account Verified`);
  console.log(`Message: Congratulations! Your dealer account has been verified and is now active.`);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    success: true,
    message: 'Dealer verification email sent successfully (mock)'
  };
}

// POST /api/admin/users/[id]/verify-dealer - Verify dealer account
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`✅ POST /api/admin/users/${params.id}/verify-dealer - Verifying dealer`);

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

    // Get the user and dealer profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dealerProfile: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'DEALER') {
      return NextResponse.json(
        { error: 'User is not a dealer' },
        { status: 400 }
      );
    }

    if (!user.dealerProfile) {
      return NextResponse.json(
        { error: 'Dealer profile not found' },
        { status: 400 }
      );
    }

    if (user.dealerProfile.verified) {
      return NextResponse.json(
        { error: 'Dealer is already verified' },
        { status: 400 }
      );
    }

    // Update dealer profile to verified
    const updatedDealerProfile = await prisma.dealerProfile.update({
      where: { userId: userId },
      data: {
        verified: true,
        verifiedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Declare updatedUser with proper typing
    let updatedUser = user;

    // Update user status to ACTIVE if it was PENDING_VERIFICATION
    if (user.status === 'PENDING_VERIFICATION') {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'ACTIVE',
          updatedAt: new Date()
        },
        include: {
          dealerProfile: true // Include dealerProfile in the response
        }
      });
    }

    // Send verification email (mock for now)
    const emailResult = await sendDealerVerificationEmail(
      user.email,
      user.dealerProfile.businessName,
      `${user.firstName} ${user.lastName}`
    );

    // Log successful verification
    await logAdminAction(
      currentAdmin.id,
      'USER_VERIFIED', // Using existing enum value
      {
        targetUserId: userId,
        targetEmail: user.email,
        businessName: user.dealerProfile.businessName,
        verifiedBy: currentAdmin.email,
        emailSent: emailResult.success,
        previousStatus: user.status,
        newStatus: updatedUser.status
      },
      request.headers.get('x-forwarded-for') || 'unknown'
    );

    console.log(`✅ Dealer verified successfully: ${user.dealerProfile.businessName}`);

    return NextResponse.json({
      success: true,
      message: 'Dealer verified successfully',
      dealer: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        status: updatedUser.status,
        dealerProfile: {
          businessName: updatedUser.dealerProfile?.businessName || user.dealerProfile.businessName,
          verified: updatedDealerProfile.verified,
          verifiedAt: updatedDealerProfile.verifiedAt,
          subscriptionType: updatedUser.dealerProfile?.subscriptionType || user.dealerProfile.subscriptionType
        }
      },
      emailSent: emailResult.success,
      emailMessage: emailResult.message
    });

  } catch (error: any) {
    console.error('❌ Error verifying dealer:', error);

    // Log error
    try {
      const authResult = await verifyAdminAuth(request);
      if (authResult.user) {
        await logAdminAction(
          authResult.user.id,
          'USER_VERIFIED', // Using existing enum for error case
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
        error: 'Failed to verify dealer',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );

  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/admin/users/[id]/verify-dealer - Update dealer verification status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔄 PUT /api/admin/users/${params.id}/verify-dealer - Updating dealer verification`);

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

    // Parse request body
    const body = await request.json();
    const { verified, reason } = body;

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Verified status must be a boolean' },
        { status: 400 }
      );
    }

    // Get the user and dealer profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dealerProfile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'DEALER' || !user.dealerProfile) {
      return NextResponse.json({ error: 'User is not a dealer' }, { status: 400 });
    }

    const wasVerified = user.dealerProfile.verified;

    // Update dealer verification status
    const updatedDealerProfile = await prisma.dealerProfile.update({
      where: { userId: userId },
      data: {
        verified: verified,
        verifiedAt: verified ? new Date() : null,
        updatedAt: new Date()
      }
    });

    // Update user status based on verification
    let newUserStatus = user.status;
    if (verified && user.status === 'PENDING_VERIFICATION') {
      newUserStatus = 'ACTIVE';
    } else if (!verified && user.status === 'ACTIVE') {
      newUserStatus = 'PENDING_VERIFICATION';
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: newUserStatus,
        updatedAt: new Date()
      }
    });

    // Send appropriate email
    if (verified && !wasVerified) {
      await sendDealerVerificationEmail(
        user.email,
        user.dealerProfile.businessName,
        `${user.firstName} ${user.lastName}`
      );
    }

    // Log action
    await logAdminAction(
      currentAdmin.id,
      verified ? 'USER_VERIFIED' : 'USER_SUSPENDED',
      {
        targetUserId: userId,
        targetEmail: user.email,
        businessName: user.dealerProfile.businessName,
        verified: verified,
        wasVerified: wasVerified,
        reason: reason || 'No reason provided',
        updatedBy: currentAdmin.email,
        oldStatus: user.status,
        newStatus: newUserStatus
      },
      request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({
      success: true,
      message: `Dealer ${verified ? 'verified' : 'unverified'} successfully`,
      dealer: {
        id: updatedUser.id,
        email: updatedUser.email,
        status: updatedUser.status,
        dealerProfile: {
          businessName: updatedDealerProfile.businessName,
          verified: updatedDealerProfile.verified,
          verifiedAt: updatedDealerProfile.verifiedAt
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error updating dealer verification:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update dealer verification',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}