// src/app/api/admin/cars/route.ts - Admin Cars Management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Search and filters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const moderationStatus = searchParams.get('moderationStatus');
    const condition = searchParams.get('condition');
    const fuelType = searchParams.get('fuelType');
    const make = searchParams.get('make');
    const userType = searchParams.get('userType');
    const featured = searchParams.get('featured');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');

    // Build where clause
    const where: any = {};

    // Search across title, make, model, and user details
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { user: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { dealerProfile: { businessName: { contains: search, mode: 'insensitive' } } }
          ]
        }}
      ];
    }

    // Status filters
    if (status && status !== 'all') {
      where.status = status;
    }

    if (moderationStatus && moderationStatus !== 'all') {
      where.moderationStatus = moderationStatus;
    }

    if (condition && condition !== 'all') {
      where.condition = condition;
    }

    if (fuelType && fuelType !== 'all') {
      where.fuelType = fuelType;
    }

    if (make && make !== 'all') {
      where.make = make;
    }

    if (userType && userType !== 'all') {
      where.user = { role: userType };
    }

    if (featured && featured !== 'all') {
      where.featured = featured === 'true';
    }

    // Price range
    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price.gte = parseFloat(priceMin);
      if (priceMax) where.price.lte = parseFloat(priceMax);
    }

    // Get total count for pagination
    const totalCount = await prisma.car.count({ where });

    // Fetch cars with all required relations
    const cars = await prisma.car.findMany({
      where,
      include: {
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
                verified: true,
              }
            }
          }
        },
        images: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            originalUrl: true,
            thumbnailUrl: true,
            altText: true,
            orderIndex: true,
          }
        }
      },
      orderBy: [
        { featured: 'desc' }, // Featured cars first
        { createdAt: 'desc' }  // Then by newest
      ],
      skip: offset,
      take: limit,
    });

    // Transform the data to include computed fields
    const transformedCars = cars.map(car => ({
      ...car,
      price: Number(car.price), // Convert Decimal to number for JSON
      engineSize: car.engineSize ? Number(car.engineSize) : null,
      mainImage: car.images.length > 0 ? car.images[0].thumbnailUrl || car.images[0].originalUrl : null,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      cars: transformedCars,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    });

  } catch (error) {
    console.error('Error fetching admin cars:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cars',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}