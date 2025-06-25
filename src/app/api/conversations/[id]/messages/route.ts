import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Get messages for a conversation
export async function GET(
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
      },
      include: {
        car: {
          include: {
            images: {
              orderBy: { orderIndex: 'asc' },
              take: 1
            }
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            dealerProfile: {
              select: {
                businessName: true,
                verified: true
              }
            }
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            dealerProfile: {
              select: {
                businessName: true,
                verified: true
              }
            }
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Get pagination parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get messages for this conversation
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit
    })

    // Mark messages as read for current user
    const now = new Date()
    if (conversation.buyerId === userId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { buyerLastRead: now }
      })
    } else {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { sellerLastRead: now }
      })
    }

    // Format response
    const otherUser = conversation.buyerId === userId ? conversation.seller : conversation.buyer
    
    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        car: {
          id: conversation.car.id,
          title: conversation.car.title,
          make: conversation.car.make,
          model: conversation.car.model,
          year: conversation.car.year,
          price: conversation.car.price,
          image: conversation.car.images[0]?.thumbnailUrl,
          status: conversation.car.status
        },
        otherUser: {
          id: otherUser.id,
          name: `${otherUser.firstName} ${otherUser.lastName}`,
          avatar: otherUser.avatar,
          isDealer: !!otherUser.dealerProfile,
          businessName: otherUser.dealerProfile?.businessName,
          verified: otherUser.dealerProfile?.verified || false
        },
        isUserBuyer: conversation.buyerId === userId
      },
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        messageType: msg.messageType,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
        readAt: msg.readAt,
        sender: {
          id: msg.sender.id,
          name: `${msg.sender.firstName} ${msg.sender.lastName}`,
          avatar: msg.sender.avatar
        },
        isFromMe: msg.senderId === userId
      })),
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// Send a new message
export async function POST(
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

    const { message, messageType = 'TEXT', attachments } = await request.json()

    if (!message?.trim() && !attachments?.length) {
      return NextResponse.json(
        { error: 'Message content or attachments required' },
        { status: 400 }
      )
    }

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

    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: message?.trim() || '',
        messageType: messageType as any,
        attachments: attachments || null
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    })

    // Update conversation with latest message info
    const now = new Date()
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: message?.trim() || '[Image]',
        lastMessageBy: userId,
        lastMessageAt: now,
        // Mark as read for sender
        ...(conversation.buyerId === userId 
          ? { buyerLastRead: now }
          : { sellerLastRead: now }
        )
      }
    })

    // TODO: Send real-time notification via WebSocket
    // TODO: Create notification record for other user

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        content: newMessage.content,
        messageType: newMessage.messageType,
        attachments: newMessage.attachments,
        createdAt: newMessage.createdAt,
        sender: {
          id: newMessage.sender.id,
          name: `${newMessage.sender.firstName} ${newMessage.sender.lastName}`,
          avatar: newMessage.sender.avatar
        },
        isFromMe: true
      }
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}