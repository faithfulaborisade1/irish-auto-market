// src/app/api/dealers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const dealerId = params.id;
    console.log(`Fetching dealer details for ID: ${dealerId}`);

    // Fetch dealer with profile in a single query
    const dealer = await prisma.user.findFirst({
      where: {
        id: dealerId,
        role: 'DEALER',
        status: 'ACTIVE'
      },
      include: {
        dealerProfile: {
          include: {
            reviews: {
              where: {
                status: 'APPROVED',
                isPublic: true
              },
              select: {
                rating: true
              }
            }
          }
        }
      }
    });

    if (!dealer) {
      console.log(`Dealer not found for ID: ${dealerId}`);
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    console.log(`Found dealer: ${dealer.dealerProfile?.businessName || dealer.firstName}`);

    // Get dealer's cars with images
    const cars = await prisma.car.findMany({
      where: {
        userId: dealerId
      },
      include: {
        images: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${cars.length} cars for dealer`);

    // Get car stats (likes and inquiries) in parallel
    const carStats = await Promise.all(
      cars.map(async (car) => {
        const [likesCount, inquiriesCount] = await Promise.all([
          prisma.carLike.count({ where: { carId: car.id } }),
          prisma.carInquiry.count({ where: { carId: car.id } })
        ]);
        return {
          carId: car.id,
          likes: likesCount,
          inquiries: inquiriesCount
        };
      })
    );

    const location = dealer.location as any || {};
    const dealerProfile = dealer.dealerProfile;

    // Calculate real ratings from reviews
    const reviews = dealerProfile?.reviews || [];
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // Transform dealer data
    const transformedDealer = {
      id: dealer.id,
      businessName: dealerProfile?.businessName || `${dealer.firstName} ${dealer.lastName}`,
      description: dealerProfile?.description || dealerProfile?.aboutUs || `Professional car dealer since ${new Date(dealer.createdAt).getFullYear()}. We specialize in quality used cars and excellent customer service.`,
      aboutUs: dealerProfile?.aboutUs || `Professional car dealer since ${new Date(dealer.createdAt).getFullYear()}. We specialize in quality used cars and excellent customer service.`,
      logoUrl: dealerProfile?.logo || dealer.avatar,
      websiteUrl: dealerProfile?.website,
      phoneNumber: dealer.phone || '',
      location: {
        county: location.county || 'Ireland',
        city: location.city || '',
        address: location.address || 'Ireland'
      },
      rating: Math.round(averageRating * 10) / 10, // Real rating from reviews
      reviewCount: reviews.length, // Real review count
      carCount: cars.filter(car => car.status === 'ACTIVE').length,
      specialties: (dealerProfile?.specialties as string[]) || ['Quality Used Cars', 'Customer Service'],
      verified: dealerProfile?.verified || false,
      subscription: dealerProfile?.subscriptionType || 'BASIC',
      joinedDate: dealer.createdAt.toISOString().split('T')[0],
      responseTime: 'Within 4 hours',
      businessHours: (dealerProfile?.businessHours as any) || {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: 'Closed', close: 'Closed' }
      },
      cars: cars.map(car => {
        const stats = carStats.find(s => s.carId === car.id);
        
        // Transform car images to proper format for CarCard component
        const transformedImages = car.images.map(image => ({
          id: image.id,
          url: image.mediumUrl || image.largeUrl || image.originalUrl,
          alt: `${car.make} ${car.model} ${car.year}`
        }));

        return {
          id: car.id,
          title: car.title || `${car.year} ${car.make} ${car.model}`,
          make: car.make,
          model: car.model,
          year: car.year,
          price: Number(car.price),
          mileage: car.mileage || null,
          fuelType: car.fuelType || null,
          transmission: car.transmission || null,
          bodyType: car.bodyType || null,
          color: car.color || null,
          description: car.description || null,
          
          // ✅ FIXED: Include proper images array for carousel
          images: transformedImages,
          
          // Keep legacy imageUrl for backward compatibility
          imageUrl: car.images?.[0]?.mediumUrl || 
                   car.images?.[0]?.largeUrl || 
                   car.images?.[0]?.originalUrl || 
                   '/placeholder-car.jpg',
          
          status: car.status,
          featured: car.featuredUntil ? new Date(car.featuredUntil) > new Date() : false,
          views: car.viewsCount || 0,
          inquiries: stats?.inquiries || 0,
          likes: stats?.likes || 0,
          likesCount: stats?.likes || 0, // For CarCard compatibility
          isLiked: false, // Will be determined by frontend
          
          // Add seller info for CarCard
          seller: {
            name: dealerProfile?.businessName || `${dealer.firstName} ${dealer.lastName}`,
            type: 'dealer',
            phone: dealer.phone || '',
            verified: dealerProfile?.verified || false
          },
          
          createdAt: car.createdAt.toISOString(),
          updatedAt: car.updatedAt?.toISOString() || car.createdAt.toISOString(),
          location: `${location.city || ''}, ${location.county || 'Ireland'}`.trim().replace(/^,\s*|,\s*$/, '')
        };
      })
    };

    console.log(`Returning dealer data with ${transformedDealer.cars.length} cars`);
    return NextResponse.json(transformedDealer);

  } catch (error) {
    console.error('Error fetching dealer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dealer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}