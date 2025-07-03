// src/app/api/profile/cars/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      userId: decoded.userId
    };

    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'views':
        orderBy = { viewsCount: 'desc' };
        break;
      case 'inquiries':
        orderBy = { inquiriesCount: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Fetch cars with pagination
    const [cars, totalCount] = await Promise.all([
      prisma.car.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          images: {
            orderBy: { orderIndex: 'asc' },
            take: 1,
            select: {
              originalUrl: true,
              thumbnailUrl: true,
              mediumUrl: true,
              altText: true
            }
          },
          _count: {
            select: {
              inquiries: true,
              likes: true
            }
          }
        }
      }),
      prisma.car.count({
        where: whereClause
      })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    // Transform car data for frontend
    const transformedCars = cars.map(car => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      fuelType: car.fuelType,
      transmission: car.transmission,
      bodyType: car.bodyType,
      color: car.color,
      location: car.location,
      status: car.status,
      featuredUntil: car.featuredUntil,
      views: car.viewsCount || 0,
      inquiries: car._count.inquiries,
      likes: car._count.likes,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
      images: car.images,
      // Performance metrics
      viewsPerDay: car.viewsCount && car.createdAt 
        ? Math.round((car.viewsCount / Math.max(1, Math.floor((Date.now() - car.createdAt.getTime()) / (1000 * 60 * 60 * 24)))) * 10) / 10
        : 0,
      inquiryRate: car.viewsCount && car.viewsCount > 0 
        ? Math.round((car._count.inquiries / car.viewsCount) * 100 * 10) / 10
        : 0
    }));

    return NextResponse.json({
      success: true,
      cars: transformedCars,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore,
        limit
      },
      summary: {
        total: totalCount,
        active: cars.filter(car => car.status === 'ACTIVE').length,
        sold: cars.filter(car => car.status === 'SOLD').length,
        expired: cars.filter(car => car.status === 'EXPIRED').length,
        pending: cars.filter(car => car.status === 'PENDING').length
      }
    });

  } catch (error) {
    console.error('Profile cars API error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}