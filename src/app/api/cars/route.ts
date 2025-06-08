import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import jwt from 'jsonwebtoken'

// Get current user from JWT token
async function getCurrentUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    return decoded.userId
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUser(request)
    const searchParams = request.nextUrl.searchParams
    const featured = searchParams.get('featured')
    const sortBy = searchParams.get('sort') || 'newest'
    const searchQuery = searchParams.get('q')
    const makeFilter = searchParams.get('make')
    const countyFilter = searchParams.get('county')
    const priceRangeFilter = searchParams.get('priceRange')
    const yearFilter = searchParams.get('year')

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { make: { contains: searchQuery, mode: 'insensitive' } },
        { model: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ]
    }

    if (makeFilter) {
      where.make = { equals: makeFilter, mode: 'insensitive' }
    }

    if (countyFilter) {
      where.location = {
        path: ['county'],
        equals: countyFilter
      }
    }

    if (yearFilter) {
      if (yearFilter.includes('-')) {
        const [startYear, endYear] = yearFilter.split('-').map(Number)
        where.year = {
          gte: startYear,
          lte: endYear
        }
      } else {
        where.year = Number(yearFilter)
      }
    }

    if (priceRangeFilter) {
      const [minPrice, maxPrice] = priceRangeFilter.split('-').map(Number)
      where.price = {
        gte: minPrice,
        lte: maxPrice
      }
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' } // default

    switch (sortBy) {
      case 'price-low':
        orderBy = { price: 'asc' }
        break
      case 'price-high':
        orderBy = { price: 'desc' }
        break
      case 'year-new':
        orderBy = { year: 'desc' }
        break
      case 'year-old':
        orderBy = { year: 'asc' }
        break
      case 'mileage-low':
        orderBy = { mileage: 'asc' }
        break
      case 'mileage-high':
        orderBy = { mileage: 'desc' }
        break
      case 'most-liked':
        orderBy = { likesCount: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const cars = await db.car.findMany({
      where,
      include: {
        images: {
          orderBy: { orderIndex: 'asc' },
          take: 1,
        },
        user: {
          include: {
            dealerProfile: true,
          },
        },
        // Include likes if user is authenticated
        ...(currentUserId && {
          likes: {
            where: {
              userId: currentUserId
            },
            select: {
              id: true
            }
          }
        })
      },
      orderBy,
      take: 50, // Limit results
    })

    // Transform data for frontend
    const transformedCars = cars.map(car => ({
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
      
      // NEW: Like data
      likesCount: car.likesCount,
      isLiked: currentUserId ? car.likes.length > 0 : false,
      
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
    }))

    return NextResponse.json({
      success: true,
      cars: transformedCars,
      total: transformedCars.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch cars',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}