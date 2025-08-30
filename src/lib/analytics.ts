// src/lib/analytics.ts - Visitor Tracking Library
import { prisma } from '@/lib/prisma';
import { UAParser } from 'ua-parser-js';

interface TrackPageViewParams {
  path: string;
  title?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  extraData?: Record<string, any>;
}

interface VisitorInfo {
  fingerprint: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  browserVersion?: string;
  device?: string;
  deviceType?: string;
  os?: string;
  osVersion?: string;
  country?: string;
  countryCode?: string;
  city?: string;
}

// Generate a browser fingerprint (enhanced version for better uniqueness)
export function generateFingerprint(userAgent?: string, ipAddress?: string, extraData?: Record<string, any>): string {
  const components = [
    userAgent || '',
    ipAddress || '',
    // Add timestamp-based component for better uniqueness when other factors are same
    Date.now().toString().slice(-6), // Last 6 digits of timestamp
    // Random component to ensure uniqueness for simultaneous visits
    Math.random().toString(36).substring(2, 8),
    // Screen resolution if available
    extraData?.screenResolution || '',
    // Timezone offset if available  
    extraData?.timezoneOffset?.toString() || '',
    // Language if available
    extraData?.language || '',
  ].filter(Boolean);
  
  return btoa(components.join('|')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

// Parse user agent to extract device info
export function parseUserAgent(userAgent?: string) {
  if (!userAgent) return {};
  
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    browser: result.browser.name,
    browserVersion: result.browser.version,
    device: result.device.model || 'Unknown',
    deviceType: result.device.type || (result.os.name?.includes('Mobile') ? 'mobile' : 'desktop'),
    os: result.os.name,
    osVersion: result.os.version,
  };
}

// Get location info from IP address (mock for now)
export async function getLocationFromIP(ipAddress?: string) {
  // In production, you'd use a service like ipapi.co or geoip
  // For now, return mock data for Ireland
  return {
    country: 'Ireland',
    countryCode: 'IE',
    city: 'Dublin',
  };
}

// Main function to track page views
export async function trackPageView(params: TrackPageViewParams) {
  try {
    const {
      path,
      title,
      referrer,
      userAgent,
      ipAddress,
      userId,
      extraData,
    } = params;

    // Parse user agent for device info
    const deviceInfo = parseUserAgent(userAgent);
    
    // Get location info
    const locationInfo = await getLocationFromIP(ipAddress);
    
    // Generate visitor fingerprint with enhanced data
    const fingerprint = generateFingerprint(userAgent, ipAddress, extraData);
    
    // Find or create visitor
    let visitor = await prisma.visitor.findUnique({
      where: { fingerprint },
      include: {
        sessions: {
          where: {
            endedAt: null, // Active session
          },
          orderBy: {
            startedAt: 'desc'
          },
          take: 1
        }
      }
    });

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    if (!visitor) {
      // Create new visitor
      visitor = await prisma.visitor.create({
        data: {
          fingerprint,
          ipAddress,
          userAgent,
          ...deviceInfo,
          ...locationInfo,
          firstVisitAt: now,
          lastVisitAt: now,
          totalVisits: 1,
          totalPageViews: 1,
        },
        include: {
          sessions: {
            where: { endedAt: null },
            orderBy: { startedAt: 'desc' },
            take: 1
          }
        }
      });
    } else {
      // Update existing visitor
      await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          lastVisitAt: now,
          totalPageViews: { increment: 1 },
          // Update location if changed
          ...locationInfo,
        }
      });
    }

    // Handle session
    let session = visitor.sessions[0];
    const isNewSession = !session || (session.lastActivityAt && session.lastActivityAt < thirtyMinutesAgo);

    if (isNewSession) {
      // Create new session
      if (session) {
        // End previous session
        const sessionDuration = session.lastActivityAt 
          ? session.lastActivityAt.getTime() - session.startedAt.getTime()
          : 0;
        
        await prisma.visitorSession.update({
          where: { id: session.id },
          data: {
            endedAt: session.lastActivityAt || now,
            durationMs: sessionDuration,
            exitPage: path,
            bounced: session.pageViewCount <= 1,
          }
        });
      }

      // Create new session
      session = await prisma.visitorSession.create({
        data: {
          visitorId: visitor.id,
          startedAt: now,
          lastActivityAt: now,
          entryPage: path,
          referrer,
          pageViewCount: 1,
        }
      });

      // Increment visitor visit count for new sessions
      await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          totalVisits: { increment: 1 }
        }
      });
    } else {
      // Update existing session
      await prisma.visitorSession.update({
        where: { id: session.id },
        data: {
          lastActivityAt: now,
          pageViewCount: { increment: 1 },
        }
      });
    }

    // Create page view record (only fields that exist in PageView model)
    await prisma.pageView.create({
      data: {
        path,
        title,
        referrer,
        visitorId: visitor.id,
        sessionId: session.id,
        userId,
        userAgent,
        browser: deviceInfo.browser,
        device: deviceInfo.device,
        os: deviceInfo.os,
        ipAddress,
        country: locationInfo.country,
        city: locationInfo.city,
        viewedAt: now,
      }
    });

    console.log(`📊 Tracked page view: ${path} (visitor: ${visitor.id}, session: ${session.id})`);
    return { 
      success: true, 
      sessionId: session.id,
      visitorId: visitor.id 
    };

  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
    return { success: false, error };
  }
}

