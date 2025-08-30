// src/app/api/admin/analytics/seed-test-data/route.ts - Add test analytics data
import { NextRequest, NextResponse } from 'next/server';
import { trackPageView } from '@/lib/analytics';

// Admin Authentication Helper
async function verifyAdminAuth(request: NextRequest): Promise<{
  success: boolean;
  admin?: { id: string };
  reason?: string;
}> {
  try {
    const token = request.cookies.get('admin-token')?.value || 
                 request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return { success: false, reason: 'no_token' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { success: false, reason: 'invalid_token_format' };
    }

    try {
      const payload = JSON.parse(atob(parts[1]));
      
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return { success: false, reason: 'token_expired' };
      }

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

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await verifyAdminAuth(request);
    if (!adminUser.success || !adminUser.admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🌱 Seeding test analytics data...');

    // Sample page visits to track
    const testVisits = [
      { path: '/', title: 'Irish Auto Market - Homepage', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
      { path: '/cars', title: 'Browse Cars - Irish Auto Market', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15' },
      { path: '/cars/search', title: 'Search Cars', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0' },
      { path: '/dealers', title: 'Car Dealers Ireland', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1' },
      { path: '/about', title: 'About Us - Irish Auto Market', userAgent: 'Mozilla/5.0 (Android 11; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0' },
      { path: '/', title: 'Irish Auto Market - Homepage', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
      { path: '/cars', title: 'Browse Cars - Irish Auto Market', userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1' },
    ];

    let successCount = 0;
    let errorCount = 0;

    // Track each visit with slight time delays
    for (let i = 0; i < testVisits.length; i++) {
      const visit = testVisits[i];
      
      try {
        await trackPageView({
          path: visit.path,
          title: visit.title,
          referrer: i === 0 ? 'https://google.com' : undefined,
          userAgent: visit.userAgent,
          ipAddress: `192.168.1.${100 + i}`, // Mock different IPs
          userId: undefined, // Anonymous visits
        });
        
        successCount++;
        console.log(`✅ Tracked: ${visit.path}`);
        
        // Small delay between visits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to track ${visit.path}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Test analytics data seeded successfully`,
      details: {
        totalVisits: testVisits.length,
        successful: successCount,
        errors: errorCount,
        note: 'You can now refresh your admin analytics dashboard to see real data'
      }
    });

  } catch (error: any) {
    console.error('❌ Seed test data error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed test data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}