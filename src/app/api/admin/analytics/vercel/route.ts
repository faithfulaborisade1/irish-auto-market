// src/app/api/admin/analytics/vercel/route.ts - VERCEL ANALYTICS INTEGRATION
import { NextRequest, NextResponse } from 'next/server';

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

    const vercelToken = process.env.VERCEL_ANALYTICS_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;
    
    if (!vercelToken) {
      console.warn('Vercel Analytics token not configured');
      return NextResponse.json({
        success: true,
        data: {
          pageViews: { total: 0, trend: [] },
          uniqueVisitors: { total: 0, trend: [] },
          topPages: [],
          countries: [],
          devices: [],
          browsers: [],
          referrers: [],
          note: 'Vercel Analytics not configured - add VERCEL_ANALYTICS_TOKEN to environment variables'
        }
      });
    }

    // Calculate date range
    const now = new Date();
    let since: Date;
    
    switch (period) {
      case '24h':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const sinceISO = since.toISOString();
    const untilISO = now.toISOString();

    // Build Vercel Analytics API URL
    const baseUrl = 'https://vercel.com/api/web/insights';
    const params = new URLSearchParams({
      since: sinceISO,
      until: untilISO,
      timezone: 'UTC'
    });

    if (teamId) {
      params.append('teamId', teamId);
    }

    const headers = {
      'Authorization': `Bearer ${vercelToken}`,
      'Content-Type': 'application/json'
    };

    try {
      // Fetch multiple analytics endpoints in parallel
      const [pageViewsRes, visitorsRes, topPagesRes, countriesRes, devicesRes] = await Promise.allSettled([
        // Page Views
        fetch(`${baseUrl}/views?${params}`, { headers }),
        
        // Unique Visitors
        fetch(`${baseUrl}/visitors?${params}`, { headers }),
        
        // Top Pages
        fetch(`${baseUrl}/pages?${params}&limit=20`, { headers }),
        
        // Top Countries
        fetch(`${baseUrl}/countries?${params}&limit=20`, { headers }),
        
        // Device Types
        fetch(`${baseUrl}/devices?${params}&limit=10`, { headers }),
      ]);

      // Process results
      const analytics: any = {
        pageViews: { total: 0, trend: [] },
        uniqueVisitors: { total: 0, trend: [] },
        topPages: [],
        countries: [],
        devices: [],
        browsers: [],
        referrers: [],
        metadata: {
          period,
          since: sinceISO,
          until: untilISO,
          fetchedAt: new Date().toISOString()
        }
      };

      // Page Views
      if (pageViewsRes.status === 'fulfilled' && pageViewsRes.value.ok) {
        const data = await pageViewsRes.value.json();
        analytics.pageViews = {
          total: data.total || 0,
          trend: data.trend || []
        };
      }

      // Unique Visitors
      if (visitorsRes.status === 'fulfilled' && visitorsRes.value.ok) {
        const data = await visitorsRes.value.json();
        analytics.uniqueVisitors = {
          total: data.total || 0,
          trend: data.trend || []
        };
      }

      // Top Pages
      if (topPagesRes.status === 'fulfilled' && topPagesRes.value.ok) {
        const data = await topPagesRes.value.json();
        analytics.topPages = data.pages || [];
      }

      // Countries
      if (countriesRes.status === 'fulfilled' && countriesRes.value.ok) {
        const data = await countriesRes.value.json();
        analytics.countries = data.countries || [];
      }

      // Devices
      if (devicesRes.status === 'fulfilled' && devicesRes.value.ok) {
        const data = await devicesRes.value.json();
        analytics.devices = data.devices || [];
      }

      return NextResponse.json({
        success: true,
        data: analytics
      });

    } catch (apiError: any) {
      console.error('Vercel Analytics API Error:', apiError);
      
      // Return mock data structure for development
      return NextResponse.json({
        success: true,
        data: {
          pageViews: { 
            total: Math.floor(Math.random() * 50000) + 10000, 
            trend: generateMockTrend(period) 
          },
          uniqueVisitors: { 
            total: Math.floor(Math.random() * 15000) + 3000, 
            trend: generateMockTrend(period) 
          },
          topPages: [
            { path: '/', views: 12543, title: 'Homepage' },
            { path: '/cars', views: 8921, title: 'Browse Cars' },
            { path: '/cars/search', views: 6784, title: 'Search Results' },
            { path: '/dealers', views: 4321, title: 'Dealers' },
            { path: '/about', views: 2156, title: 'About Us' }
          ],
          countries: [
            { country: 'IE', visits: 15432, name: 'Ireland' },
            { country: 'GB', visits: 3421, name: 'United Kingdom' },
            { country: 'US', visits: 1876, name: 'United States' },
            { country: 'DE', visits: 987, name: 'Germany' },
            { country: 'FR', visits: 654, name: 'France' }
          ],
          devices: [
            { device: 'desktop', visits: 12345, percentage: 65.2 },
            { device: 'mobile', visits: 5432, percentage: 28.7 },
            { device: 'tablet', visits: 1234, percentage: 6.1 }
          ],
          browsers: [
            { browser: 'chrome', visits: 14567, percentage: 76.8 },
            { browser: 'safari', visits: 2876, percentage: 15.2 },
            { browser: 'firefox', visits: 987, percentage: 5.2 },
            { browser: 'edge', visits: 543, percentage: 2.8 }
          ],
          referrers: [
            { source: 'google.com', visits: 8765, percentage: 46.3 },
            { source: 'facebook.com', visits: 3421, percentage: 18.1 },
            { source: 'direct', visits: 2987, percentage: 15.8 },
            { source: 'twitter.com', visits: 1234, percentage: 6.5 }
          ],
          note: 'Using mock data - Vercel Analytics API unavailable',
          error: apiError.message
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