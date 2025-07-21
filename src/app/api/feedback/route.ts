// src/app/api/feedback/route.ts - FIXED - Matches Your Email Service Exactly
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { FeedbackType, FeedbackCategory, MessagePriority, FeedbackStatus, NotificationType } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// Validation schema using your exact Prisma enums
const FeedbackSchema = z.object({
  name: z.string().max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  type: z.nativeEnum(FeedbackType),
  subject: z.string().max(200, 'Subject too long').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message too long'),
  rating: z.number().min(1).max(5).optional(),
  pageUrl: z.string().optional(),
  feature: z.string().optional(),
  anonymous: z.boolean().optional().default(false)
})

// Determine category based on feedback type
function getCategory(type: FeedbackType): FeedbackCategory {
  switch (type) {
    case FeedbackType.BUG_REPORT:
    case FeedbackType.FEATURE_REQUEST:
      return FeedbackCategory.FUNCTIONALITY
    case FeedbackType.USABILITY:
      return FeedbackCategory.USER_INTERFACE
    case FeedbackType.PERFORMANCE:
      return FeedbackCategory.PERFORMANCE
    case FeedbackType.MOBILE_EXPERIENCE:
      return FeedbackCategory.MOBILE
    case FeedbackType.SEARCH_EXPERIENCE:
      return FeedbackCategory.SEARCH
    default:
      return FeedbackCategory.GENERAL
  }
}

// Determine priority based on feedback type and rating
function getPriority(type: FeedbackType, rating?: number): MessagePriority {
  if (type === FeedbackType.BUG_REPORT) {
    return MessagePriority.HIGH
  }
  if (rating && rating <= 2) {
    return MessagePriority.HIGH
  }
  if (rating && rating <= 3) {
    return MessagePriority.MEDIUM
  }
  return MessagePriority.LOW
}

// Check if feedback should trigger admin notification
function shouldNotifyAdmin(type: FeedbackType, priority: MessagePriority, rating?: number): boolean {
  return type === FeedbackType.BUG_REPORT || 
         priority === MessagePriority.HIGH || 
         priority === MessagePriority.MEDIUM ||
         (rating !== undefined && rating <= 2)
}

