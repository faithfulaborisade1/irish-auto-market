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

    // First, let's try a simple query to see what we can access
    const dealer = await prisma.user.findFirst({
      where: {
        id: dealerId,
        role: 'DEALER'
      }
    });

    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    // Get dealer profile separately
    const dealerProfile = await prisma.dealerProfile.findUnique({
      where: {
        userId: dealerId
      }
    });

    // Get dealer's cars separately
    const cars = await prisma.car.findMany({
      where: {
        userId: dealerId
      },
      include: {
        images: {
          orderBy: { orderIndex: 'asc' },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get car stats separately
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

    // Transform dealer data
    const transformedDealer = {
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
      carCount: cars.filter(car => car.status === 'ACTIVE').length,
      specialties: (dealerProfile?.specialties as string[]) || [],
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
      aboutUs: dealerProfile?.description || 'Professional car dealer committed to quality service.',
      cars: cars.map(car => {
        const stats = carStats.find(s => s.carId === car.id);
        return {
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          price: Number(car.price),
          mileage: car.mileage || 0,
          fuelType: car.fuelType || '',
          transmission: car.transmission || '',
          bodyType: car.bodyType || '',
          color: car.color || '',
          imageUrl: car.images?.[0]?.mediumUrl || car.images?.[0]?.originalUrl || '/placeholder-car.jpg',
          status: car.status,
          featured: car.featuredUntil ? new Date(car.featuredUntil) > new Date() : false,
          views: car.viewsCount,
          inquiries: stats?.inquiries || 0,
          likes: stats?.likes || 0,
          createdAt: car.createdAt.toISOString().split('T')[0],
          location: `${location.city || ''}, ${location.county || ''}`.trim().replace(/^,|,$/, '')
        };
      })
    };

    return NextResponse.json(transformedDealer);

  } catch (error) {
    console.error('Error fetching dealer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealer' },
      { status: 500 }
    );
  }
}