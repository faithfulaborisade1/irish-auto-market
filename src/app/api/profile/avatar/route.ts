// src/app/api/profile/avatar/route.ts
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

// POST /api/profile/avatar - Update user avatar
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { avatarUrl } = await request.json();

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json(
        { error: 'Valid avatar URL is required' }, 
        { status: 400 }
      );
    }

    // Update user avatar
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl }
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: updatedUser.avatar
    });

  } catch (error: any) {
    console.error('Error updating avatar:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update avatar',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}