export async function POST(request: NextRequest) {
  try {
    console.log('💬 Processing feedback submission...')

    // Parse and validate request body
    const body = await request.json()
    const validatedData = FeedbackSchema.parse(body)

    // Get user info if authenticated (optional)
    let userId: string | undefined
    let user: any = null

    try {
      const token = request.cookies.get('auth-token')?.value || request.cookies.get('admin-token')?.value
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, firstName: true, lastName: true, email: true }
        })
        if (user) {
          userId = user.id
        }
      }
    } catch (authError) {
      console.log('No authentication - proceeding as anonymous feedback')
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent')
    const referer = request.headers.get('referer')

    // Determine category and priority
    const category = getCategory(validatedData.type)
    const priority = getPriority(validatedData.type, validatedData.rating)

    // Create feedback in database
    const feedback = await prisma.feedback.create({
      data: {
        userId: userId,
        name: validatedData.anonymous ? undefined : validatedData.name,
        email: validatedData.anonymous ? undefined : validatedData.email,
        type: validatedData.type,
        rating: validatedData.rating,
        subject: validatedData.subject,
        message: validatedData.message,
        pageUrl: validatedData.pageUrl || referer,
        feature: validatedData.feature,
        category: category,
        priority: priority,
        status: FeedbackStatus.NEW,
        ipAddress: ipAddress,
        userAgent: userAgent,
        browserInfo: {
          userAgent: userAgent,
          referer: referer,
          anonymous: validatedData.anonymous
        }
      }
    })

    console.log(`✅ Feedback created: ${feedback.id}`)

    // Create reference number
    const referenceNumber = `IAM-FB-${feedback.id.slice(-6).toUpperCase()}`

    // ✅ FIXED: Send confirmation email using your exact function signature
    let confirmationResult: { success: boolean; error?: string; emailId?: string } = { 
      success: false, 
      error: 'Email service not available or anonymous feedback' 
    }
    
    if (!validatedData.anonymous && validatedData.email) {
      try {
        if (process.env.RESEND_API_KEY) {
          const { sendSupportConfirmation } = await import('@/lib/email')
          
          // Using your exact function signature: sendSupportConfirmation(contact: { email, name, subject, category, id })
          confirmationResult = await sendSupportConfirmation({
            email: validatedData.email,
            name: validatedData.name || 'User',
            subject: validatedData.subject || `Feedback: ${validatedData.type.replace('_', ' ')}`,
            category: 'FEEDBACK',
            id: feedback.id
          })
        }
      } catch (emailError: any) {
        console.error('❌ Confirmation email failed:', emailError.message)
        confirmationResult = { success: false, error: emailError.message }
      }

      console.log(`📧 Confirmation email result:`, confirmationResult)
    }

    // ✅ FIXED: Send admin notification using your exact function signature
    let adminResult: { success: boolean; error?: string; emailId?: string } = { 
      success: false, 
      error: 'Not urgent feedback' 
    }
    
    if (shouldNotifyAdmin(validatedData.type, priority, validatedData.rating)) {
      try {
        if (process.env.RESEND_API_KEY) {
          const { sendAdminNotification } = await import('@/lib/email')
          
          // Using your exact function signature: sendAdminNotification(notification: { type, data })
          adminResult = await sendAdminNotification({
            type: 'urgent_report', // Using existing type from your email service
            data: {
              type: validatedData.type.replace('_', ' '),
              severity: priority,
              title: `${validatedData.type.replace('_', ' ')} Feedback${validatedData.rating ? ` (${validatedData.rating}★)` : ''}`,
              reporterName: validatedData.anonymous ? 'Anonymous User' : (validatedData.name || 'User'),
              reporterEmail: validatedData.anonymous ? 'anonymous@feedback' : (validatedData.email || 'no-email'),
              message: validatedData.message.substring(0, 200) + (validatedData.message.length > 200 ? '...' : ''),
              id: feedback.id
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
    if (shouldNotifyAdmin(validatedData.type, priority, validatedData.rating)) {
      try {
        const adminProfiles = await prisma.adminProfile.findMany({
          where: { isActive: true },
          select: { userId: true }
        })

        if (adminProfiles.length > 0) {
          const notifications = adminProfiles.map(admin => ({
            userId: admin.userId,
            type: NotificationType.FEEDBACK_RECEIVED,
            title: `${validatedData.type.replace(/_/g, ' ')} Feedback${validatedData.rating ? ` (${validatedData.rating}★)` : ''}`,
            message: `${validatedData.anonymous ? 'Anonymous user' : (validatedData.name || 'User')} submitted feedback${validatedData.rating ? ` with ${validatedData.rating} star rating` : ''}`,
            metadata: {
              feedbackId: feedback.id,
              type: validatedData.type,
              rating: validatedData.rating,
              priority: priority,
              anonymous: validatedData.anonymous,
              referenceNumber: referenceNumber
            }
          }))

          await prisma.notification.createMany({
            data: notifications
          })

          console.log(`🔔 Created ${notifications.length} admin notifications`)
        }
      } catch (notificationError) {
        console.warn('⚠️ Admin notifications failed:', notificationError)
        // Don't fail the request if notifications fail
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: validatedData.anonymous 
        ? 'Thank you for your anonymous feedback! We appreciate your input.'
        : 'Thank you for your feedback! We\'ll review it and get back to you if needed.',
      data: {
        id: feedback.id,
        referenceNumber: referenceNumber,
        type: validatedData.type,
        priority: priority,
        confirmationEmail: {
          sent: confirmationResult.success,
          error: confirmationResult.error
        },
        adminNotification: {
          sent: adminResult.success,
          reason: adminResult.error || 'Sent successfully'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error processing feedback:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid feedback data',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    // Handle database errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Duplicate feedback submission detected' },
        { status: 409 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit feedback. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint for admin access (feedback statistics)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('admin-token')?.value || request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { adminProfile: true }
    })

    if (!user?.adminProfile) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')

    // Build where clause
    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status  
    if (priority) where.priority = priority

    // Get feedback statistics
    const [feedbackList, totalCount, stats] = await Promise.all([
      prisma.feedback.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          type: true,
          rating: true,
          subject: true,
          priority: true,
          status: true,
          createdAt: true,
          message: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.feedback.count({ where }),
      prisma.feedback.aggregate({
        _avg: { rating: true },
        _count: { id: true }
      })
    ])

    // Transform data for response
    const transformedFeedback = feedbackList.map(feedback => ({
      id: feedback.id,
      name: feedback.name || 'Anonymous',
      email: feedback.email || 'Not provided',
      type: feedback.type,
      rating: feedback.rating,
      subject: feedback.subject,
      priority: feedback.priority,
      status: feedback.status,
      createdAt: feedback.createdAt,
      messagePreview: feedback.message?.substring(0, 100) + (feedback.message && feedback.message.length > 100 ? '...' : ''),
      referenceNumber: `IAM-FB-${feedback.id.slice(-6).toUpperCase()}`
    }))

    return NextResponse.json({
      success: true,
      data: {
        feedback: transformedFeedback,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        statistics: {
          totalFeedback: stats._count.id,
          averageRating: stats._avg.rating || 0
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching feedback:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'