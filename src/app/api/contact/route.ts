// src/app/api/contact/route.ts - Complete with Email Integration
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { sendSupportConfirmation, sendAdminNotification } from '@/lib/email'

const prisma = new PrismaClient()

// Valid contact categories
const VALID_CATEGORIES = [
  'GENERAL',
  'TECHNICAL_SUPPORT',
  'BILLING',
  'DEALER_INQUIRY',
  'PARTNERSHIP',
  'MEDIA_INQUIRY',
  'LEGAL',
  'COMPLAINT',
  'SUGGESTION'
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, category, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Name, email, subject, and message are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category selected' },
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
      // User not logged in - that's okay for contact form
    }

    // Get IP address and user agent for tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Determine priority based on category
    let priority = 'MEDIUM'
    if (category === 'COMPLAINT' || category === 'LEGAL') {
      priority = 'HIGH'
    } else if (category === 'SUGGESTION' || category === 'GENERAL') {
      priority = 'LOW'
    }

    // Create contact message in database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        subject: subject.trim(),
        message: message.trim(),
        category: category as any,
        priority: priority as any,
        userId: userId,
        ipAddress: ip,
        userAgent: userAgent,
        source: 'website'
      }
    })

    console.log(`✅ Contact message created: ${contactMessage.id} from ${email}`);

    // ============================================================================
    // EMAIL NOTIFICATIONS
    // ============================================================================

    // Send confirmation email to user (non-blocking)
    sendSupportConfirmation({
      email: contactMessage.email,
      name: contactMessage.name,
      subject: contactMessage.subject,
      category: contactMessage.category,
      id: contactMessage.id
    }).then(emailResult => {
      if (emailResult.success) {
        console.log(`✅ Support confirmation sent to ${contactMessage.email}`);
      } else {
        console.error(`❌ Failed to send support confirmation:`, emailResult.error);
      }
    }).catch(emailError => {
      console.error('❌ Support confirmation error:', emailError);
    });

    // Send admin notification for important categories (non-blocking)
    const importantCategories = ['COMPLAINT', 'LEGAL', 'TECHNICAL_SUPPORT', 'BILLING'];
    if (importantCategories.includes(category)) {
      sendAdminNotification({
        type: 'support_contact',
        data: {
          name: contactMessage.name,
          email: contactMessage.email,
          subject: contactMessage.subject,
          category: contactMessage.category,
          priority: contactMessage.priority,
          message: contactMessage.message,
          id: contactMessage.id
        }
      }).then(adminResult => {
        if (adminResult.success) {
          console.log(`✅ Admin notification sent for ${category} contact`);
        } else {
          console.error(`❌ Failed to send admin notification:`, adminResult.error);
        }
      }).catch(adminError => {
        console.error('❌ Admin notification error:', adminError);
      });
    }

    // Create in-app notification for admins
    try {
      const adminProfiles = await prisma.adminProfile.findMany({
        where: { isActive: true },
        select: { userId: true }
      });

      if (adminProfiles.length > 0) {
        const notifications = adminProfiles.map(admin => ({
          userId: admin.userId,
          type: 'CONTACT_RECEIVED' as const,
          title: `New Contact: ${category.replace('_', ' ')}`,
          message: `${contactMessage.name} sent a ${category.toLowerCase().replace('_', ' ')} message: "${contactMessage.subject}"`,
          metadata: {
            contactId: contactMessage.id,
            category: category,
            priority: priority,
            email: contactMessage.email
          }
        }));

        await prisma.notification.createMany({
          data: notifications
        });

        console.log(`🔔 Created ${notifications.length} admin notifications for contact`);
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to create admin notifications:', notificationError);
      // Don't fail contact submission if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you within 24 hours.',
      id: contactMessage.id,
      referenceId: `IAM-${contactMessage.id.slice(-8).toUpperCase()}`
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // This endpoint can be used to get contact statistics for admin
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

    // Get contact message statistics
    const stats = await prisma.contactMessage.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const categoryStats = await prisma.contactMessage.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    })

    // Get recent messages
    const recentMessages = await prisma.contactMessage.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        stats,
        categoryStats,
        recentMessages
      }
    })

  } catch (error) {
    console.error('Contact stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}