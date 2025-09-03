// src/app/api/profile/dealer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check for auth-token cookie (used by other profile endpoints)
  const authToken = request.cookies.get('auth-token')?.value;
  if (authToken) return authToken;
  
  // Fallback to token cookie
  const cookieToken = request.cookies.get('token')?.value;
  return cookieToken || null;
}

async function verifyAuth(request: NextRequest): Promise<DecodedToken> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const decoded = await verifyAuth(request);
    
    // Verify user is a dealer
    if (decoded.role !== 'DEALER') {
      return NextResponse.json(
        { error: 'Only dealers can update dealer profiles' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const {
      businessName,
      businessRegistration,
      vatNumber,
      description,
      logo,
      website,
      phone,
      businessHours,
      specialties
    } = data;

    // Validate required fields
    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Update user phone if provided
    if (phone) {
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { phone }
      });
    }

    // Check if dealer profile exists
    const existingProfile = await prisma.dealerProfile.findUnique({
      where: { userId: decoded.userId }
    });

    let dealerProfile;

    if (existingProfile) {
      // Update existing profile
      dealerProfile = await prisma.dealerProfile.update({
        where: { userId: decoded.userId },
        data: {
          businessName,
          businessRegistration: businessRegistration || null,
          vatNumber: vatNumber || null,
          description: description || null,
          logo: logo || null,
          website: website || null,
          businessHours: businessHours || null,
          specialties: specialties || null,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new profile
      dealerProfile = await prisma.dealerProfile.create({
        data: {
          userId: decoded.userId,
          businessName,
          businessRegistration: businessRegistration || null,
          vatNumber: vatNumber || null,
          description: description || null,
          logo: logo || null,
          website: website || null,
          businessHours: businessHours || null,
          specialties: specialties || null
        }
      });
    }

    console.log(`Dealer profile updated for user ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      dealerProfile
    });

  } catch (error) {
    console.error('Error updating dealer profile:', error);
    
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update dealer profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyAuth(request);
    
    // Verify user is a dealer
    if (decoded.role !== 'DEALER') {
      return NextResponse.json(
        { error: 'Only dealers can view dealer profiles' },
        { status: 403 }
      );
    }

    // Get dealer profile
    const dealerProfile = await prisma.dealerProfile.findUnique({
      where: { userId: decoded.userId }
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      dealerProfile
    });

  } catch (error) {
    console.error('Error fetching dealer profile:', error);
    
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch dealer profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}