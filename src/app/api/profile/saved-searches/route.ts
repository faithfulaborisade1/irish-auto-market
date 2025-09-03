// src/app/api/profile/saved-searches/route.ts
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

// GET /api/profile/saved-searches - Get user's saved searches
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    // For each saved search, count matching cars (simplified)
    const searchesWithCounts = await Promise.all(
      savedSearches.map(async (search) => {
        // Basic car count - in reality you'd apply the actual filters
        const matchCount = await prisma.car.count({
          where: {
            status: 'ACTIVE',
            // Here you would apply the filters from search.filters
            // For now, just return total active cars as a placeholder
          }
        });

        return {
          id: search.id,
          name: search.name,
          filters: search.searchCriteria,
          alertsEnabled: search.emailAlerts,
          matchCount,
          createdAt: search.createdAt.toISOString()
        };
      })
    );

    return NextResponse.json({
      success: true,
      searches: searchesWithCounts
    });

  } catch (error: any) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch saved searches',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}