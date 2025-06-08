import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import jwt from 'jsonwebtoken'

// Get current user from JWT token
async function getCurrentUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    })
    return user
  } catch (error) {
    return null
  }
}

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'

    // Build where clause
    const where: any = {
      userId: user.id
    }

    if (unreadOnly) {
      where.read = false
    }

    // Get notifications
    const notifications = await db.notification.findMany({
      where,
      include: {
        car: {
          select: {
            id: true,
            title: true,
            make: true,
            model: true,
            price: true,
            images: {
              select: {
                thumbnailUrl: true,
                altText: true
              },
              take: 1,
              orderBy: {
                orderIndex: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Get unread count
    const unreadCount = await db.notification.count({
      where: {
        userId: user.id,
        read: false
      }
    })

    // Transform notifications for frontend
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
      car: notification.car ? {
        id: notification.car.id,
        title: notification.car.title,
        make: notification.car.make,
        model: notification.car.model,
        price: Number(notification.car.price),
        image: notification.car.images[0]?.thumbnailUrl || null
      } : null,
      metadata: notification.metadata
    }))

    return NextResponse.json({
      success: true,
      notifications: transformedNotifications,
      unreadCount,
      total: notifications.length
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationIds, markAllAsRead } = body

    if (markAllAsRead) {
      // Mark all notifications as read
      await db.notification.updateMany({
        where: {
          userId: user.id,
          read: false
        },
        data: {
          read: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await db.notification.updateMany({
        where: {
          id: {
            in: notificationIds
          },
          userId: user.id // Security: only update user's own notifications
        },
        data: {
          read: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Notifications marked as read'
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Mark notifications read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}