import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

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
      description: car.description,
      location: car.location,
      featured: car.featured,
      views: car.viewsCount,
      inquiries: car.inquiriesCount,
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
