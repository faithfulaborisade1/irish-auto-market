// src/app/api/admin/users/create-admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Validation schema for creating admin
const CreateAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name required').max(50, 'Last name too long'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN'], {
    errorMap: () => ({ message: 'Role must be SUPER_ADMIN or ADMIN' })
  })
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

    if (!adminUser || !adminUser.adminProfile) {
      return { error: 'Admin user not found', status: 401 };
    }

    if (adminUser.status !== 'ACTIVE') {
      return { error: 'Admin account is disabled', status: 403 };
    }

    // Only SUPER_ADMIN can create other admins
    if (adminUser.adminProfile.adminRole !== 'SUPER_ADMIN') {
      return { error: 'Only Super Admins can create other admins', status: 403 };
    }

    return { user: adminUser, adminProfile: adminUser.adminProfile };

  } catch (error: any) {
    console.error('Admin auth verification error:', error);
    return { error: 'Token verification failed', status: 401 };
  }
}

// Helper function to generate secure temporary password
function generateTemporaryPassword(): string {
  // Generate a secure 12-character password with mixed case, numbers, and symbols
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const all = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill remaining characters randomly
  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Helper function to generate email verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ⚠️ MOCK EMAIL FUNCTION - Replace with real email service later
async function sendVerificationEmail(email: string, token: string, tempPassword: string): Promise<{success: boolean, message: string}> {
  // 🚧 MOCK IMPLEMENTATION - Will replace with real email service
  console.log(`📧 MOCK EMAIL SENT to ${email}:`);
  console.log(`Verification Token: ${token}`);
  console.log(`Temporary Password: ${tempPassword}`);
  console.log(`Verification URL: ${process.env.NEXTAUTH_URL}/admin/verify-email?token=${token}`);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    success: true,
    message: 'Verification email sent successfully (mock)'
  };
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
        severity: details.reason === 'Server error' ? 'ERROR' as any : 'INFO' as any,
        description: `${action}: ${JSON.stringify(details)}`,
        oldValues: null,
        newValues: details
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// POST /api/admin/users/create-admin - Create new admin user
export async function POST(request: NextRequest) {
  try {
    console.log('👤 POST /api/admin/users/create-admin - Creating new admin');

    // Verify admin authentication and permissions
    const authResult = await verifyAdminAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const currentAdmin = authResult.user;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateAdminSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      await logAdminAction(
        currentAdmin.id,
        'ADMIN_CREATE_FAILED',
        {
          reason: 'Validation failed',
          errors: errorMessages,
          attemptedEmail: body.email
        },
        request.headers.get('x-forwarded-for') || 'unknown'
      );

      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: errorMessages 
        },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, role } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      await logAdminAction(
        currentAdmin.id,
        'ADMIN_CREATE_FAILED',
        {
          reason: 'Email already exists',
          attemptedEmail: email
        },
        request.headers.get('x-forwarded-for') || 'unknown'
      );

      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate secure temporary password and verification token
    const temporaryPassword = generateTemporaryPassword();
    const verificationToken = generateVerificationToken();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    // Create user and admin profile in transaction
    const newAdmin = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          firstName,
          lastName,
          password: hashedPassword,
          role: 'ADMIN', // Base role for all admins
          status: 'ACTIVE',
          emailVerified: false,
          mustChangePassword: true,
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      });

      // Create admin profile
      const adminProfile = await tx.adminProfile.create({
        data: {
          userId: user.id,
          adminRole: role,
          permissions: [], // Empty array for now
          twoFactorEnabled: false,
          ipRestrictions: [], // Empty array for now
          mustChangePassword: true
        }
      });

      return { user, adminProfile };
    });

    // Send verification email (mock for now)
    const emailResult = await sendVerificationEmail(
      email,
      verificationToken,
      temporaryPassword
    );

    // Log successful admin creation
    await logAdminAction(
      currentAdmin.id,
      'ADMIN_CREATED',
      {
        newAdminId: newAdmin.user.id,
        newAdminEmail: email,
        newAdminRole: role,
        emailSent: emailResult.success,
        createdBy: currentAdmin.email
      },
      request.headers.get('x-forwarded-for') || 'unknown'
    );

    console.log(`✅ Admin created successfully: ${email} (${role})`);

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: newAdmin.user.id,
        email: newAdmin.user.email,
        firstName: newAdmin.user.firstName,
        lastName: newAdmin.user.lastName,
        role: newAdmin.adminProfile.adminRole,
        createdAt: newAdmin.user.createdAt
      },
      temporaryPassword: temporaryPassword, // Send in response for now
      emailSent: emailResult.success,
      emailMessage: emailResult.message
    });

  } catch (error: any) {
    console.error('❌ Error creating admin:', error);

    // Log failed admin creation
    try {
      const authResult = await verifyAdminAuth(request);
      if (authResult.user) {
        await logAdminAction(
          authResult.user.id,
          'ADMIN_CREATE_FAILED',
          {
            success: false,
            reason: 'Server error',
            error: error.message
          },
          request.headers.get('x-forwarded-for') || 'unknown'
        );
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to create admin user',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );

  } finally {
    await prisma.$disconnect();
  }
}