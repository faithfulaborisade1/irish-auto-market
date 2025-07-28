import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import jwt from 'jsonwebtoken'

// GET - Fetch single car (your existing code with userId added)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const car = await db.car.findUnique({
      where: {
        id: params.id,
        status: 'ACTIVE',
      },
      include: {
        images: {
          orderBy: { orderIndex: 'asc' },
        },
        user: {
          include: {
            dealerProfile: true,
          },
        },
      },
    })

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      )
    }

    // Transform data for frontend
    const transformedCar = {
      id: car.id,
      userId: car.userId, // 🆕 ADD THIS for ownership check in edit page
      title: car.title,
      make: car.make,
      model: car.model,
      year: car.year,
      price: Number(car.price),
      mileage: car.mileage,
      fuelType: car.fuelType,
      transmission: car.transmission,
      bodyType: car.bodyType,
      color: car.color,
      condition: car.condition, // 🆕 ADD THIS for edit form
      previousOwners: car.previousOwners, // 🆕 ADD THIS for edit form
      nctExpiry: car.nctExpiry, // 🆕 ADD THIS for edit form
      serviceHistory: car.serviceHistory, // 🆕 ADD THIS for edit form
      accidentHistory: car.accidentHistory, // 🆕 ADD THIS for edit form
      features: car.features, // 🆕 ADD THIS for edit form
      description: car.description,
      location: car.location,
      featured: car.featured,
      views: car.viewsCount,
      inquiries: car.inquiriesCount,
      // 🆕 ADD THESE MISSING FIELDS:
      engineSize: car.engineSize,
      doors: car.doors,
      seats: car.seats,
      images: car.images.map(img => ({
        id: img.id,
        url: img.largeUrl,
        alt: img.altText || `${car.make} ${car.model}`,
      })),
      seller: {
        name: car.user.dealerProfile?.businessName || `${car.user.firstName} ${car.user.lastName}`,
        type: car.user.role === 'DEALER' ? 'dealer' : 'private',
        phone: car.user.phone || '',
        verified: car.user.dealerProfile?.verified || false,
      },
    }

    return NextResponse.json({
      success: true,
      car: transformedCar,
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch car' },
      { status: 500 }
    )
  }
}

// 🆕 PUT - Update car
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authentication token
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    // Check if car exists and user owns it
    const existingCar = await db.car.findUnique({
      where: { id: params.id },
      include: { user: true }
    })

    if (!existingCar) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      )
    }

    // Check ownership (unless admin)
    const user = await db.user.findUnique({ where: { id: userId } })
    if (existingCar.userId !== userId && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'You can only edit your own cars' },
        { status: 403 }
      )
    }

    // Get update data
    const updateData = await request.json()

    // Validate required fields
    if (!updateData.title || !updateData.make || !updateData.model || !updateData.year || !updateData.price) {
      return NextResponse.json(
        { error: 'Title, make, model, year, and price are required' },
        { status: 400 }
      )
    }

    // Prepare update data
    const carUpdateData: any = {
      title: updateData.title,
      make: updateData.make,
      model: updateData.model,
      year: parseInt(updateData.year),
      price: parseFloat(updateData.price),
      mileage: updateData.mileage ? parseInt(updateData.mileage) : null,
      fuelType: updateData.fuelType || null,
      transmission: updateData.transmission || null,
      engineSize: updateData.engineSize ? parseFloat(updateData.engineSize) : null,
      bodyType: updateData.bodyType || null,
      doors: updateData.doors ? parseInt(updateData.doors) : null,
      seats: updateData.seats ? parseInt(updateData.seats) : null,
      color: updateData.color || null,
      condition: updateData.condition || 'USED',
      previousOwners: updateData.previousOwners ? parseInt(updateData.previousOwners) : null,
      nctExpiry: updateData.nctExpiry ? new Date(updateData.nctExpiry) : null,
      serviceHistory: Boolean(updateData.serviceHistory),
      accidentHistory: Boolean(updateData.accidentHistory),
      description: updateData.description || null,
      features: updateData.features || [],
      location: updateData.location || null,
      updatedAt: new Date()
    }

    // Update car in database
    const updatedCar = await db.car.update({
      where: { id: params.id },
      data: carUpdateData,
      include: {
        images: true,
        user: {
          include: {
            dealerProfile: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Car updated successfully',
      car: {
        id: updatedCar.id,
        title: updatedCar.title,
        make: updatedCar.make,
        model: updatedCar.model,
        year: updatedCar.year,
        price: Number(updatedCar.price)
      }
    })

  } catch (error) {
    console.error('Error updating car:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update car' },
      { status: 500 }
    )
  }
}

// 🆕 DELETE - Delete car (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authentication token
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('admin-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    // Check if car exists and user owns it
    const existingCar = await db.car.findUnique({
      where: { id: params.id },
      include: { user: true }
    })

    if (!existingCar) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      )
    }

    // Check ownership (unless admin)
    const user = await db.user.findUnique({ where: { id: userId } })
    if (existingCar.userId !== userId && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'You can only delete your own cars' },
        { status: 403 }
      )
    }

    // Soft delete - set status to EXPIRED instead of hard delete
    await db.car.update({
      where: { id: params.id },
      data: {
        status: 'EXPIRED', // This will hide it from active listings
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Car deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting car:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete car' },
      { status: 500 }
    )
  }
}