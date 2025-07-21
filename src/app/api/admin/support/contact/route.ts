// src/app/api/contact/route.ts - Enhanced Contact API with Email Notifications
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { sendSupportConfirmation, sendAdminNotification } from '@/lib/email'
import { ContactCategory, MessagePriority, MessageStatus } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// Validation schema using your exact Prisma enums
const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message too long'),
  category: z.nativeEnum(ContactCategory)
})

// Priority assignment based on category using your actual enum values
function getPriority(category: ContactCategory): MessagePriority {
  switch (category) {
    case ContactCategory.TECHNICAL_SUPPORT:
    case ContactCategory.BILLING:
    case ContactCategory.LEGAL:
    case ContactCategory.COMPLAINT:
      return MessagePriority.HIGH
    case ContactCategory.DEALER_INQUIRY:
    case ContactCategory.PARTNERSHIP:
    case ContactCategory.MEDIA_INQUIRY:
      return MessagePriority.MEDIUM
    case ContactCategory.GENERAL:
    case ContactCategory.SUGGESTION:
    default:
      return MessagePriority.LOW
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📞 Processing contact form submission...')

    // Parse and validate request body
    const body = await request.json()
    const validatedData = ContactSchema.parse(body)

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
      // Authentication is optional for contact form
      console.log('No authentication or invalid token - proceeding as anonymous user')
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent')

    // Determine priority
    const priority = getPriority(validatedData.category)

    // Create contact message in database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
        category: validatedData.category,
        priority: priority,
        status: MessageStatus.NEW,
        userId: userId,
        ipAddress: ipAddress,
        userAgent: userAgent
      }
    })

    console.log(`✅ Contact message created: ${contactMessage.id}`)

    // Send confirmation email to user
    const confirmationResult = await sendSupportConfirmation({
      email: validatedData.email,
      name: validatedData.name,
      subject: validatedData.subject,
      category: validatedData.category,
      id: contactMessage.id
    })

    console.log(`📧 Confirmation email result:`, confirmationResult)

    // Send notification email to admin
    const adminNotificationResult = await sendAdminNotification({
      type: 'support_contact',
      data: {
        id: contactMessage.id,
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        category: validatedData.category,
        priority: priority,
        message: validatedData.message,
        isAuthenticated: !!userId,
        userInfo: user ? `${user.firstName} ${user.lastName}` : 'Anonymous'
      }
    })

    console.log(`🔔 Admin notification result:`, adminNotificationResult)

    // Create notification for admin users (if any admins exist)
    try {
      const adminProfiles = await prisma.adminProfile.findMany({
        where: { isActive: true },
        select: { userId: true }
      })

      if (adminProfiles.length > 0) {
        // Create notification for all active admins
        const notifications = adminProfiles.map(admin => ({
          userId: admin.userId,
          type: 'SYSTEM_UPDATE' as const, // Using existing enum value from your schema
          title: `New ${validatedData.category.replace('_', ' ')} Contact`,
          message: `${validatedData.name} sent: "${validatedData.subject}"`,
          metadata: {
            contactId: contactMessage.id,
            priority: priority,
            category: validatedData.category
          }
        }))

        await prisma.notification.createMany({
          data: notifications
        })

        console.log(`🔔 Created ${notifications.length} admin notifications`)
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to create admin notifications:', notificationError)
      // Don't fail the whole request if notifications fail
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Contact message sent successfully',
      data: {
        id: contactMessage.id,
        referenceId: `IAM-${contactMessage.id.slice(-8).toUpperCase()}`,
        status: contactMessage.status,
        priority: priority,
        emailSent: confirmationResult.success,
        adminNotified: adminNotificationResult.success
      }
    })

  } catch (error: any) {
    console.error('❌ Error processing contact form:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid form data',
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
        { success: false, message: 'Duplicate contact submission detected' },
        { status: 409 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send contact message. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving contact messages (admin only)
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
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')
    const priority = url.searchParams.get('priority')
    const search = url.searchParams.get('search')

    // Build where clause
    const where: any = {}
    
    if (status) where.status = status
    if (category) where.category = category
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch contact messages with pagination
    const [contacts, totalCount] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.contactMessage.count({ where })
    ])

    // Transform data for response
    const transformedContacts = contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      category: contact.category,
      priority: contact.priority,
      status: contact.status,
      createdAt: contact.createdAt,
      userId: contact.userId,
      userAgent: contact.userAgent,
      ipAddress: contact.ipAddress,
      messagePreview: contact.message.substring(0, 150) + (contact.message.length > 150 ? '...' : ''),
      timeSinceCreated: getTimeSince(contact.createdAt),
      user: contact.user
    }))

    return NextResponse.json({
      success: true,
      data: {
        contacts: transformedContacts,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching contact messages:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch contact messages' },
      { status: 500 }
    )
  }
}

// Helper function to calculate time since creation
function getTimeSince(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}