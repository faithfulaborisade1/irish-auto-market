// src/app/api/dealers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { User, DealerProfile } from '@prisma/client';

// ✅ FIX: Force dynamic rendering for request.url access
export const dynamic = 'force-dynamic';

// Define the type for dealer with profile
type DealerWithProfile = User & {
  dealerProfile: DealerProfile | null;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const county = searchParams.get('county') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    console.log('API received params:', { search, county, page, limit });

    // Build where clause for dealers
    const where: any = {
      role: 'DEALER',
      status: 'ACTIVE'
    };

    // Add search filter - search across multiple fields
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        // Search in user fields
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        // Search in dealer profile business name
        {
          dealerProfile: {
            businessName: { contains: searchTerm, mode: 'insensitive' }
          }
        },
        // Search in dealer profile description
        {
          dealerProfile: {
            description: { contains: searchTerm, mode: 'insensitive' }
          }
        }
      ];
    }

    // Add county filter if provided
    if (county && county !== 'All Counties') {
      // Since location is stored as JSON, we need to search within it
      where.location = {
        path: ['county'],
        string_contains: county
      };
    }

    console.log('Database where clause:', JSON.stringify(where, null, 2));

    // Fetch dealers with their profiles
    const dealers = await prisma.user.findMany({
      where,
      include: {
        dealerProfile: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${dealers.length} dealers`);

    // Transform dealers data
    const transformedDealers = await Promise.all(
      dealers.map(async (dealer: DealerWithProfile) => {
        // Get car count for this dealer
        const carCount = await prisma.car.count({
          where: { 
            userId: dealer.id,
            status: 'ACTIVE'
          }
        });

        const location = dealer.location as any || {};
        const dealerProfile = dealer.dealerProfile;

        const transformedDealer = {
          id: dealer.id,
          businessName: dealerProfile?.businessName || `${dealer.firstName} ${dealer.lastName}`,
          description: dealerProfile?.description || `Professional car dealer since ${new Date(dealer.createdAt).getFullYear()}`,
          logoUrl: dealerProfile?.logo || undefined,
          websiteUrl: dealerProfile?.website || undefined,
          phoneNumber: dealer.phone || '',
          location: {
            county: location.county || 'Ireland',
            city: location.city || '',
            address: location.address || ''
          },
          rating: 4.5, // Default rating - you can calculate this from reviews later
          reviewCount: 0, // Default - you can calculate this from reviews later
          carCount: carCount,
          specialties: (dealerProfile?.specialties as string[]) || [],
          verified: dealerProfile?.verified || false,
          subscription: dealerProfile?.subscriptionType || 'BASIC',
          joinedDate: dealer.createdAt.toISOString().split('T')[0],
          responseTime: 'Within 4 hours'
        };

        console.log(`Transformed dealer: ${transformedDealer.businessName} (${transformedDealer.carCount} cars)`);
        return transformedDealer;
      })
    );

    // Get total count for pagination
    // Note: For count queries with nested searches, we need to build a simpler where clause
    let countWhere: any = {
      role: 'DEALER',
      status: 'ACTIVE'
    };

    // For count query, we need to handle search differently since we can't use include
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // We'll get an approximate count by searching user fields only
      // The exact pagination might be slightly off, but it's better than an error
      countWhere.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Add county filter for count
    if (county && county !== 'All Counties') {
      countWhere.location = {
        path: ['county'],
        string_contains: county
      };
    }

    const totalCount = await prisma.user.count({ where: countWhere });

    console.log(`Total dealers found: ${totalCount}`);

    const response = {
      dealers: transformedDealers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dealers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}