// src/app/api/admin/support/contact/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const StatusUpdateSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
})

export async function PATCH(
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
    const validatedData = StatusUpdateSchema.parse(body)

    // Fetch current contact message
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
        status: validatedData.status,
        assignedTo: admin.adminProfile.id,
        ...(validatedData.status === 'RESOLVED' && { respondedAt: new Date() })
      }
    })

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.adminProfile.id,
        action: 'USER_CREATED', // Using existing enum value
        resourceType: 'USER',
        resourceId: contact.id,
        description: `Updated contact message status from ${contact.status} to ${validatedData.status}`,
        oldValues: { status: contact.status },
        newValues: { status: validatedData.status },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        endpoint: `/api/admin/support/contact/${params.id}/status`,
        severity: 'INFO'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        id: updatedContact.id,
        status: updatedContact.status,
        assignedTo: updatedContact.assignedTo
      }
    })

  } catch (error: any) {
    console.error('❌ Error updating contact status:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update status' },
      { status: 500 }
    )
  }
}