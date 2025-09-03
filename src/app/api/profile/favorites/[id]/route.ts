// src/app/api/profile/favorites/[id]/route.ts
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

// DELETE /api/profile/favorites/[id] - Remove favorite
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favoriteId = params.id;

    // Verify this favorite belongs to the user
    const favorite = await prisma.favoriteCar.findFirst({
      where: {
        id: favoriteId,
        userId: user.id
      }
    });

    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    // Remove the favorite
    await prisma.favoriteCar.delete({
      where: { id: favoriteId }
    });

    return NextResponse.json({
      success: true,
      message: 'Favorite removed successfully'
    });

  } catch (error: any) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { 
        error: 'Failed to remove favorite',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}