import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Irish counties mapping for consistent formatting
const COUNTY_MAPPING: Record<string, string> = {
  'dublin': 'Dublin',
  'cork': 'Cork',
  'galway': 'Galway',
  'mayo': 'Mayo',
  'donegal': 'Donegal',
  'kerry': 'Kerry',
  'tipperary': 'Tipperary',
  'clare': 'Clare',
  'tyrone': 'Tyrone',
  'antrim': 'Antrim',
  'limerick': 'Limerick',
  'roscommon': 'Roscommon',
  'down': 'Down',
  'wexford': 'Wexford',
  'meath': 'Meath',
  'londonderry': 'Londonderry',
  'kilkenny': 'Kilkenny',
  'wicklow': 'Wicklow',
  'offaly': 'Offaly',
  'cavan': 'Cavan',
  'waterford': 'Waterford',
  'westmeath': 'Westmeath',
  'sligo': 'Sligo',
  'laois': 'Laois',
  'kildare': 'Kildare',
  'fermanagh': 'Fermanagh',
  'leitrim': 'Leitrim',
  'armagh': 'Armagh',
  'monaghan': 'Monaghan',
  'longford': 'Longford',
  'carlow': 'Carlow',
  'louth': 'Louth'
};

// Helper function to determine if location matches county
function locationMatchesCounty(location: any, countyFormatted: string): boolean {
  if (!location) return false;

  const locationStr = JSON.stringify(location).toLowerCase();
  const countyLower = countyFormatted.toLowerCase();

  return locationStr.includes(countyLower) ||
         locationStr.includes(`"county":"${countyLower}"`) ||
         locationStr.includes(`"county": "${countyLower}"`) ||
         locationStr.includes(`county: "${countyFormatted}"`) ||
         locationStr.includes(countyFormatted.toLowerCase());
}

// Helper to get nearby counties (simplified for demo)
function getNearbyCounties(county: string): string[] {
  const nearby: Record<string, string[]> = {
    'dublin': ['Wicklow', 'Meath', 'Kildare'],
    'cork': ['Kerry', 'Waterford', 'Tipperary'],
    'galway': ['Mayo', 'Clare', 'Roscommon'],
    'mayo': ['Galway', 'Roscommon', 'Sligo'],
    'donegal': ['Tyrone', 'Fermanagh', 'Leitrim'],
    // Add more as needed
  };

  return nearby[county.toLowerCase()] || [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { county: string } }
) {
  try {
    const county = params.county.toLowerCase();
    const countyFormatted = COUNTY_MAPPING[county];

    if (!countyFormatted) {
      return NextResponse.json(
        { error: 'Invalid county' },
        { status: 404 }
      );
    }

    // Get all active cars with their location data
    const allCars = await prisma.car.findMany({
      where: {
        status: 'ACTIVE',
        moderationStatus: 'APPROVED'
      },
      include: {
        images: {
          orderBy: { orderIndex: 'asc' },
          take: 1
        },
        user: {
          select: {
            name: true,
            dealerProfile: {
              select: {
                businessName: true,
                verified: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter cars by location (using JSON search)
    const carsInCounty = allCars.filter(car =>
      locationMatchesCounty(car.location, countyFormatted)
    );

    // Transform cars to match your CarType interface
    const transformedCars = carsInCounty.map(car => ({
      id: car.id,
      title: car.title,
      make: car.make,
      model: car.model,
      year: car.year,
      price: Number(car.price),
      mileage: car.mileage,
      fuelType: car.fuelType,
      transmission: car.transmission,
      engineSize: car.engineSize ? Number(car.engineSize) : undefined,
      bodyType: car.bodyType,
      doors: car.doors,
      seats: car.seats,
      color: car.color,
      condition: car.condition,
      description: car.description,
      features: car.features,
      location: car.location,
      slug: car.slug,
      status: car.status,
      featured: car.featured,
      viewsCount: car.viewsCount,
      likesCount: car.likesCount,
      favoritesCount: car.favoritesCount,
      createdAt: car.createdAt.toISOString(),
      updatedAt: car.updatedAt.toISOString(),
      images: car.images.map(img => ({
        id: img.id,
        originalUrl: img.originalUrl,
        thumbnailUrl: img.thumbnailUrl,
        mediumUrl: img.mediumUrl,
        largeUrl: img.largeUrl,
        altText: img.altText || `${car.make} ${car.model}`,
        orderIndex: img.orderIndex
      })),
      seller: {
        name: car.user.name || 'Anonymous',
        isDealer: !!car.user.dealerProfile,
        businessName: car.user.dealerProfile?.businessName,
        verified: car.user.dealerProfile?.verified || false
      },
      // Add required fields for compatibility
      isLiked: false,
      isFavorited: false
    }));

    // Calculate popular makes
    const makeCount: Record<string, number> = {};
    transformedCars.forEach(car => {
      makeCount[car.make] = (makeCount[car.make] || 0) + 1;
    });

    const popularMakes = Object.entries(makeCount)
      .map(([make, count]) => ({ make, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate price range
    const prices = transformedCars.map(car => car.price).filter(p => p > 0);
    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
    } : { min: 0, max: 0, average: 0 };

    // Get nearby counties
    const nearbyCounties = getNearbyCounties(county);

    const responseData = {
      cars: transformedCars,
      totalCount: transformedCars.length,
      county: county,
      countyFormatted: countyFormatted,
      popularMakes,
      priceRange,
      nearbyCounties
    };

    // Add caching headers for better performance
    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');

    return response;

  } catch (error) {
    console.error('Error fetching location data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}