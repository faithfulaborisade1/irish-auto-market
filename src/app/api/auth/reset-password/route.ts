import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';

// Validation schema
const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = ResetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Please check your input and try again',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const { token, password } = validationResult.data;

    // Find user with valid reset token that hasn't expired
    const users = await prisma.user.findMany({
      where: {
        resetTokenExpiry: {
          gt: new Date()
        },
        resetToken: {
          not: null
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        resetToken: true,
        resetTokenExpiry: true
      }
    });

    // Find the user whose token matches
    let matchingUser = null;
    for (const user of users) {
      if (user.resetToken) {
        const tokenMatches = await bcrypt.compare(token, user.resetToken);
        if (tokenMatches) {
          matchingUser = user;
          break;
        }
      }
    }

    if (!matchingUser) {
      console.log('❌ Invalid or expired reset token');
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired reset token. Please request a new password reset.'
      }, { status: 400 });
    }

    console.log(`✅ Valid reset token for user: ${matchingUser.email}`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with new password and clear reset token
    await prisma.user.update({
      where: { id: matchingUser.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        lastPasswordReset: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Password successfully reset for user: ${matchingUser.email}`);

    // Send confirmation email using YOUR function
    try {
      if (process.env.RESEND_API_KEY) {
        const { sendPasswordResetSuccessEmail } = await import('@/lib/email');
        
        const emailResult = await sendPasswordResetSuccessEmail({
          email: matchingUser.email,
          firstName: matchingUser.firstName,
          lastName: matchingUser.lastName
        });

        if (emailResult.success) {
          console.log('✅ Password reset confirmation email sent');
        } else {
          console.error('❌ Failed to send confirmation email:', emailResult.error);
        }
      }
    } catch (emailError: any) {
      console.error('❌ Confirmation email error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.'
    });

  } catch (error: any) {
    console.error('❌ Reset password error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An error occurred while resetting your password. Please try again.'
    }, { status: 500 });
  }
}