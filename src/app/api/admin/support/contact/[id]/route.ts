// src/app/api/admin/support/contact/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import jwt from 'jsonwebtoken'

// GET - Fetch individual contact message
export async function GET(
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

    // Fetch the contact message
    const contact = await prisma.contactMessage.findUnique({
      where: { id: params.id },
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

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Contact message not found' },
        { status: 404 }
      )
    }

    // Mark as read if it's NEW
    if (contact.status === 'NEW') {
      await prisma.contactMessage.update({
        where: { id: params.id },
        data: { 
          status: 'IN_PROGRESS',
          assignedTo: user.adminProfile.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        category: contact.category,
        priority: contact.priority,
        status: contact.status === 'NEW' ? 'IN_PROGRESS' : contact.status,
        createdAt: contact.createdAt,
        userId: contact.userId,
        userAgent: contact.userAgent,
        ipAddress: contact.ipAddress,
        assignedTo: contact.assignedTo || user.adminProfile.id
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching contact message:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch contact message' },
      { status: 500 }
    )
  }
}