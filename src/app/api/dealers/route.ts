// src/app/api/dealers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const county = searchParams.get('county') || '';
    const specialty = searchParams.get('specialty') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build where clause
    const where: any = {
      role: 'DEALER',
      status: 'ACTIVE'
    };

    // Add search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch dealers
    const dealers = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get dealer profiles and car counts separately
    const transformedDealers = await Promise.all(
      dealers.map(async (dealer) => {
        const [dealerProfile, carCount] = await Promise.all([
          prisma.dealerProfile.findUnique({
            where: { userId: dealer.id }
          }),
          prisma.car.count({
            where: { 
              userId: dealer.id,
              status: 'ACTIVE'
            }
          })
        ]);

        const location = dealer.location as any || {};

        return {
          id: dealer.id,
          businessName: dealerProfile?.businessName || `${dealer.firstName} ${dealer.lastName}`,
          description: dealerProfile?.description || '',
          logoUrl: dealerProfile?.logo,
          websiteUrl: dealerProfile?.website,
          phoneNumber: dealer.phone || '',
          location: {
            county: location.county || '',
            city: location.city || '',
            address: location.address || ''
          },
          rating: 4.5,
          reviewCount: 0,
          carCount: carCount,
          specialties: (dealerProfile?.specialties as string[]) || [],
          verified: dealerProfile?.verified || false,
          subscription: dealerProfile?.subscriptionType || 'BASIC',
          joinedDate: dealer.createdAt.toISOString().split('T')[0],
          responseTime: 'Within 4 hours'
        };
      })
    );

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    return NextResponse.json({
      dealers: transformedDealers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}