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

// POST /api/cars/[id]/favorite - Add car to favorites
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

    // Check if user is trying to favorite their own car
    if (car.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot favorite your own car' },
        { status: 400 }
      )
    }

    // Check if already favorited
    const existingFavorite = await db.favoriteCar.findUnique({
      where: {
        userId_carId: {
          userId: user.id,
          carId: carId
        }
      }
    })

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Car already favorited' },
        { status: 400 }
      )
    }

    // Create the favorite and update car favorites count in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the favorite
      const favorite = await tx.favoriteCar.create({
        data: {
          userId: user.id,
          carId: carId
        }
      })

      // Update car favorites count
      const updatedCar = await tx.car.update({
        where: { id: carId },
        data: {
          favoritesCount: {
            increment: 1
          }
        }
      })

      // Create notification for car owner (if not the same user)
      if (car.userId !== user.id) {
        await tx.notification.create({
          data: {
            userId: car.userId,
            type: 'CAR_FAVORITED',
            title: 'Someone favorited your car!',
            message: `${user.firstName} ${user.lastName} favorited your ${car.make} ${car.model}`,
            carId: carId,
            actionUrl: `/cars/${carId}`,
            metadata: {
              favoriterName: `${user.firstName} ${user.lastName}`,
              favoriterEmail: user.email
            }
          }
        })
      }

      return { favorite, updatedCar }
    })

    return NextResponse.json({
      success: true,
      message: 'Car favorited successfully',
      favoritesCount: result.updatedCar.favoritesCount,
      favorited: true
    })

  } catch (error) {
    console.error('Favorite car error:', error)
    return NextResponse.json(
      { error: 'Failed to favorite car' },
      { status: 500 }
    )
  }
}

// DELETE /api/cars/[id]/favorite - Remove car from favorites
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

    // Check if favorite exists
    const existingFavorite = await db.favoriteCar.findUnique({
      where: {
        userId_carId: {
          userId: user.id,
          carId: carId
        }
      }
    })

    if (!existingFavorite) {
      return NextResponse.json(
        { error: 'Car not favorited' },
        { status: 400 }
      )
    }

    // Remove the favorite and update car favorites count in a transaction
    const result = await db.$transaction(async (tx) => {
      // Delete the favorite
      await tx.favoriteCar.delete({
        where: {
          userId_carId: {
            userId: user.id,
            carId: carId
          }
        }
      })

      // Update car favorites count
      const updatedCar = await tx.car.update({
        where: { id: carId },
        data: {
          favoritesCount: {
            decrement: 1
          }
        }
      })

      return { updatedCar }
    })

    return NextResponse.json({
      success: true,
      message: 'Car removed from favorites successfully',
      favoritesCount: result.updatedCar.favoritesCount,
      favorited: false
    })

  } catch (error) {
    console.error('Remove favorite error:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}

// GET /api/cars/[id]/favorite - Get favorite status and count
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    const carId = params.id

    // Get car with favorites count
    const car = await db.car.findUnique({
      where: { id: carId },
      select: {
        id: true,
        favoritesCount: true
      }
    })

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      )
    }

    let isFavorited = false
    
    // Check if current user favorited this car (only if authenticated)
    if (user) {
      const userFavorite = await db.favoriteCar.findUnique({
        where: {
          userId_carId: {
            userId: user.id,
            carId: carId
          }
        }
      })
      isFavorited = !!userFavorite
    }

    return NextResponse.json({
      success: true,
      favoritesCount: car.favoritesCount || 0,
      favorited: isFavorited,
      authenticated: !!user
    })

  } catch (error) {
    console.error('Get favorite status error:', error)
    return NextResponse.json(
      { error: 'Failed to get favorite status' },
      { status: 500 }
    )
  }
}