// src/app/api/admin/support/contact/[id]/reply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// ✅ FIXED: Dynamic import for email service to prevent build-time initialization
async function sendSupportResponseSafely(emailData: any): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    // Check if email service is available
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ Email service not available - RESEND_API_KEY missing');
      return { success: false, error: 'Email service not configured' };
    }

    // Dynamic import to prevent build-time issues
    const { sendSupportResponse } = await import('@/lib/email');
    return await sendSupportResponse(emailData);
  } catch (error: any) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
}

const ReplySchema = z.object({
  message: z.string().min(10, 'Reply message must be at least 10 characters'),
  status: z.enum(['IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { adminProfile: true }
    })

    if (!admin?.adminProfile) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = ReplySchema.parse(body)

    // Fetch the contact message
    const contact = await prisma.contactMessage.findUnique({
      where: { id: params.id }
    })

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Contact message not found' },
        { status: 404 }
      )
    }

    // Update contact message status
    const updatedContact = await prisma.contactMessage.update({
      where: { id: params.id },
      data: {
        status: validatedData.status || 'RESOLVED',
        assignedTo: admin.adminProfile.id,
        respondedAt: new Date(),
        responded: true,
        respondedBy: admin.adminProfile.id,
        response: validatedData.message
      }
    })

    // ✅ FIXED: Safe email sending with error handling
    const emailResult = await sendSupportResponseSafely({
      to: contact.email,
      name: contact.name,
      originalSubject: contact.subject,
      referenceId: `IAM-${contact.id.slice(-8).toUpperCase()}`,
      responseMessage: validatedData.message,
      adminName: `${admin.firstName} ${admin.lastName}`,
      status: validatedData.status || 'RESOLVED'
    })

    // Log admin action (audit trail) - Only if admin profile exists
    if (admin.adminProfile) {
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.adminProfile.id,
            action: 'CONTACT_RESPONDED', // Using more specific action
            resourceType: 'CONTACT_MESSAGE',
            resourceId: contact.id,
            description: `Replied to contact message from ${contact.name}`,
            oldValues: undefined, // Use undefined instead of object for optional JSON
            newValues: undefined, // Use undefined instead of object for optional JSON
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || undefined,
            endpoint: `/api/admin/support/contact/${params.id}/reply`,
            severity: 'INFO'
          }
        })
      } catch (auditError) {
        console.error('⚠️ Audit logging failed:', auditError);
        // Don't fail the entire operation if audit logging fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        contactId: updatedContact.id,
        status: updatedContact.status,
        emailSent: emailResult.success,
        emailId: emailResult.emailId,
        emailError: emailResult.error
      }
    })

  } catch (error: any) {
    console.error('❌ Error sending reply:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid input data', errors: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to send reply' },
      { status: 500 }
    )
  }
}

// ✅ FIXED: Add dynamic runtime to prevent build-time execution
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'