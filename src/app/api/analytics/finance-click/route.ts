// src/app/api/analytics/finance-click/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';

// Get current user from JWT token (optional - clicks can be anonymous)
async function getCurrentUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };

    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.firstName && decoded.lastName
        ? `${decoded.firstName} ${decoded.lastName}`
        : undefined
    };
  } catch (error) {
    return null;
  }
}

// Helper to get device type from user agent
function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

// Helper to get browser info
function getBrowserInfo(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getCurrentUser(request);

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown';

    // Extract car and dealer info from the request body
    const {
      carId,
      carMake,
      carModel,
      carYear,
      carPrice,
      dealerId,
      dealerName,
      sourceUrl
    } = body;

    // Create the finance click record
    const financeClick = await db.financeClick.create({
      data: {
        // User info (if logged in)
        userId: user?.userId,
        userEmail: user?.email,
        userName: user?.name,

        // Car info (if applicable)
        carId,
        carMake,
        carModel,
        carYear: carYear ? parseInt(carYear) : null,
        carPrice: carPrice ? parseFloat(carPrice) : null,

        // Dealer info (if applicable)
        dealerId,
        dealerName,

        // Context
        sourceUrl: sourceUrl || referer,
        referrer: referer,
        device: getDeviceType(userAgent),
        browser: getBrowserInfo(userAgent),
        ipAddress,
        userAgent,
      }
    });

    console.log('✅ Finance click tracked:', {
      id: financeClick.id,
      user: user?.userId || 'anonymous',
      car: carId || 'none',
      source: sourceUrl || referer
    });

    return NextResponse.json({
      success: true,
      clickId: financeClick.id
    });

  } catch (error: any) {
    console.error('❌ Error tracking finance click:', error);

    // Don't fail the user's request if tracking fails
    // Just log the error and return success
    return NextResponse.json({
      success: true,
      error: 'Tracking failed but request continued'
    });
  }
}

// GET endpoint to retrieve finance click statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('admin-token')?.value ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!decoded.isAdmin && decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7days'; // 7days, 30days, all
    const carId = searchParams.get('carId');
    const dealerId = searchParams.get('dealerId');

    // Calculate date range
    let dateFilter = {};
    const now = new Date();

    if (period === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: weekAgo };
    } else if (period === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: monthAgo };
    }

    // Build where clause
    const where: any = {};
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }
    if (carId) where.carId = carId;
    if (dealerId) where.dealerId = dealerId;

    // Get total clicks
    const totalClicks = await db.financeClick.count({ where });

    // Get clicks by day
    const clicks = await db.financeClick.findMany({
      where,
      select: {
        id: true,
        carId: true,
        carMake: true,
        carModel: true,
        carPrice: true,
        dealerId: true,
        dealerName: true,
        device: true,
        browser: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by car
    const clicksByCar = clicks.reduce((acc: any, click) => {
      if (click.carId) {
        if (!acc[click.carId]) {
          acc[click.carId] = {
            carId: click.carId,
            make: click.carMake,
            model: click.carModel,
            price: click.carPrice,
            clicks: 0
          };
        }
        acc[click.carId].clicks++;
      }
      return acc;
    }, {});

    // Group by dealer
    const clicksByDealer = clicks.reduce((acc: any, click) => {
      if (click.dealerId) {
        if (!acc[click.dealerId]) {
          acc[click.dealerId] = {
            dealerId: click.dealerId,
            name: click.dealerName,
            clicks: 0
          };
        }
        acc[click.dealerId].clicks++;
      }
      return acc;
    }, {});

    // Device breakdown
    const deviceBreakdown = clicks.reduce((acc: any, click) => {
      const device = click.device || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    // Browser breakdown
    const browserBreakdown = clicks.reduce((acc: any, click) => {
      const browser = click.browser || 'unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});

    // Unique users
    const uniqueUsers = new Set(clicks.filter(c => c.userId).map(c => c.userId)).size;
    const anonymousClicks = clicks.filter(c => !c.userId).length;

    return NextResponse.json({
      success: true,
      period,
      summary: {
        totalClicks,
        uniqueUsers,
        anonymousClicks,
        conversionRate: 0, // Can be calculated if you track actual applications
      },
      clicksByCar: Object.values(clicksByCar).sort((a: any, b: any) => b.clicks - a.clicks),
      clicksByDealer: Object.values(clicksByDealer).sort((a: any, b: any) => b.clicks - a.clicks),
      deviceBreakdown,
      browserBreakdown,
      recentClicks: clicks.slice(0, 20).map(c => ({
        id: c.id,
        car: c.carMake && c.carModel ? `${c.carMake} ${c.carModel}` : 'Homepage',
        dealer: c.dealerName || 'N/A',
        device: c.device,
        timestamp: c.createdAt,
        user: c.userId ? 'Logged in' : 'Anonymous'
      }))
    });

  } catch (error: any) {
    console.error('❌ Error fetching finance click stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
