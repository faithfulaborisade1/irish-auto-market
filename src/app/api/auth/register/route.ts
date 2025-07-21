// src/app/api/auth/register/route.ts - IMPROVED WITH MINOR FIXES
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail, sendAdminNotification } from '@/lib/email';
import { UserRole, UserStatus } from '@prisma/client'; // Import Prisma enums

export async function POST(request: NextRequest) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      userType,
      businessName,
      agreeToTerms,
      marketingConsent
    } = await request.json();

    // Enhanced validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Enhanced password validation
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!agreeToTerms) {
      return NextResponse.json(
        { success: false, message: 'You must agree to the terms and conditions' },
        { status: 400 }
      );
    }

    if (userType === 'dealer' && !businessName) {
      return NextResponse.json(
        { success: false, message: 'Business name is required for dealer accounts' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // Increased from 10 to 12 for better security

    // Create user with proper Prisma enums
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || undefined, // Use undefined instead of null for optional fields
        password: hashedPassword,
        role: userType === 'dealer' ? UserRole.DEALER : UserRole.USER, // Use Prisma enum
        status: UserStatus.ACTIVE // Use Prisma enum
      }
    });

    // Create dealer profile if needed
    let dealerProfile = null;
    if (userType === 'dealer' && businessName) {
      dealerProfile = await prisma.dealerProfile.create({
        data: {
          userId: newUser.id,
          businessName: businessName.trim(),
          verified: false
        }
      });
    }

    console.log(`✅ User created: ${newUser.email} (${newUser.role})`);

    // ============================================================================
    // EMAIL NOTIFICATIONS
    // ============================================================================

    // Send welcome email to user (non-blocking)
    sendWelcomeEmail({
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role
    }).then(emailResult => {
      if (emailResult.success) {
        console.log(`✅ Welcome email sent to ${newUser.email}`);
      } else {
        console.error(`❌ Failed to send welcome email:`, emailResult.error);
      }
    }).catch(emailError => {
      console.error('❌ Welcome email error:', emailError);
    });

    // Send admin notification (non-blocking)
    const notificationType = userType === 'dealer' ? 'new_dealer' : 'new_user';
    const notificationData = userType === 'dealer' 
      ? {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: phone || 'Not provided',
          businessName: businessName,
          userId: newUser.id
        }
      : {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          userId: newUser.id
        };

    sendAdminNotification({
      type: notificationType,
      data: notificationData
    }).then(adminNotification => {
      if (adminNotification.success) {
        console.log(`✅ Admin notification sent for ${notificationType}`);
      } else {
        console.error(`❌ Failed to send admin notification:`, adminNotification.error);
      }
    }).catch(adminEmailError => {
      console.error('❌ Admin notification error:', adminEmailError);
    });

    // Create admin notification in database (if admins exist)
    try {
      const adminProfiles = await prisma.adminProfile.findMany({
        where: { isActive: true },
        select: { userId: true }
      });

      if (adminProfiles.length > 0) {
        const notifications = adminProfiles.map(admin => ({
          userId: admin.userId,
          type: 'SYSTEM_UPDATE' as const, // Using existing enum value
          title: userType === 'dealer' ? `New Dealer Registration` : `New User Registration`,
          message: `${newUser.firstName} ${newUser.lastName} registered as ${userType}`,
          metadata: {
            userId: newUser.id,
            email: newUser.email,
            userType: userType,
            businessName: businessName || undefined
          }
        }));

        await prisma.notification.createMany({
          data: notifications
        });

        console.log(`🔔 Created ${notifications.length} admin notifications`);
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to create admin notifications:', notificationError);
      // Don't fail registration if notifications fail
    }

    // ============================================================================
    // SUCCESS RESPONSE
    // ============================================================================

    return NextResponse.json({
      success: true,
      message: userType === 'dealer' 
        ? 'Dealer account created successfully! Please check your email for welcome instructions and verification details.'
        : 'Account created successfully! Please check your email for welcome instructions.',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        dealerProfile: dealerProfile ? {
          id: dealerProfile.id,
          businessName: dealerProfile.businessName,
          verified: dealerProfile.verified
        } : null
      }
    });

  } catch (error: any) {
    console.error('❌ Registration error:', error);
    
    // Enhanced error handling
    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    if (error.code === 'P2003') {
      // Foreign key constraint violation
      return NextResponse.json(
        { success: false, message: 'Invalid data provided' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Registration failed. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// EMAIL TEST ENDPOINT (Development only)
// ============================================================================

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, message: 'Not available in production' },
      { status: 404 }
    );
  }

  try {
    console.log('🧪 Testing registration emails...');

    // Test user welcome email
    const userEmailResult = await sendWelcomeEmail({
      email: 'test.user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER'
    });

    // Test dealer welcome email
    const dealerEmailResult = await sendWelcomeEmail({
      email: 'test.dealer@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'DEALER'
    });

    // Test admin notification
    const adminNotificationResult = await sendAdminNotification({
      type: 'new_user',
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test.user@example.com',
        role: 'USER',
        userId: 'test-user-id'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email tests completed',
      results: {
        userWelcome: userEmailResult,
        dealerWelcome: dealerEmailResult,
        adminNotification: adminNotificationResult
      }
    });

  } catch (error: any) {
    console.error('❌ Email test error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}