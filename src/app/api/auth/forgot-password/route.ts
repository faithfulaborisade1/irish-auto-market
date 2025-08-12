import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Validation schema
const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = ForgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email address',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const { email } = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: true
      }
    });

    // SECURITY: Always return success to prevent email enumeration attacks
    const successResponse = {
      success: true,
      message: 'If an account with that email exists, we\'ve sent password reset instructions.'
    };

    // If user doesn't exist, return success anyway (security best practice)
    if (!user) {
      console.log(`🔍 Password reset attempted for non-existent email: ${email}`);
      return NextResponse.json(successResponse);
    }

    // Check if user account is active
    if (user.status !== 'ACTIVE') {
      console.log(`⚠️ Password reset attempted for inactive user: ${email}`);
      return NextResponse.json(successResponse);
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token for database storage
    const hashedResetToken = await bcrypt.hash(resetToken, 12);

    // Set expiration time (1 hour from now)
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Save hashed reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedResetToken,
        resetTokenExpiry: resetExpires
      }
    });

    console.log(`✅ Reset token generated for user: ${user.email}`);

    // Send password reset email using UPDATED function signature
    try {
      if (process.env.RESEND_API_KEY) {
        const { sendPasswordResetEmail } = await import('@/lib/email');
        
        // 🆕 FIXED: Updated function call without resetUrl parameter
        const emailResult = await sendPasswordResetEmail({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          resetToken: resetToken  // ✅ No resetUrl - email service constructs it internally
        });

        if (!emailResult.success) {
          console.error('❌ Failed to send password reset email:', emailResult.error);
        } else {
          console.log(`✅ Password reset email sent to: ${user.email}`);
        }

        // Send admin notification using YOUR function
        try {
          const { sendAdminNotification } = await import('@/lib/email');
          
          await sendAdminNotification({
            type: 'urgent_report',  // ✅ Using your existing type
            data: {
              id: user.id,
              type: 'PASSWORD_RESET_REQUEST',
              severity: 'LOW',
              title: `Password Reset Request`,
              description: `User ${user.firstName} ${user.lastName} (${user.email}) requested a password reset.`,
              reporterName: `${user.firstName} ${user.lastName}`
            }
          });
        } catch (adminEmailError: any) {
          console.error('❌ Failed to send admin notification:', adminEmailError);
        }
      } else {
        console.log('⚠️ No RESEND_API_KEY found, skipping email');
      }
    } catch (emailError: any) {
      console.error('❌ Error sending password reset email:', emailError);
    }

    return NextResponse.json(successResponse);

  } catch (error: any) {
    console.error('❌ Forgot password error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An error occurred while processing your request. Please try again.'
    }, { status: 500 });
  }
}