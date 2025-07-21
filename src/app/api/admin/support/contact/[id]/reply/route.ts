// src/app/api/admin/support/contact/[id]/reply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { sendSupportResponse } from '@/lib/email'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

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
        respondedAt: new Date()
      }
    })

    // Send email response to user
    const emailResult = await sendSupportResponse({
      to: contact.email,
      name: contact.name,
      originalSubject: contact.subject,
      referenceId: `IAM-${contact.id.slice(-8).toUpperCase()}`,
      responseMessage: validatedData.message,
      adminName: `${admin.firstName} ${admin.lastName}`,
      status: validatedData.status || 'RESOLVED'
    })

    // Log admin action (audit trail)
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.adminProfile.id,
        action: 'SYSTEM_MAINTENANCE', // Using existing enum value from your schema
        resourceType: 'USER',
        resourceId: contact.id,
        description: `Replied to contact message from ${contact.name}`,
        oldValues: { status: contact.status },
        newValues: { 
          status: validatedData.status || 'RESOLVED',
          responseMessage: validatedData.message,
          emailSent: emailResult.success
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        endpoint: `/api/admin/support/contact/${params.id}/reply`,
        severity: 'INFO'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        contactId: updatedContact.id,
        status: updatedContact.status,
        emailSent: emailResult.success,
        emailId: emailResult.emailId
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