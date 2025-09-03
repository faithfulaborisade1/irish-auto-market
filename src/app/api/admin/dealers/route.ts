// src/app/api/admin/dealers/route.ts - Get all dealers for admin selection
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const verified = searchParams.get('verified') || 'all';

    // Build where clause
    const where: any = {
      role: 'DEALER',
      dealerProfile: {
        isNot: null // Must have dealer profile
      }
    };

    // Status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { dealerProfile: { businessName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Verified filter
    if (verified !== 'all') {
      where.dealerProfile.verified = verified === 'true';
    }

    // Fetch dealers with their profiles
    const dealers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        dealerProfile: {
          select: {
            id: true,
            businessName: true,
            businessRegistration: true,
            vatNumber: true,
            description: true,
            logo: true,
            website: true,
            verified: true,
            verifiedAt: true,
            subscriptionType: true,
            subscriptionExpires: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            cars: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: [
        { dealerProfile: { verified: 'desc' } }, // Verified first
        { dealerProfile: { businessName: 'asc' } }, // Then alphabetical
      ]
    });

    // Transform data for frontend
    const transformedDealers = dealers.map(dealer => ({
      id: dealer.id,
      name: dealer.dealerProfile?.businessName || `${dealer.firstName} ${dealer.lastName}`,
      firstName: dealer.firstName,
      lastName: dealer.lastName,
      email: dealer.email,
      status: dealer.status,
      verified: dealer.dealerProfile?.verified || false,
      verifiedAt: dealer.dealerProfile?.verifiedAt,
      businessName: dealer.dealerProfile?.businessName,
      businessRegistration: dealer.dealerProfile?.businessRegistration,
      vatNumber: dealer.dealerProfile?.vatNumber,
      description: dealer.dealerProfile?.description,
      logo: dealer.dealerProfile?.logo,
      website: dealer.dealerProfile?.website,
      subscriptionType: dealer.dealerProfile?.subscriptionType,
      subscriptionExpires: dealer.dealerProfile?.subscriptionExpires,
      activeCarsCount: dealer._count.cars,
      joinedAt: dealer.createdAt,
      lastLoginAt: dealer.lastLoginAt,
      profileCreatedAt: dealer.dealerProfile?.createdAt,
    }));

    return NextResponse.json({
      success: true,
      dealers: transformedDealers,
      total: transformedDealers.length,
      summary: {
        verified: transformedDealers.filter(d => d.verified).length,
        unverified: transformedDealers.filter(d => !d.verified).length,
        active: transformedDealers.filter(d => d.status === 'ACTIVE').length,
        inactive: transformedDealers.filter(d => d.status !== 'ACTIVE').length,
      }
    });

  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dealers',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}