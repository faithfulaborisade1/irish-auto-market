// src/app/api/profile/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    return user;
  } catch (error) {
    return null;
  }
}

// GET /api/profile/favorites - Get user's favorite cars
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.favoriteCar.findMany({
      where: { userId: user.id },
      include: {
        car: {
          include: {
            images: {
              select: {
                thumbnailUrl: true
              },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      favorites: favorites.map(fav => ({
        id: fav.id,
        car: {
          id: fav.car.id,
          title: fav.car.title,
          make: fav.car.make,
          model: fav.car.model,
          year: fav.car.year,
          price: Number(fav.car.price),
          images: fav.car.images.map(img => ({ thumbnailUrl: img.thumbnailUrl })),
          location: fav.car.location
        },
        createdAt: fav.createdAt.toISOString()
      }))
    });

  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch favorites',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}