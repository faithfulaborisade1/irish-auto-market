// src/app/api/profile/saved-cars/route.ts
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
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Get query parameters for filtering and sorting
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';

    // First, try to get from FavoriteCar table (if it exists)
    let favoriteCars: any[] = [];
    try {
      favoriteCars = await prisma.favoriteCar.findMany({
        where: {
          userId: decoded.userId,
          car: {
            // Add search filter if provided
            ...(search && {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { make: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { color: { contains: search, mode: 'insensitive' } }
              ]
            })
          }
        },
        include: {
          car: {
            include: {
              images: {
                orderBy: { orderIndex: 'asc' },
                take: 1,
                select: {
                  id: true,
                  thumbnailUrl: true,
                  mediumUrl: true,
                  largeUrl: true,
                  altText: true
                }
              },
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  role: true,
                  dealerProfile: {
                    select: {
                      businessName: true,
                      verified: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.log('FavoriteCar table might not exist, trying CarLike...');
    }

    // Also try CarLike table (your like system)
    let likedCars: any[] = [];
    try {
      likedCars = await prisma.carLike.findMany({
        where: {
          userId: decoded.userId,
          car: {
            // Add search filter if provided
            ...(search && {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { make: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { color: { contains: search, mode: 'insensitive' } }
              ]
            })
          }
        },
        include: {
          car: {
            include: {
              images: {
                orderBy: { orderIndex: 'asc' },
                take: 1,
                select: {
                  id: true,
                  thumbnailUrl: true,
                  mediumUrl: true,
                  largeUrl: true,
                  altText: true
                }
              },
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  role: true,
                  dealerProfile: {
                    select: {
                      businessName: true,
                      verified: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.log('CarLike table might not exist');
    }

    // Combine and deduplicate saved cars
    const allSavedCars: any[] = [];
    const seenCarIds = new Set<string>();

    // Add favorite cars first
    for (const favorite of favoriteCars) {
      if (!seenCarIds.has(favorite.carId)) {
        allSavedCars.push({
          id: favorite.id,
          carId: favorite.carId,
          createdAt: favorite.createdAt,
          car: favorite.car
        });
        seenCarIds.add(favorite.carId);
      }
    }

    // Add liked cars (if not already added)
    for (const like of likedCars) {
      if (!seenCarIds.has(like.carId)) {
        allSavedCars.push({
          id: like.id,
          carId: like.carId,
          createdAt: like.createdAt,
          car: like.car
        });
        seenCarIds.add(like.carId);
      }
    }

    // Sort the results
    allSavedCars.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_low':
          return a.car.price - b.car.price;
        case 'price_high':
          return b.car.price - a.car.price;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return NextResponse.json({
      success: true,
      savedCars: allSavedCars,
      total: allSavedCars.length
    });

  } catch (error) {
    console.error('Error fetching saved cars:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saved cars' },
      { status: 500 }
    );
  }
}

// Optional: Add endpoint to remove a car from saved list
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const body = await request.json();
    const { carId } = body;

    if (!carId) {
      return NextResponse.json(
        { success: false, error: 'Car ID is required' },
        { status: 400 }
      );
    }

    // Try to remove from both tables (if they exist)
    try {
      await prisma.favoriteCar.deleteMany({
        where: {
          userId: decoded.userId,
          carId: carId
        }
      });
    } catch (error) {
      console.log('FavoriteCar table might not exist');
    }

    try {
      await prisma.carLike.deleteMany({
        where: {
          userId: decoded.userId,
          carId: carId
        }
      });
    } catch (error) {
      console.log('CarLike table might not exist');
    }

    return NextResponse.json({
      success: true,
      message: 'Car removed from saved list'
    });

  } catch (error) {
    console.error('Error removing saved car:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to remove saved car' },
      { status: 500 }
    );
  }
}