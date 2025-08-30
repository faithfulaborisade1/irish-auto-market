// src/app/api/live-tracking/route.ts - Live visitor tracking API
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFingerprint } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, path, sessionId } = body;
    
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || request.ip;
    
    const now = new Date();
    
    switch (action) {
      case 'heartbeat':
        // Update session heartbeat - using only existing fields for now
        if (sessionId) {
          await prisma.visitorSession.update({
            where: { id: sessionId },
            data: {
              lastActivityAt: now,
            }
          });
        }
        break;
        
      case 'page_change':
        // Update current page for session - using only existing fields for now  
        if (sessionId) {
          await prisma.visitorSession.update({
            where: { id: sessionId },
            data: {
              lastActivityAt: now,
            }
          });
        }
        break;
        
      case 'disconnect':
        // Mark session as inactive - using only existing fields for now
        if (sessionId) {
          await prisma.visitorSession.update({
            where: { id: sessionId },
            data: {
              endedAt: now,
            }
          });
        }
        break;
    }
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('❌ Live tracking error:', error);
    return Response.json({ success: false, error: 'Tracking failed' }, { status: 500 });
  }
}

// Get live visitors count and details
export async function GET() {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Get active sessions (activity within last 5 minutes) - using existing fields for now
    const activeSessions = await prisma.visitorSession.findMany({
      where: {
        endedAt: null, // Session not ended
        lastActivityAt: {
          gte: fiveMinutesAgo
        }
      },
      include: {
        visitor: true,
        pageViews: {
          orderBy: { viewedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastActivityAt: 'desc' }
    });
    
    // Mark stale sessions as inactive if they haven't been active - using existing fields for now
    const staleSessionIds = await prisma.visitorSession.findMany({
      where: {
        endedAt: null, // Not ended
        lastActivityAt: {
          lt: fiveMinutesAgo
        }
      },
      select: { id: true }
    });
    
    if (staleSessionIds.length > 0) {
      await prisma.visitorSession.updateMany({
        where: {
          id: { in: staleSessionIds.map(s => s.id) }
        },
        data: {
          endedAt: now
        }
      });
    }
    
    // Prepare live visitor data - using available fields for now
    const liveVisitors = activeSessions.map(session => ({
      id: session.id,
      currentPage: session.pageViews[0]?.path || session.entryPage, // Use latest page view or entry page
      country: session.visitor.country,
      device: session.visitor.device,
      browser: session.visitor.browser,
      startedAt: session.startedAt,
      pageViewCount: session.pageViewCount,
      lastActivity: session.lastActivityAt,
    }));
    
    return Response.json({
      count: activeSessions.length,
      visitors: liveVisitors,
      timestamp: now.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching live visitors:', error);
    return Response.json({ error: 'Failed to fetch live visitors' }, { status: 500 });
  }
}