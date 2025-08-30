// src/app/api/track/route.ts - Page View Tracking API
import { NextRequest, NextResponse } from 'next/server';
import { trackPageView } from '@/lib/analytics';

function getClientIP(request: NextRequest): string | undefined {
  // Check various headers for real client IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  return xRealIP || cfConnectingIP || undefined;
}

function getUserId(request: NextRequest): string | undefined {
  // Try to get user ID from auth cookie
  try {
    const authToken = request.cookies.get('auth-token')?.value || 
                     request.cookies.get('admin-token')?.value;
    
    if (!authToken) return undefined;
    
    const parts = authToken.split('.');
    if (parts.length !== 3) return undefined;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.userId || undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, title, referrer, extraData } = body;
    
    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path is required' },
        { status: 400 }
      );
    }

    // Get tracking data
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = getClientIP(request);
    const userId = getUserId(request);

    // Track the page view
    const result = await trackPageView({
      path,
      title,
      referrer,
      userAgent,
      ipAddress,
      userId,
      extraData,
    });

    if (!result.success) {
      console.error('Tracking failed:', result.error);
    }

    // Always return success to avoid breaking the frontend
    return NextResponse.json({ success: true, sessionId: result.sessionId, visitorId: result.visitorId });
    
  } catch (error) {
    console.error('Track API Error:', error);
    // Return success to avoid breaking the frontend
    return NextResponse.json({ success: true });
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}