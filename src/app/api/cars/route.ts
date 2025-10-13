// src/app/api/cars/route.ts - Enhanced Production Version with Complete Filtering
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import jwt from 'jsonwebtoken'
import { rateLimiters, withRateLimit } from '@/lib/rate-limit'
// 🔔 NEW: Import notification functions
import { createNewCarNotification, broadcastAdminNotification } from '@/lib/admin-notifications';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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

// Enhanced input validation
function validateCarData(data: any) {
  const errors = []
  
  // Required fields
  if (!data.make?.trim()) errors.push('Make is required')
  if (!data.model?.trim()) errors.push('Model is required')
  if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.push('Valid year is required')
  }
  if (!data.price || data.price < 0 || data.price > 1000000) {
    errors.push('Valid price is required (€0 - €1,000,000)')
  }
  if (!data.title?.trim() || data.title.length > 200) {
    errors.push('Title is required (max 200 characters)')
  }
  if (!data.description?.trim() || data.description.length > 2000) {
    errors.push('Description is required (max 2000 characters)')
  }
  if (!data.county?.trim()) errors.push('County is required')
  
  // Images validation
  if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
    errors.push('At least one image is required')
  }
  if (data.images && data.images.length > 10) {
    errors.push('Maximum 10 images allowed')
  }
  
  // Optional field validation
  if (data.mileage && (data.mileage < 0 || data.mileage > 1000000)) {
    errors.push('Invalid mileage')
  }
  if (data.engineSize && (data.engineSize < 0.1 || data.engineSize > 10)) {
    errors.push('Invalid engine size')
  }
  
  return errors
}

// Sanitize text input to prevent XSS
function sanitizeText(text: string): string {
  if (!text) return ''
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
}

