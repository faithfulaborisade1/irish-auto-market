import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Mark conversation as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId
    const conversationId = params.id

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Update read timestamp for current user
    const now = new Date()
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(conversation.buyerId === userId 
          ? { buyerLastRead: now }
          : { sellerLastRead: now }
        )
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation marked as read'
    })

  } catch (error) {
    console.error('Error marking conversation as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark conversation as read' },
      { status: 500 }
    )
  }
}