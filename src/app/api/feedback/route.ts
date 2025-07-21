// src/app/api/feedback/route.ts - Complete with Email Integration
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { sendSupportConfirmation, sendAdminNotification } from '@/lib/email'

const prisma = new PrismaClient()

// Type definitions
type FeedbackType = 'GENERAL' | 'BUG_REPORT' | 'FEATURE_REQUEST' | 'USABILITY' | 'PERFORMANCE' | 'CONTENT_QUALITY' | 'MOBILE_EXPERIENCE' | 'SEARCH_EXPERIENCE'
type FeedbackCategory = 'GENERAL' | 'USER_INTERFACE' | 'FUNCTIONALITY' | 'PERFORMANCE' | 'MOBILE' | 'SEARCH' | 'MESSAGING' | 'DEALER_TOOLS' | 'ADMIN_TOOLS'
type MessagePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// Valid feedback types
const VALID_FEEDBACK_TYPES = [
  'GENERAL',
  'BUG_REPORT',
  'FEATURE_REQUEST',
  'USABILITY',
  'PERFORMANCE',
  'CONTENT_QUALITY',
  'MOBILE_EXPERIENCE',
  'SEARCH_EXPERIENCE'
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, type, subject, message, rating, pageUrl, feature, anonymous } = body

    // Validate required fields
    if (!message || !type) {
      return NextResponse.json(
        { success: false, message: 'Message and feedback type are required' },
        { status: 400 }
      )
    }

    // Validate feedback type
    if (!VALID_FEEDBACK_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid feedback type selected' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (email && !anonymous) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Please enter a valid email address' },
          { status: 400 }
        )
      }
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, message: 'Rating must be between 1 and 5 stars' },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Message is too long (maximum 5000 characters)' },
        { status: 400 }
      )
    }

    // Check if user is logged in (optional)
    let userId = null
    try {
      const token = request.cookies.get('auth-token')?.value || request.cookies.get('admin-token')?.value
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        userId = decoded.userId
      }
    } catch (error) {
      // User not logged in - that's okay for feedback
    }

    // Get IP address and user agent for tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Determine category based on feedback type
    let category: FeedbackCategory = 'GENERAL'
    switch (type) {
      case 'BUG_REPORT':
        category = 'FUNCTIONALITY'
        break
      case 'FEATURE_REQUEST':
        category = 'FUNCTIONALITY'
        break
      case 'USABILITY':
        category = 'USER_INTERFACE'
        break
      case 'PERFORMANCE':
        category = 'PERFORMANCE'
        break
      case 'MOBILE_EXPERIENCE':
        category = 'MOBILE'
        break
      case 'SEARCH_EXPERIENCE':
        category = 'SEARCH'
        break
      default:
        category = 'GENERAL'
    }

    // Determine priority based on feedback type and rating
    let priority: MessagePriority = 'LOW'
    if (type === 'BUG_REPORT' || (rating && rating <= 2)) {
      priority = 'MEDIUM'
    } else if (rating && rating <= 1) {
      priority = 'HIGH'
    }

    // Get current page URL for context
    const referer = request.headers.get('referer')
    const contextUrl = pageUrl || referer || 'unknown'

    // Create feedback in database
    const feedback = await prisma.feedback.create({
      data: {
        userId: userId,
        name: anonymous ? null : (name?.trim() || null),
        email: anonymous ? null : (email?.toLowerCase().trim() || null),
        type: type as FeedbackType,
        rating: rating || null,
        subject: subject?.trim() || null,
        message: message.trim(),
        pageUrl: contextUrl,
        feature: feature?.trim() || null,
        category: category,
        priority: priority,
        ipAddress: ip,
        userAgent: userAgent,
        browserInfo: {
          userAgent: userAgent,
          referer: referer,
          anonymous: anonymous || false
        }
      }
    })

    console.log(`✅ Feedback created: ${feedback.id} (${type}, rating: ${rating || 'none'})`);

    // ============================================================================
    // EMAIL NOTIFICATIONS
    // ============================================================================

    // Send thank you email to user (if not anonymous and email provided)
    if (!anonymous && email) {
      sendSupportConfirmation({
        email: email,
        name: name || 'User',
        subject: subject || `Feedback: ${type.replace('_', ' ')}`,
        category: 'FEEDBACK',
        id: feedback.id
      }).then(emailResult => {
        if (emailResult.success) {
          console.log(`✅ Feedback confirmation sent to ${email}`);
        } else {
          console.error(`❌ Failed to send feedback confirmation:`, emailResult.error);
        }
      }).catch(emailError => {
        console.error('❌ Feedback confirmation error:', emailError);
      });
    }

    // Send admin notification for urgent feedback (low ratings, bugs)
    const shouldNotifyAdmin = (
      type === 'BUG_REPORT' || 
      priority === 'HIGH' || 
      priority === 'MEDIUM' ||
      (rating && rating <= 2)
    );

    if (shouldNotifyAdmin) {
      sendAdminNotification({
        type: 'support_contact', // Reusing existing type
        data: {
          name: anonymous ? 'Anonymous User' : (name || 'User'),
          email: anonymous ? 'anonymous@feedback' : (email || 'no-email'),
          subject: `Feedback: ${type.replace('_', ' ')} ${rating ? `(${rating}★)` : ''}`,
          category: `FEEDBACK_${type}`,
          priority: priority,
          message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
          id: feedback.id,
          feedbackType: type,
          rating: rating,
          pageUrl: contextUrl
        }
      }).then(adminResult => {
        if (adminResult.success) {
          console.log(`✅ Admin notification sent for ${type} feedback`);
        } else {
          console.error(`❌ Failed to send admin notification:`, adminResult.error);
        }
      }).catch(adminError => {
        console.error('❌ Admin notification error:', adminError);
      });
    }

    // Create in-app notification for admins (for important feedback)
    if (shouldNotifyAdmin) {
      try {
        const adminProfiles = await prisma.adminProfile.findMany({
          where: { isActive: true },
          select: { userId: true }
        });

        if (adminProfiles.length > 0) {
          const notifications = adminProfiles.map(admin => ({
            userId: admin.userId,
            type: 'FEEDBACK_RECEIVED' as const,
            title: `New Feedback: ${type.replace('_', ' ')} ${rating ? `(${rating}★)` : ''}`,
            message: `${anonymous ? 'Anonymous user' : (name || 'User')} submitted ${type.toLowerCase().replace('_', ' ')} feedback${rating ? ` with ${rating} star rating` : ''}`,
            metadata: {
              feedbackId: feedback.id,
              type: type,
              rating: rating,
              priority: priority,
              anonymous: anonymous
            }
          }));

          await prisma.notification.createMany({
            data: notifications
          });

          console.log(`🔔 Created ${notifications.length} admin notifications for feedback`);
        }
      } catch (notificationError) {
        console.warn('⚠️ Failed to create admin notifications:', notificationError);
        // Don't fail feedback submission if notifications fail
      }
    }

    return NextResponse.json({
      success: true,
      message: anonymous 
        ? 'Thank you for your anonymous feedback! We appreciate your input.'
        : 'Thank you for your feedback! We\'ll review it and get back to you if needed.',
      id: feedback.id,
      referenceId: `IAM-FB-${feedback.id.slice(-6).toUpperCase()}`
    })

  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // This endpoint can be used to get feedback statistics for admin
  try {
    // Check if user is admin
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    // Get admin profile
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId }
    })

    if (!adminProfile) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get feedback statistics
    const stats = await prisma.feedback.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const typeStats = await prisma.feedback.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    })

    const ratingStats = await prisma.feedback.groupBy({
      by: ['rating'],
      _count: {
        id: true
      },
      where: {
        rating: {
          not: null
        }
      }
    })

    // Get recent feedback
    const recentFeedback = await prisma.feedback.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        rating: true,
        subject: true,
        priority: true,
        status: true,
        createdAt: true
      }
    })

    // Calculate average rating
    const averageRating = await prisma.feedback.aggregate({
      _avg: {
        rating: true
      },
      where: {
        rating: {
          not: null
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        stats,
        typeStats,
        ratingStats,
        recentFeedback,
        averageRating: averageRating._avg.rating || 0
      }
    })

  } catch (error) {
    console.error('Feedback stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}