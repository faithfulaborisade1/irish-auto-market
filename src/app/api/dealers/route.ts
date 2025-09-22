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

    // New filter parameters
    const subscription = searchParams.get('subscription') || '';
    const verified = searchParams.get('verified') || '';
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const minCars = parseInt(searchParams.get('minCars') || '0');
    const specialties = searchParams.get('specialties')?.split(',').filter(Boolean) || [];
    const sortBy = searchParams.get('sortBy') || 'newest';

    console.log('API received params:', { search, county, page, limit, subscription, verified, minRating, minCars, specialties, sortBy });

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
      // For now, use exact match - case-insensitive JSON filtering is complex in Prisma
      where.location = {
        path: ['county'],
        equals: county
      };
    }

    // Add subscription type filter
    if (subscription && subscription !== 'all') {
      where.dealerProfile = {
        ...where.dealerProfile,
        subscriptionType: subscription.toUpperCase()
      };
    }

    // Add verified filter
    if (verified === 'true') {
      where.dealerProfile = {
        ...where.dealerProfile,
        verified: true
      };
    }

    // Add specialties filter
    if (specialties.length > 0) {
      where.dealerProfile = {
        ...where.dealerProfile,
        specialties: {
          hasEvery: specialties
        }
      };
    }

    console.log('Database where clause:', JSON.stringify(where, null, 2));

    // Define sort order
    let orderBy: any = {};
    switch (sortBy) {
      case 'rating':
        // We'll sort by rating after fetching since rating is calculated
        orderBy = { createdAt: 'desc' };
        break;
      case 'cars':
        // We'll sort by car count after fetching since it's calculated
        orderBy = { createdAt: 'desc' };
        break;
      case 'name':
        orderBy = { dealerProfile: { businessName: 'asc' } };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Fetch dealers with their profiles
    const dealers = await prisma.user.findMany({
      where,
      include: {
        dealerProfile: true
      },
      skip: (page - 1) * limit,
      take: limit * 2, // Fetch more to account for car count filtering
      orderBy
    });

    console.log(`Found ${dealers.length} dealers`);

    // Transform dealers data and apply post-processing filters
    const transformedDealers = await Promise.all(
      dealers.map(async (dealer: DealerWithProfile) => {
        // Get car count for this dealer
        const carCount = await prisma.car.count({
          where: {
            userId: dealer.id,
            status: 'ACTIVE'
          }
        });

        // Calculate actual rating from reviews (you can implement this later)
        const rating = 4.5; // Default rating - you can calculate this from reviews later
        const reviewCount = 0; // Default - you can calculate this from reviews later

        const location = dealer.location as any || {};
        const dealerProfile = dealer.dealerProfile;

        const transformedDealer = {
          id: dealer.id,
          businessName: dealerProfile?.businessName || `${dealer.firstName} ${dealer.lastName}`,
          description: dealerProfile?.description || dealerProfile?.aboutUs || `Professional car dealer since ${new Date(dealer.createdAt).getFullYear()}`,
          aboutUs: dealerProfile?.aboutUs || null,
          logoUrl: dealerProfile?.logo || dealer.avatar || undefined,
          websiteUrl: dealerProfile?.website || undefined,
          phoneNumber: dealer.phone || '',
          location: {
            county: location.county && location.county !== 'Ireland' ? location.county : null,
            city: location.city || '',
            address: location.address || ''
          },
          rating: rating,
          reviewCount: reviewCount,
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

    // Apply post-processing filters
    let filteredDealers = transformedDealers;

    // Filter by minimum car count
    if (minCars > 0) {
      filteredDealers = filteredDealers.filter(dealer => dealer.carCount >= minCars);
    }

    // Filter by minimum rating
    if (minRating > 0) {
      filteredDealers = filteredDealers.filter(dealer => dealer.rating >= minRating);
    }

    // Apply sorting for calculated fields
    if (sortBy === 'rating') {
      filteredDealers.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'cars') {
      filteredDealers.sort((a, b) => b.carCount - a.carCount);
    }

    // Apply pagination after filtering
    const paginatedDealers = filteredDealers.slice(0, limit);

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
        equals: county
      };
    }

    const totalCount = await prisma.user.count({ where: countWhere });

    console.log(`Total dealers found: ${totalCount}`);

    const response = {
      dealers: paginatedDealers,
      pagination: {
        page,
        limit,
        total: filteredDealers.length,
        pages: Math.ceil(filteredDealers.length / limit)
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