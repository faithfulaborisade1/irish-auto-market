// src/app/api/profile/analytics/route.ts - SCHEMA-CORRECT VERSION
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// ✅ FIX: Force dynamic rendering for cookie access
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Type definitions
interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
}

interface MonthlyData {
  [key: string]: {
    listings: number;
    views: number;
    inquiries: number;
  };
}

interface PerformanceMetrics {
  averageViewsPerListing: number;
  averageInquiriesPerListing: number;
  conversionRate: number;
  activeListings: number;
  soldListings: number;
  likesPerListing: number;
}

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
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's cars with view and inquiry counts
    const userCars = await prisma.car.findMany({
      where: { userId: decoded.userId },
      select: {
        id: true,
        make: true,
        model: true,
        price: true,
        viewsCount: true,
        inquiriesCount: true,
        likesCount: true,
        createdAt: true,
        status: true
      }
    });

    // Calculate total views and inquiries
    const totalViews = userCars.reduce((sum, car) => sum + (car.viewsCount || 0), 0);
    const totalInquiries = userCars.reduce((sum, car) => sum + (car.inquiriesCount || 0), 0);
    const totalLikes = userCars.reduce((sum, car) => sum + (car.likesCount || 0), 0);

    // Calculate average price
    const activeCars = userCars.filter(car => car.status === 'ACTIVE');
    const averagePrice = activeCars.length > 0 
      ? activeCars.reduce((sum, car) => sum + Number(car.price), 0) / activeCars.length 
      : 0;

    // Find most popular make
    const makeCount: { [key: string]: number } = {};
    userCars.forEach(car => {
      makeCount[car.make] = (makeCount[car.make] || 0) + 1;
    });
    const popularMake = Object.keys(makeCount).reduce((a, b) => 
      makeCount[a] > makeCount[b] ? a : b, Object.keys(makeCount)[0] || 'None'
    );

    // Get recent activity
    const recentActivity: ActivityItem[] = [];

    // Recent car listings
    const recentCars = await prisma.car.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        make: true,
        model: true,
        createdAt: true,
        status: true
      }
    });

    recentCars.forEach(car => {
      recentActivity.push({
        type: 'CAR_LISTED',
        description: `Listed ${car.make} ${car.model}`,
        timestamp: car.createdAt.toISOString()
      });
    });

    // Recent inquiries received (about user's cars)
    const recentInquiries = await prisma.carInquiry.findMany({
      where: { 
        car: {
          userId: decoded.userId
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        car: {
          select: { make: true, model: true }
        },
        buyer: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    recentInquiries.forEach(inquiry => {
      recentActivity.push({
        type: 'INQUIRY_RECEIVED',
        description: `Received inquiry from ${inquiry.buyer.firstName} for ${inquiry.car.make} ${inquiry.car.model}`,
        timestamp: inquiry.createdAt.toISOString()
      });
    });

    // Recent favorites (for buyers)
    const recentFavorites = await prisma.favoriteCar.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        car: {
          select: { make: true, model: true }
        }
      }
    });

    recentFavorites.forEach(favorite => {
      recentActivity.push({
        type: 'CAR_FAVORITED',
        description: `Added ${favorite.car.make} ${favorite.car.model} to favorites`,
        timestamp: favorite.createdAt.toISOString()
      });
    });

    // Recent messages (conversations where user participated)
    const recentMessages = await prisma.message.findMany({
      where: { 
        OR: [
          { senderId: decoded.userId },
          { 
            conversation: { 
              OR: [
                { buyerId: decoded.userId },
                { sellerId: decoded.userId }
              ]
            }
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        conversation: {
          include: {
            car: {
              select: { make: true, model: true }
            }
          }
        }
      }
    });

    recentMessages.forEach(message => {
      const isOwn = message.senderId === decoded.userId;
      recentActivity.push({
        type: isOwn ? 'MESSAGE_SENT' : 'MESSAGE_RECEIVED',
        description: `${isOwn ? 'Sent' : 'Received'} message about ${message.conversation.car.make} ${message.conversation.car.model}`,
        timestamp: message.createdAt.toISOString()
      });
    });

    // Sort recent activity by timestamp (newest first)
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Monthly data for charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyListings = await prisma.car.findMany({
      where: {
        userId: decoded.userId,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true,
        viewsCount: true,
        inquiriesCount: true
      }
    });

    // Group by month
    const monthlyData: MonthlyData = {};
    
    monthlyListings.forEach(car => {
      const monthKey = car.createdAt.toISOString().substring(0, 7); // YYYY-MM format
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { listings: 0, views: 0, inquiries: 0 };
      }
      monthlyData[monthKey].listings += 1;
      monthlyData[monthKey].views += car.viewsCount || 0;
      monthlyData[monthKey].inquiries += car.inquiriesCount || 0;
    });

    // Performance metrics
    const performanceMetrics: PerformanceMetrics = {
      averageViewsPerListing: activeCars.length > 0 ? totalViews / activeCars.length : 0,
      averageInquiriesPerListing: activeCars.length > 0 ? totalInquiries / activeCars.length : 0,
      conversionRate: totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0,
      activeListings: activeCars.length,
      soldListings: userCars.filter(car => car.status === 'SOLD').length,
      likesPerListing: activeCars.length > 0 ? totalLikes / activeCars.length : 0
    };

    return NextResponse.json({
      success: true,
      analytics: {
        totalViews,
        totalInquiries,
        totalLikes,
        averagePrice,
        popularMake,
        recentActivity: recentActivity.slice(0, 10), // Limit to 10 most recent
        monthlyData,
        performanceMetrics,
        summary: {
          totalCars: userCars.length,
          activeCars: activeCars.length,
          totalViews,
          totalInquiries,
          totalLikes,
          averagePrice: Math.round(averagePrice),
          popularMake
        }
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    
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