// Get analytics data for admin dashboard
export async function getWebAnalytics(timeRange = '30d') {
  try {
    const now = new Date();
    let since: Date;
    
    switch (timeRange) {
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

    // Get metrics in parallel
    const [
      totalPageViews,
      uniqueVisitors,
      totalSessions,
      avgSessionDuration,
      bounceRate,
      topPages,
      topCountries,
      topDevices,
      topBrowsers,
      pageViewsTrend,
      visitorsTrend
    ] = await Promise.all([
      // Total page views
      prisma.pageView.count({
        where: { viewedAt: { gte: since } }
      }),
      
      // Unique visitors
      prisma.visitor.count({
        where: { 
          lastVisitAt: { gte: since }
        }
      }),
      
      // Total sessions
      prisma.visitorSession.count({
        where: { startedAt: { gte: since } }
      }),
      
      // Average session duration
      prisma.visitorSession.aggregate({
        where: { 
          startedAt: { gte: since },
          durationMs: { not: null }
        },
        _avg: { durationMs: true }
      }),
      
      // Bounce rate (count of bounced sessions)
      prisma.visitorSession.count({
        where: { 
          startedAt: { gte: since },
          bounced: true 
        }
      }),
      
      // Top pages
      prisma.$queryRaw<Array<{ path: string; title: string | null; views: bigint }>>`
        SELECT path, title, COUNT(*) as views
        FROM page_views 
        WHERE "viewedAt" >= ${since}
        GROUP BY path, title
        ORDER BY views DESC
        LIMIT 20
      `,
      
      // Top countries  
      prisma.$queryRaw<Array<{ country: string; visitors: bigint }>>`
        SELECT country, COUNT(DISTINCT "visitorId") as visitors
        FROM page_views 
        WHERE "viewedAt" >= ${since} AND country IS NOT NULL
        GROUP BY country
        ORDER BY visitors DESC
        LIMIT 10
      `,
      
      // Top devices (using device column instead of deviceType)
      prisma.$queryRaw<Array<{ device: string; visitors: bigint }>>`
        SELECT device, COUNT(DISTINCT "visitorId") as visitors
        FROM page_views 
        WHERE "viewedAt" >= ${since} AND device IS NOT NULL
        GROUP BY device
        ORDER BY visitors DESC
      `,
      
      // Top browsers
      prisma.$queryRaw<Array<{ browser: string; visitors: bigint }>>`
        SELECT browser, COUNT(DISTINCT "visitorId") as visitors
        FROM page_views 
        WHERE "viewedAt" >= ${since} AND browser IS NOT NULL
        GROUP BY browser
        ORDER BY visitors DESC
        LIMIT 10
      `,
      
      // Page views trend (daily)
      prisma.$queryRaw<Array<{ date: Date; value: bigint }>>`
        SELECT DATE_TRUNC('day', "viewedAt") as date, COUNT(*) as value
        FROM page_views 
        WHERE "viewedAt" >= ${since}
        GROUP BY date
        ORDER BY date
      `,
      
      // Visitors trend (daily)
      prisma.$queryRaw<Array<{ date: Date; value: bigint }>>`
        SELECT DATE_TRUNC('day', "viewedAt") as date, COUNT(DISTINCT "visitorId") as value
        FROM page_views 
        WHERE "viewedAt" >= ${since}
        GROUP BY date
        ORDER BY date
      `,
    ]);

    return {
      pageViews: {
        total: totalPageViews,
        trend: pageViewsTrend.map(p => ({
          date: p.date.toISOString(),
          value: Number(p.value)
        }))
      },
      uniqueVisitors: {
        total: uniqueVisitors,
        trend: visitorsTrend.map(v => ({
          date: v.date.toISOString(),
          value: Number(v.value)
        }))
      },
      sessions: {
        total: totalSessions,
        avgDuration: Math.round((avgSessionDuration._avg.durationMs || 0) / 1000), // Convert to seconds
        bounceRate: totalSessions > 0 ? Math.round((bounceRate / totalSessions) * 100) : 0 // Convert to percentage
      },
      topPages: topPages.map(p => ({
        path: p.path,
        title: p.title || 'Untitled',
        views: Number(p.views)
      })),
      countries: topCountries.map(c => ({
        country: c.country?.slice(0, 2) || 'IE', // Use first 2 chars as country code
        name: c.country,
        visits: Number(c.visitors)
      })),
      devices: topDevices.map(d => ({
        device: d.device || 'Unknown',
        visits: Number(d.visitors),
        percentage: 0 // Will calculate this in the API
      })),
      browsers: topBrowsers.map(b => ({
        browser: b.browser,
        visits: Number(b.visitors),
        percentage: 0 // Will calculate this in the API
      }))
    };

  } catch (error) {
    console.error('❌ Error fetching web analytics:', error);
    throw error;
  }
}