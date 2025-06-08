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

// POST /api/cars/[id]/like - Like a car
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const carId = params.id

    // Check if car exists and is active
    const car = await db.car.findFirst({
      where: {
        id: carId,
        status: 'ACTIVE'
      },
      include: {
        user: true // Car owner info for notification
      }
    })

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      )
    }

    // Check if user is trying to like their own car
    if (car.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot like your own car' },
        { status: 400 }
      )
    }

    // Check if already liked
    const existingLike = await db.carLike.findUnique({
      where: {
        userId_carId: {
          userId: user.id,
          carId: carId
        }
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'Car already liked' },
        { status: 400 }
      )
    }

    // Create the like and update car like count in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the like
      const like = await tx.carLike.create({
        data: {
          userId: user.id,
          carId: carId
        }
      })

      // Update car likes count
      const updatedCar = await tx.car.update({
        where: { id: carId },
        data: {
          likesCount: {
            increment: 1
          }
        }
      })

      // Create notification for car owner (if not the same user)
      if (car.userId !== user.id) {
        await tx.notification.create({
          data: {
            userId: car.userId,
            type: 'CAR_LIKED',
            title: 'Someone liked your car!',
            message: `${user.firstName} ${user.lastName} liked your ${car.make} ${car.model}`,
            carId: carId,
            actionUrl: `/cars/${carId}`,
            metadata: {
              likerName: `${user.firstName} ${user.lastName}`,
              likerEmail: user.email
            }
          }
        })
      }

      return { like, updatedCar }
    })

    return NextResponse.json({
      success: true,
      message: 'Car liked successfully',
      likesCount: result.updatedCar.likesCount,
      liked: true
    })

  } catch (error) {
    console.error('Like car error:', error)
    return NextResponse.json(
      { error: 'Failed to like car' },
      { status: 500 }
    )
  }
}

// DELETE /api/cars/[id]/like - Unlike a car
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const carId = params.id

    // Check if car exists
    const car = await db.car.findUnique({
      where: { id: carId }
    })

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      )
    }

    // Check if like exists
    const existingLike = await db.carLike.findUnique({
      where: {
        userId_carId: {
          userId: user.id,
          carId: carId
        }
      }
    })

    if (!existingLike) {
      return NextResponse.json(
        { error: 'Car not liked' },
        { status: 400 }
      )
    }

    // Remove the like and update car like count in a transaction
    const result = await db.$transaction(async (tx) => {
      // Delete the like
      await tx.carLike.delete({
        where: {
          userId_carId: {
            userId: user.id,
            carId: carId
          }
        }
      })

      // Update car likes count
      const updatedCar = await tx.car.update({
        where: { id: carId },
        data: {
          likesCount: {
            decrement: 1
          }
        }
      })

      return { updatedCar }
    })

    return NextResponse.json({
      success: true,
      message: 'Car unliked successfully',
      likesCount: result.updatedCar.likesCount,
      liked: false
    })

  } catch (error) {
    console.error('Unlike car error:', error)
    return NextResponse.json(
      { error: 'Failed to unlike car' },
      { status: 500 }
    )
  }
}

// GET /api/cars/[id]/like - Get like status and count
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    const carId = params.id

    // Get car with like count
    const car = await db.car.findUnique({
      where: { id: carId },
      select: {
        id: true,
        likesCount: true
      }
    })

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      )
    }

    let isLiked = false
    
    // Check if current user liked this car (only if authenticated)
    if (user) {
      const userLike = await db.carLike.findUnique({
        where: {
          userId_carId: {
            userId: user.id,
            carId: carId
          }
        }
      })
      isLiked = !!userLike
    }

    return NextResponse.json({
      success: true,
      likesCount: car.likesCount,
      liked: isLiked,
      authenticated: !!user
    })

  } catch (error) {
    console.error('Get like status error:', error)
    return NextResponse.json(
      { error: 'Failed to get like status' },
      { status: 500 }
    )
  }
}