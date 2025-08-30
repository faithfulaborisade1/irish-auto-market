// src/app/api/admin/analytics/vercel/route.ts - WEB ANALYTICS INTEGRATION  
import { NextRequest, NextResponse } from 'next/server';
import { getWebAnalytics } from '@/lib/analytics';

// Admin Authentication Helper Functions
async function verifyAdminAuth(request: NextRequest): Promise<{
  success: boolean;
  admin?: { id: string };
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
        admin: { id: payload.userId }
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

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await verifyAdminAuth(request);
    if (!adminUser.success || !adminUser.admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 24h, 7d, 30d, 90d

    console.log(`📊 Fetching web analytics for period: ${period}`);

    try {
      // Get real analytics data from our database
      const analytics = await getWebAnalytics(period);
      
      // Calculate percentages for devices and browsers
      const totalDeviceVisits = analytics.devices.reduce((sum, d) => sum + d.visits, 0);
      const totalBrowserVisits = analytics.browsers.reduce((sum, b) => sum + b.visits, 0);
      
      analytics.devices.forEach(device => {
        device.percentage = totalDeviceVisits > 0 
          ? Math.round((device.visits / totalDeviceVisits) * 100 * 100) / 100 
          : 0;
      });
      
      analytics.browsers.forEach(browser => {
        browser.percentage = totalBrowserVisits > 0 
          ? Math.round((browser.visits / totalBrowserVisits) * 100 * 100) / 100 
          : 0;
      });

      return NextResponse.json({
        success: true,
        data: {
          ...analytics,
          metadata: {
            period,
            fetchedAt: new Date().toISOString(),
            source: 'database',
            note: 'Real analytics data from visitor tracking'
          }
        }
      });

    } catch (dbError) {
      console.error('❌ Database analytics error:', dbError);
      
      // NO MOCK DATA - Return zeros for real analytics
      console.error('⚠️ Returning zero analytics - NO MOCK DATA for production dashboard');
      
      return NextResponse.json({
        success: true,
        data: {
          pageViews: { 
            total: 0, 
            trend: [] 
          },
          uniqueVisitors: { 
            total: 0, 
            trend: [] 
          },
          topPages: [],
          countries: [],
          devices: [],
          browsers: [],
          sessions: {
            total: 0,
            avgDuration: 0,
            bounceRate: 0
          },
          metadata: {
            period,
            fetchedAt: new Date().toISOString(),
            source: 'database_error',
            note: 'Database error - showing real zeros instead of mock data',
            error: dbError instanceof Error ? dbError.message : 'Unknown database error'
          }
        }
      });
    }

  } catch (error: any) {
    console.error('Vercel Analytics Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch Vercel Analytics data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to generate mock trend data
function generateMockTrend(period: string) {
  const points = period === '24h' ? 24 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const trend = [];
  
  for (let i = points; i > 0; i--) {
    const date = new Date();
    if (period === '24h') {
      date.setHours(date.getHours() - i);
    } else {
      date.setDate(date.getDate() - i);
    }
    
    trend.push({
      date: date.toISOString(),
      value: Math.floor(Math.random() * 1000) + 100
    });
  }
  
  return trend;
}