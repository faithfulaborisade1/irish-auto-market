import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Get user's conversations (inbox)
export async function GET(request: NextRequest) {
  try {
    // Get user from JWT token
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    // Get all conversations where user is buyer or seller
    const conversations = await prisma.conversation.findMany({
      where: {
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
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    // Format conversations for UI
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.buyerId === userId ? conv.seller : conv.buyer
      const lastMessage = conv.messages[0]
      
      // Calculate unread count
      const lastReadTime = conv.buyerId === userId ? conv.buyerLastRead : conv.sellerLastRead
      
      return {
        id: conv.id,
        car: {
          id: conv.car.id,
          title: conv.car.title,
          make: conv.car.make,
          model: conv.car.model,
          year: conv.car.year,
          price: conv.car.price,
          image: conv.car.images[0]?.thumbnailUrl || null
        },
        otherUser: {
          id: otherUser.id,
          name: `${otherUser.firstName} ${otherUser.lastName}`,
          avatar: otherUser.avatar,
          isDealer: !!otherUser.dealerProfile,
          businessName: otherUser.dealerProfile?.businessName,
          verified: otherUser.dealerProfile?.verified || false
        },
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderName: `${lastMessage.sender.firstName} ${lastMessage.sender.lastName}`,
          isFromMe: lastMessage.senderId === userId
        } : null,
        status: conv.status,
        hasUnread: lastReadTime ? new Date(conv.lastMessageAt || 0) > new Date(lastReadTime) : !!conv.lastMessageAt,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt
      }
    })

    return NextResponse.json({
      success: true,
      conversations: formattedConversations
    })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// Create new conversation (when user sends first message)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const buyerId = decoded.userId

    const { carId, message } = await request.json()

    if (!carId || !message?.trim()) {
      return NextResponse.json(
        { error: 'Car ID and message are required' },
        { status: 400 }
      )
    }

    // Get car and seller info
    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: { user: true }
    })

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    const sellerId = car.userId

    // Don't allow seller to message themselves
    if (buyerId === sellerId) {
      return NextResponse.json(
        { error: 'Cannot message yourself' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findUnique({
      where: {
        carId_buyerId: {
          carId,
          buyerId
        }
      }
    })

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          carId,
          buyerId,
          sellerId,
          lastMessage: message.trim(),
          lastMessageBy: buyerId,
          lastMessageAt: new Date()
        }
      })
    }

    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: buyerId,
        content: message.trim(),
        messageType: 'TEXT'
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

    // Update conversation with latest message
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: message.trim(),
        lastMessageBy: buyerId,
        lastMessageAt: new Date(),
        buyerLastRead: new Date() // Mark as read for sender
      }
    })

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        carId: conversation.carId
      },
      message: {
        id: newMessage.id,
        content: newMessage.content,
        createdAt: newMessage.createdAt,
        sender: newMessage.sender
      }
    })

  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}