// src/app/api/admin/support/contact/route.ts - Admin Contact Management with Email Response
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { MessageStatus, AdminAction, ResourceType, LogSeverity } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// ✅ NO DIRECT EMAIL IMPORTS - This fixes the build error

// Validation schema for admin reply
const AdminReplySchema = z.object({
  contactId: z.string().cuid(),
  responseMessage: z.string().min(10, 'Response must be at least 10 characters').max(5000, 'Response too long'),
  status: z.nativeEnum(MessageStatus).optional()
})

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
    const currentAdmin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { adminProfile: true }
    })

    if (!currentAdmin?.adminProfile) {
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
      updatedAt: contact.updatedAt,
      userId: contact.userId,
      userAgent: contact.userAgent,
      ipAddress: contact.ipAddress,
      response: contact.response,
      respondedAt: contact.respondedAt,
      respondedBy: contact.respondedBy,
      assignedTo: contact.assignedTo,
      messagePreview: contact.message.substring(0, 150) + (contact.message.length > 150 ? '...' : ''),
      referenceNumber: `IAM-${contact.id.slice(-8).toUpperCase()}`,
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
    console.error('❌ Error fetching admin contacts:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Processing admin contact reply...')

    // Verify admin authentication
    const token = request.cookies.get('admin-token')?.value || request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const currentAdmin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { adminProfile: true }
    })

    if (!currentAdmin?.adminProfile) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = AdminReplySchema.parse(body)

    // Get the original contact message
    const contactMessage = await prisma.contactMessage.findUnique({
      where: { id: validatedData.contactId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!contactMessage) {
      return NextResponse.json(
        { success: false, message: 'Contact message not found' },
        { status: 404 }
      )
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent')

    // Update contact message with admin response
    const updatedContact = await prisma.contactMessage.update({
      where: { id: validatedData.contactId },
      data: {
        response: validatedData.responseMessage,
        status: validatedData.status || MessageStatus.IN_PROGRESS,
        responded: true,
        respondedAt: new Date(),
        respondedBy: currentAdmin.adminProfile.id,
        assignedTo: currentAdmin.adminProfile.id
      }
    })

    console.log(`✅ Admin response saved for contact: ${contactMessage.id}`)

    // ✅ SAFE: Send email response using dynamic import
    let emailResult: { success: boolean; error?: string; emailId?: string } = { 
      success: false, 
      error: 'Email service not available' 
    }
    
    try {
      if (process.env.RESEND_API_KEY) {
        const { sendSupportResponse } = await import('@/lib/email')
        
        // Using your exact function signature
        emailResult = await sendSupportResponse({
          to: contactMessage.email,
          name: contactMessage.name,
          originalSubject: contactMessage.subject,
          referenceId: `IAM-${contactMessage.id.slice(-8).toUpperCase()}`,
          responseMessage: validatedData.responseMessage,
          adminName: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
          status: validatedData.status || 'In Progress'
        })
      }
    } catch (emailError: any) {
      console.error('❌ Email response failed:', emailError.message)
      emailResult = { success: false, error: emailError.message }
    }

    console.log(`📧 Email response result:`, emailResult)

    // Create audit log
    try {
      if (currentAdmin.adminProfile) {
        await prisma.adminAuditLog.create({
          data: {
            adminId: currentAdmin.adminProfile.id,
            action: AdminAction.CONTACT_RESPONDED,
            resourceType: ResourceType.CONTACT_MESSAGE,
            resourceId: contactMessage.id,
            description: `Admin responded to contact: "${contactMessage.subject}"`,
            newValues: {
              response: validatedData.responseMessage,
              status: validatedData.status,
              emailSent: emailResult.success
            },
            ipAddress: ipAddress,
            userAgent: userAgent,
            endpoint: '/api/admin/support/contact',
            severity: LogSeverity.INFO
          }
        })
      }
    } catch (auditError) {
      console.warn('⚠️ Audit logging failed:', auditError)
      // Don't fail the response if audit logging fails
    }

    // Create notification for the user (if they have an account)
    if (contactMessage.userId) {
      try {
        await prisma.notification.create({
          data: {
            userId: contactMessage.userId,
            type: 'SYSTEM_UPDATE',
            title: 'Support Response Received',
            message: `We've responded to your contact: "${contactMessage.subject}"`,
            metadata: {
              contactId: contactMessage.id,
              referenceNumber: `IAM-${contactMessage.id.slice(-8).toUpperCase()}`,
              responsePreview: validatedData.responseMessage.substring(0, 100)
            }
          }
        })
      } catch (notificationError) {
        console.warn('⚠️ User notification failed:', notificationError)
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Admin response sent successfully',
      data: {
        contactId: contactMessage.id,
        referenceNumber: `IAM-${contactMessage.id.slice(-8).toUpperCase()}`,
        status: updatedContact.status,
        emailResponse: {
          sent: emailResult.success,
          error: emailResult.error
        },
        adminInfo: {
          respondedBy: `${currentAdmin.firstName} ${currentAdmin.lastName}`,
          respondedAt: updatedContact.respondedAt
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error processing admin reply:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request data',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send admin response. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
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

// Runtime configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'