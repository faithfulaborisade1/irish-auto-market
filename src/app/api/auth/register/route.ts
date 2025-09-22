// src/app/api/auth/register/route.ts - FIXED - Matching email service signature
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'
import { UserRole, UserStatus, NotificationType } from '@prisma/client'
import { z } from 'zod'

// ✅ FIXED: More flexible userType validation that handles multiple formats
const RegisterSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name too long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name too long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  // ✅ FIXED: Keep original userType for proper profile differentiation
  userType: z.enum(['buyer', 'private_seller', 'dealer']),
  businessName: z.string().optional(),
  county: z.string().optional(),
  city: z.string().optional(),
  agreeToTerms: z.boolean(),
  marketingConsent: z.boolean().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    console.log('👤 Processing user registration...')

    // Parse request body first and log the userType
    const body = await request.json()
    console.log('📝 Registration data received:', { 
      email: body.email, 
      userType: body.userType,  // This will be "buyer", "private_seller", or "dealer"
      businessName: body.businessName 
    })

    // Validate with proper error handling
    let validatedData
    try {
      validatedData = RegisterSchema.parse(body)  // Use original body
      console.log('✅ Validation successful, userType:', validatedData.userType)
    } catch (validationError: any) {
      console.error('❌ Validation error details:', {
        error: validationError,
        receivedUserType: body.userType,
        issues: validationError.issues
      })
      
      // Handle validation errors
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid registration data',
            errors: validationError.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              receivedValue: err.path.includes('userType') ? body.userType : undefined
            }))
          },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Additional business validation
    if (validatedData.userType === 'dealer' && !validatedData.businessName) {
      return NextResponse.json(
        { success: false, message: 'Business name is required for dealer accounts' },
        { status: 400 }
      )
    }

    if (!validatedData.agreeToTerms) {
      return NextResponse.json(
        { success: false, message: 'You must agree to the terms and conditions' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        firstName: validatedData.firstName.trim(),
        lastName: validatedData.lastName.trim(),
        phone: validatedData.phone?.trim(),
        password: hashedPassword,
        role: validatedData.userType === 'dealer' ? UserRole.DEALER : UserRole.USER,
        status: UserStatus.ACTIVE,
        location: validatedData.county || validatedData.city ? {
          county: validatedData.county || undefined,
          city: validatedData.city || undefined
        } : undefined,
        preferences: {
          userType: validatedData.userType  // Store the specific user type (buyer, private_seller, dealer)
        }
      }
    })

    // Create dealer profile if needed
    let dealerProfile = null
    if (validatedData.userType === 'dealer' && validatedData.businessName) {
      dealerProfile = await prisma.dealerProfile.create({
        data: {
          userId: newUser.id,
          businessName: validatedData.businessName.trim(),
          verified: false
        }
      })
    }

    console.log(`✅ User created: ${newUser.email} (${newUser.role})`)

    // ✅ FIXED: Send welcome email using EXACT function signature from email service
    let welcomeEmailResult: { success: boolean; error?: string; emailId?: string } = { 
      success: false, 
      error: 'Email service not available' 
    }
    
    try {
      if (process.env.RESEND_API_KEY) {
        const { sendWelcomeEmail } = await import('@/lib/email')
        
        // ✅ FIXED: Using exact function signature: { email, firstName, lastName, role }
        // The email service will determine user type based on role automatically
        welcomeEmailResult = await sendWelcomeEmail({
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role  // This is enough - email service handles dealer detection
        })
      }
    } catch (emailError: any) {
      console.error('❌ Welcome email failed:', emailError.message)
      welcomeEmailResult = { success: false, error: emailError.message }
    }

    console.log(`📧 Welcome email result:`, welcomeEmailResult)

    // ✅ Send admin notification using your exact function signature  
    let adminResult: { success: boolean; error?: string; emailId?: string } = { 
      success: false, 
      error: 'Admin notification not needed for regular users' 
    }
    
    // Only notify admins for dealer registrations (they need verification)
    if (validatedData.userType === 'dealer') {
      try {
        if (process.env.RESEND_API_KEY) {
          const { sendAdminNotification } = await import('@/lib/email')
          
          // Using your exact function signature: sendAdminNotification(notification: { type, data })
          adminResult = await sendAdminNotification({
            type: 'new_dealer',
            data: {
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              email: newUser.email,
              phone: newUser.phone,
              businessName: validatedData.businessName,
              role: newUser.role
            }
          })
        }
      } catch (adminEmailError: any) {
        console.error('❌ Admin notification failed:', adminEmailError.message)
        adminResult = { success: false, error: adminEmailError.message }
      }

      console.log(`🔔 Admin notification result:`, adminResult)
    }

    // Create in-app notifications for admins
    try {
      const adminProfiles = await prisma.adminProfile.findMany({
        where: { isActive: true },
        select: { userId: true }
      })

      if (adminProfiles.length > 0) {
        const notificationTitle = validatedData.userType === 'dealer' 
          ? '🏢 New Dealer Registration'
          : '👤 New User Registration'
        
        const notificationMessage = validatedData.userType === 'dealer'
          ? `${newUser.firstName} ${newUser.lastName} registered ${validatedData.businessName} as a dealer`
          : `${newUser.firstName} ${newUser.lastName} created a new user account`

        const notifications = adminProfiles.map(admin => ({
          userId: admin.userId,
          type: NotificationType.SYSTEM_UPDATE,
          title: notificationTitle,
          message: notificationMessage,
          metadata: {
            userId: newUser.id,
            email: newUser.email,
            userType: validatedData.userType,
            businessName: validatedData.businessName,
            requiresVerification: validatedData.userType === 'dealer'
          }
        }))

        await prisma.notification.createMany({
          data: notifications
        })

        console.log(`🔔 Created ${notifications.length} admin notifications`)
      }
    } catch (notificationError) {
      console.warn('⚠️ Admin notifications failed:', notificationError)
      // Don't fail registration if notifications fail
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: validatedData.userType === 'dealer' 
        ? 'Dealer account created successfully! Please check your email for welcome instructions and verification details.'
        : 'Account created successfully! Please check your email for welcome instructions.',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        },
        dealerProfile: dealerProfile ? {
          id: dealerProfile.id,
          businessName: dealerProfile.businessName,
          verified: dealerProfile.verified
        } : null,
        emailNotifications: {
          welcomeEmail: {
            sent: welcomeEmailResult.success,
            error: welcomeEmailResult.error
          },
          adminNotification: {
            sent: adminResult.success,
            reason: adminResult.error || 'Sent successfully'
          }
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Registration error:', error)

    // Handle database errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, message: 'Invalid data provided' },
        { status: 400 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Registration failed. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Development-only email testing endpoint
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, message: 'Not available in production' },
      { status: 404 }
    )
  }

  try {
    console.log('🧪 Testing registration emails...')

    const results: any = {}

    // Test user welcome email
    try {
      if (process.env.RESEND_API_KEY) {
        const { sendWelcomeEmail } = await import('@/lib/email')
        
        results.userWelcome = await sendWelcomeEmail({
          email: 'test.user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER
        })
      } else {
        results.userWelcome = { success: false, error: 'No API key' }
      }
    } catch (error: any) {
      results.userWelcome = { success: false, error: error.message }
    }

    // Test dealer welcome email
    try {
      if (process.env.RESEND_API_KEY) {
        const { sendWelcomeEmail } = await import('@/lib/email')
        
        results.dealerWelcome = await sendWelcomeEmail({
          email: 'test.dealer@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: UserRole.DEALER
        })
      } else {
        results.dealerWelcome = { success: false, error: 'No API key' }
      }
    } catch (error: any) {
      results.dealerWelcome = { success: false, error: error.message }
    }

    // Test admin notification
    try {
      if (process.env.RESEND_API_KEY) {
        const { sendAdminNotification } = await import('@/lib/email')
        
        results.adminNotification = await sendAdminNotification({
          type: 'new_dealer',
          data: {
            firstName: 'Test',
            lastName: 'Dealer',
            email: 'test.dealer@example.com',
            businessName: 'Test Motors',
            role: UserRole.DEALER
          }
        })
      } else {
        results.adminNotification = { success: false, error: 'No API key' }
      }
    } catch (error: any) {
      results.adminNotification = { success: false, error: error.message }
    }

    return NextResponse.json({
      success: true,
      message: 'Email tests completed',
      results: results
    })

  } catch (error: any) {
    console.error('❌ Email test error:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'