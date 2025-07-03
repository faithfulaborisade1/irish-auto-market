// src/app/api/admin/dashboard/stats/route.ts - REAL DATABASE DASHBOARD API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📊 Fetching real dashboard data from database...');

    // Fetch real data from your Neon database
    const [
      totalUsers,
      totalCars,
      activeCars,
      pendingCars,
      totalDealers,
      recentUsers,
      recentCars,
      featuredListings
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Total cars count
      prisma.car.count(),
      
      // Active cars (status = ACTIVE)
      prisma.car.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Pending cars (moderationStatus = PENDING)
      prisma.car.count({
        where: { moderationStatus: 'PENDING' }
      }),
      
      // Total dealers (users with role DEALER)
      prisma.user.count({
        where: { role: 'DEALER' }
      }),
      
      // Recent users (last 10, with profiles)
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          status: true
        }
      }),
      
      // Recent cars (last 10, with user info)
      prisma.car.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          make: true,
          model: true,
          year: true,
          price: true,
          status: true,
          moderationStatus: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      
      // Featured listings for revenue calculation
      prisma.featuredListing.findMany({
        where: {
          status: 'ACTIVE',
          paymentStatus: 'COMPLETED'
        },
        select: {
          pricePaid: true,
          currency: true,
          createdAt: true
        }
      })
    ]);

    // Calculate revenue
    const totalRevenue = featuredListings.reduce((sum, listing) => {
      return sum + Number(listing.pricePaid);
    }, 0);

    // Calculate monthly revenue (current month)
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const monthlyRevenue = featuredListings
      .filter(listing => new Date(listing.createdAt) >= startOfMonth)
      .reduce((sum, listing) => sum + Number(listing.pricePaid), 0);

    // Prepare response data
    const dashboardData = {
      // Main stats
      totalUsers,
      totalCars,
      activeCars,
      pendingCars,
      totalDealers,
      
      // Revenue
      totalRevenue,
      monthlyRevenue,
      
      // Recent activity
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      })),
      
      recentCars: recentCars.map(car => ({
        id: car.id,
        title: car.title,
        make: car.make,
        model: car.model,
        year: car.year,
        price: Number(car.price),
        status: car.status,
        moderationStatus: car.moderationStatus,
        createdAt: car.createdAt,
        owner: car.user ? `${car.user.firstName} ${car.user.lastName}`.trim() : 'Unknown'
      })),
      
      // Additional analytics
      stats: {
        userGrowthToday: await getUserGrowthToday(),
        carsAddedToday: await getCarsAddedToday(),
        pendingActions: pendingCars + await getPendingDealerVerifications()
      }
    };

    console.log('✅ Dashboard data successfully fetched:', {
      totalUsers,
      totalCars,
      activeCars,
      pendingCars,
      totalDealers,
      totalRevenue,
      monthlyRevenue
    });

    return NextResponse.json(dashboardData);

  } catch (error: any) {
    console.error('❌ Dashboard API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load dashboard data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper functions for additional stats
async function getUserGrowthToday(): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await prisma.user.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });
  } catch (error) {
    return 0;
  }
}

async function getCarsAddedToday(): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await prisma.car.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });
  } catch (error) {
    return 0;
  }
}

async function getPendingDealerVerifications(): Promise<number> {
  try {
    return await prisma.dealerProfile.count({
      where: {
        verified: false
      }
    });
  } catch (error) {
    return 0;
  }
}

// Auth verification function
async function verifyAdminAuth(request: NextRequest): Promise<{
  success: boolean;
  adminId?: string;
  reason?: string;
}> {
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      return { success: false, reason: 'no_token' };
    }

    // Basic JWT validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { success: false, reason: 'invalid_token_format' };
    }

    try {
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return { success: false, reason: 'token_expired' };
      }

      // Validate required fields
      if (!payload.userId || !payload.role || !payload.isAdmin) {
        return { success: false, reason: 'invalid_payload' };
      }

      return { 
        success: true, 
        adminId: payload.userId
      };
    } catch (decodeError) {
      return { success: false, reason: 'token_decode_failed' };
    }
  } catch (error: any) {
    return { success: false, reason: 'auth_error' };
  }
}

function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get('admin-token')?.value || 
         request.cookies.get('auth-token')?.value || 
         null;
}