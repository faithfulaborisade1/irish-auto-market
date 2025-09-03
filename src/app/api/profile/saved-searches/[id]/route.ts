// src/app/api/profile/saved-searches/[id]/route.ts
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

// PATCH /api/profile/saved-searches/[id] - Update saved search
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchId = params.id;
    const { alertsEnabled } = await request.json();

    // Verify this search belongs to the user
    const search = await prisma.savedSearch.findFirst({
      where: {
        id: searchId,
        userId: user.id
      }
    });

    if (!search) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    // Update the search
    const updatedSearch = await prisma.savedSearch.update({
      where: { id: searchId },
      data: { emailAlerts: alertsEnabled }
    });

    return NextResponse.json({
      success: true,
      message: 'Saved search updated successfully',
      search: {
        id: updatedSearch.id,
        alertsEnabled: updatedSearch.emailAlerts
      }
    });

  } catch (error: any) {
    console.error('Error updating saved search:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update saved search',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}