// 🚀 ENHANCED GET method - Complete filtering support with fixed location logic
export async function GET(request: NextRequest) {
  try {
    // Apply search rate limiting
    await withRateLimit(request, rateLimiters.search)

    const currentUserId = await getCurrentUser(request)
    const searchParams = request.nextUrl.searchParams
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24') // 24 cars per page (good for grid layout)
    const offset = (page - 1) * limit
    
    // Basic parameters
    const featured = searchParams.get('featured')
    const sortBy = searchParams.get('sort') || 'newest'
    const searchQuery = searchParams.get('q')
    
    // 🔧 EXISTING: Basic filters (already working)
    const makeFilter = searchParams.get('make')
    const countyFilter = searchParams.get('county')
    const priceRangeFilter = searchParams.get('priceRange')
    const yearFilter = searchParams.get('year')
    
    // 🆕 NEW: Advanced filters that will now work
    const modelFilter = searchParams.get('model')
    const areaFilter = searchParams.get('area')
    const mileageFrom = searchParams.get('mileageFrom')
    const mileageTo = searchParams.get('mileageTo')
    const colorFilter = searchParams.get('color')
    const doorsFilter = searchParams.get('doors')
    const seatsFilter = searchParams.get('seats')
    const nctValid = searchParams.get('nctValid') === 'true'
    
    // 🆕 NEW: Array filters (comma-separated values)
    const fuelTypes = searchParams.get('fuelType')?.split(',').filter(Boolean) || []
    const transmissions = searchParams.get('transmission')?.split(',').filter(Boolean) || []
    const bodyTypes = searchParams.get('bodyType')?.split(',').filter(Boolean) || []
    const sellerTypes = searchParams.get('sellerType')?.split(',').filter(Boolean) || []

    console.log('🔍 Received filters:', {
      basic: { make: makeFilter, model: modelFilter, county: countyFilter, area: areaFilter },
      ranges: { price: priceRangeFilter, year: yearFilter, mileage: `${mileageFrom}-${mileageTo}` },
      arrays: { fuelTypes, transmissions, bodyTypes, sellerTypes },
      other: { color: colorFilter, doors: doorsFilter, seats: seatsFilter, nctValid }
    })

    // 🚀 ENHANCED: Build comprehensive where clause
    const where: any = {
      status: 'ACTIVE',
    }

    if (featured === 'true') {
      where.featured = true
    }

    // Text search (existing logic)
    if (searchQuery) {
      const sanitizedQuery = sanitizeText(searchQuery)
      if (sanitizedQuery) {
        where.OR = [
          { title: { contains: sanitizedQuery, mode: 'insensitive' } },
          { make: { contains: sanitizedQuery, mode: 'insensitive' } },
          { model: { contains: sanitizedQuery, mode: 'insensitive' } },
          { description: { contains: sanitizedQuery, mode: 'insensitive' } },
        ]
      }
    }

    // 🔧 EXISTING: Make filter (exact match, case-insensitive)
    if (makeFilter) {
      where.make = { equals: makeFilter, mode: 'insensitive' }
    }

    // 🆕 NEW: Model filter (exact match, case-insensitive)
    if (modelFilter) {
      where.model = { equals: modelFilter, mode: 'insensitive' }
    }

    // 🔧 FIXED: Location filtering logic - handle both county and area properly
    if (countyFilter) {
      // Use case-insensitive matching for county
      where.location = {
        path: ['county'],
        string_contains: countyFilter,
        mode: 'insensitive'
      }
    }

    // Only apply area filter if county is also selected
    if (areaFilter && countyFilter) {
      // If area is specified, we need BOTH county and area to match
      // Create a more complex filter that checks both
      if (!where.AND) where.AND = []
      where.AND.push(
        { location: { path: ['county'], string_contains: countyFilter, mode: 'insensitive' } },
        { location: { path: ['area'], string_contains: areaFilter, mode: 'insensitive' } }
      )
      // Remove the simple county filter since we're using AND now
      delete where.location
    } else if (areaFilter && !countyFilter) {
      // If only area is selected (shouldn't happen but handle it)
      where.location = {
        path: ['area'],
        string_contains: areaFilter,
        mode: 'insensitive'
      }
    }

    // 🔧 EXISTING: Price range
    if (priceRangeFilter) {
      const [minPrice, maxPrice] = priceRangeFilter.split('-').map(Number)
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        where.price = {
          gte: minPrice,
          lte: maxPrice
        }
      }
    }

    // 🔧 EXISTING: Year range
    if (yearFilter) {
      if (yearFilter.includes('-')) {
        const [startYear, endYear] = yearFilter.split('-').map(Number)
        if (!isNaN(startYear) && !isNaN(endYear)) {
          where.year = {
            gte: startYear,
            lte: endYear
          }
        }
      } else {
        const year = Number(yearFilter)
        if (!isNaN(year)) {
          where.year = year
        }
      }
    }

    // 🆕 NEW: Mileage range filter
    if (mileageFrom || mileageTo) {
      where.mileage = {}
      if (mileageFrom && !isNaN(parseInt(mileageFrom))) {
        where.mileage.gte = parseInt(mileageFrom)
      }
      if (mileageTo && !isNaN(parseInt(mileageTo))) {
        where.mileage.lte = parseInt(mileageTo)
      }
    }

    // 🆕 NEW: Fuel type filter (array support)
    if (fuelTypes.length > 0) {
      where.fuelType = { in: fuelTypes }
    }

    // 🆕 NEW: Transmission filter (array support)
    if (transmissions.length > 0) {
      where.transmission = { in: transmissions }
    }

    // 🆕 NEW: Body type filter (array support)
    if (bodyTypes.length > 0) {
      where.bodyType = { in: bodyTypes }
    }

    // 🆕 NEW: Color filter
    if (colorFilter) {
      where.color = { equals: colorFilter, mode: 'insensitive' }
    }

    // 🆕 NEW: Doors filter
    if (doorsFilter && !isNaN(parseInt(doorsFilter))) {
      where.doors = parseInt(doorsFilter)
    }

    // 🆕 NEW: Seats filter
    if (seatsFilter && !isNaN(parseInt(seatsFilter))) {
      where.seats = parseInt(seatsFilter)
    }

    // 🆕 NEW: NCT valid filter (only show cars with valid NCT)
    if (nctValid) {
      where.nctExpiry = { gte: new Date() }
    }

    // 🆕 NEW: Seller type filter (filter by user role)
    if (sellerTypes.length > 0) {
      const userConditions = []
      if (sellerTypes.includes('private')) {
        userConditions.push({ role: 'USER' })
      }
      if (sellerTypes.includes('dealership')) {
        userConditions.push({ role: 'DEALER' })
      }
      if (userConditions.length > 0) {
        where.user = { OR: userConditions }
      }
    }

    console.log('🚀 Final query where clause:', JSON.stringify(where, null, 2))

    // Get total count for pagination (before applying offset/limit)
    const totalCount = await db.car.count({ where })

    // Build orderBy clause (existing logic)
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

    // Database query (existing structure with enhanced filtering + pagination)
    const cars = await db.car.findMany({
      where,
      include: {
        images: {
          orderBy: { orderIndex: 'asc' },
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
      skip: offset,
      take: limit,
    })

    // Transform data for frontend (existing logic)
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
      slug: car.slug,
      
      // Like data
      likesCount: car.likesCount,
      isLiked: currentUserId ? car.likes.length > 0 : false,
      
      // Robust image handling
      images: car.images.length > 0 ? car.images.map(img => ({
        id: img.id,
        url: img.largeUrl,
        alt: img.altText || `${car.make} ${car.model}`,
      })) : [{
        id: 'placeholder',
        url: '/placeholder-car.jpg',
        alt: `${car.make} ${car.model}`,
      }],
      seller: {
        name: car.user.dealerProfile?.businessName || `${car.user.firstName} ${car.user.lastName}`,
        type: car.user.role === 'DEALER' ? 'dealer' : 'private',
        phone: car.user.phone || '',
        verified: car.user.dealerProfile?.verified || false,
      },
    }))

    console.log(`✅ Found ${transformedCars.length} cars on page ${page} of ${Math.ceil(totalCount / limit)} (${totalCount} total)`)

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      cars: transformedCars,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters_applied: {
        make: makeFilter,
        model: modelFilter,
        county: countyFilter,
        area: areaFilter,
        price_range: priceRangeFilter,
        year_range: yearFilter,
        fuel_types: fuelTypes.length,
        transmissions: transmissions.length,
        body_types: bodyTypes.length,
        seller_types: sellerTypes.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database error:', error)
    
    // Handle rate limit errors
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch cars',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 🔧 ENHANCED POST method - Fixed request size validation and better error handling
export async function POST(request: NextRequest) {
  try {
    // 🔧 FIXED: Check content length BEFORE parsing
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1000000) { // 1MB limit
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }

    // Apply car creation rate limiting
    await withRateLimit(request, rateLimiters.carCreation)

    // Get user from JWT token with enhanced validation
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let userId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      userId = decoded.userId
      
      // Verify user exists and is active
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true, role: true }
      })
      
      if (!user || user.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Invalid user account' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
      
      // 🔧 FIXED: Move request size check after parsing but with better logic
      const bodySize = JSON.stringify(body).length
      if (bodySize > 500000) { // 500KB limit for JSON body
        return NextResponse.json({ error: 'Request data too large' }, { status: 413 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
    }

    // Enhanced input validation
    const validationErrors = validateCarData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    const {
      make, model, year, price, mileage, fuelType, transmission, engineSize,
      bodyType, doors, seats, color, condition, previousOwners, nctExpiry,
      serviceHistory, accidentHistory, title, description, features, county, area, images
    } = body

    // Check user's daily listing limit
    const userCarCount = await db.car.count({
      where: {
        userId,
        status: 'ACTIVE',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    const maxDailyListings = 10 // Adjust based on user type
    if (userCarCount >= maxDailyListings) {
      return NextResponse.json(
        { error: 'Daily listing limit exceeded. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    // Sanitize text inputs
    const sanitizedData = {
      make: sanitizeText(make),
      model: sanitizeText(model),
      title: sanitizeText(title),
      description: sanitizeText(description),
      color: color ? sanitizeText(color) : null,
      county: sanitizeText(county),
      area: area ? sanitizeText(area) : null,
    }

    // Generate SEO-friendly slug with collision handling
    const generateSlug = async (title: string, attempt = 0): Promise<string> => {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      
      const suffix = attempt > 0 ? `-${attempt}` : ''
      const testSlug = `${baseSlug}${suffix}`
      
      // Check if slug exists
      const existing = await db.car.findUnique({ 
        where: { slug: testSlug },
        select: { id: true }
      })
      
      if (existing) {
        return generateSlug(title, attempt + 1)
      }
      
      return testSlug
    }

    // Generate unique slug
    const slug = await generateSlug(sanitizedData.title)

    // Database transaction for atomicity
    const result = await db.$transaction(async (tx) => {
      // Create car listing
      const car = await tx.car.create({
        data: {
          userId,
          title: sanitizedData.title,
          make: sanitizedData.make,
          model: sanitizedData.model,
          year: parseInt(year.toString()),
          price: parseFloat(price.toString()),
          mileage: mileage ? parseInt(mileage.toString()) : null,
          fuelType: fuelType || null,
          transmission: transmission || null,
          engineSize: engineSize ? parseFloat(engineSize.toString()) : null,
          bodyType: bodyType || null,
          doors: doors ? parseInt(doors.toString()) : null,
          seats: seats ? parseInt(seats.toString()) : null,
          color: sanitizedData.color,
          condition: condition || 'USED',
          previousOwners: previousOwners ? parseInt(previousOwners.toString()) : 1,
          nctExpiry: nctExpiry ? new Date(nctExpiry) : null,
          serviceHistory: Boolean(serviceHistory),
          accidentHistory: Boolean(accidentHistory),
          description: sanitizedData.description,
          features: Array.isArray(features) ? features.slice(0, 20) : [], // Limit features
          location: {
            county: sanitizedData.county,
            area: sanitizedData.area,
            display_location: sanitizedData.area ? `${sanitizedData.area}, ${sanitizedData.county}` : sanitizedData.county,
          },
          slug,
          status: 'ACTIVE',
          viewsCount: 0,
          inquiriesCount: 0,
          likesCount: 0,
          featured: false,
        },
      })

      // Create car images (limit to 10)
      if (images && images.length > 0) {
        await Promise.all(
          images.slice(0, 10).map((image: any, index: number) =>
            tx.carImage.create({
              data: {
                carId: car.id,
                originalUrl: image.originalUrl,
                thumbnailUrl: image.thumbnailUrl,
                mediumUrl: image.mediumUrl,
                largeUrl: image.largeUrl,
                orderIndex: index,
                altText: `${sanitizedData.title} - Image ${index + 1}`,
                fileSize: image.size || 0,
              },
            })
          )
        )
      }

      return car
    })

    // Log successful creation (for monitoring)
    console.log(`Car listing created: ${result.id} by user ${userId} at ${new Date().toISOString()}`)

    // 🔔 NEW: Fetch complete car data for response AND notification
    const completeCarData = await db.car.findUnique({
      where: { id: result.id },
      include: {
        images: { orderBy: { orderIndex: 'asc' } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            dealerProfile: {
              select: {
                businessName: true,
                verified: true
              }
            }
          },
        },
      },
    })

    // 🚗🔔 NEW: BROADCAST NOTIFICATION TO ALL ADMINS (with error handling)
    // 🔧 FIXED: Only pass ONE parameter - the complete car data
    try {
      if (completeCarData) {
        const notification = createNewCarNotification(completeCarData);
        await broadcastAdminNotification(notification);
        console.log('📡 Admin notification sent for new car:', completeCarData.id);
      }
    } catch (notificationError) {
      // Don't fail the car creation if notification fails
      console.error('❌ Failed to send admin notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Car listing created successfully',
      car: completeCarData,
    })

  } catch (error) {
    // Enhanced error logging
    console.error('Car creation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
    })

    // Handle rate limit errors
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      )
    }

    // Don't leak internal errors to client
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}