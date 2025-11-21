// src/app/api/admin/cars/create-for-dealer/route.ts - Admin creates car for specific dealer
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Enhanced input validation
function validateCarData(data: any) {
  const errors = []
  
  // Required fields
  if (!data.make?.trim()) errors.push('Make is required')
  if (!data.model?.trim()) errors.push('Model is required')
  if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.push('Valid year is required')
  }
  if (!data.price || data.price < 0 || data.price > 1000000) {
    errors.push('Valid price is required (€0 - €1,000,000)')
  }
  if (!data.title?.trim() || data.title.length > 200) {
    errors.push('Title is required (max 200 characters)')
  }
  if (!data.description?.trim() || data.description.length > 2000) {
    errors.push('Description is required (max 2000 characters)')
  }
  if (!data.county?.trim()) errors.push('County is required')
  if (!data.dealerId?.trim()) errors.push('Dealer ID is required')
  
  // Images validation
  if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
    errors.push('At least one image is required')
  }
  if (data.images && data.images.length > 10) {
    errors.push('Maximum 10 images allowed')
  }
  
  // Optional field validation
  if (data.mileage && (data.mileage < 0 || data.mileage > 1000000)) {
    errors.push('Invalid mileage')
  }
  if (data.engineSize && (data.engineSize < 0.1 || data.engineSize > 10)) {
    errors.push('Invalid engine size')
  }
  
  return errors
}

// Sanitize text input to prevent XSS
function sanitizeText(text: string): string {
  if (!text) return ''
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Enhanced input validation
    const validationErrors = validateCarData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    const {
      dealerId,
      make, model, year, price, mileage, fuelType, transmission, engineSize,
      bodyType, doors, seats, color, condition, previousOwners, nctExpiry,
      serviceHistory, accidentHistory, title, description, features, county, area, images
    } = body;

    // Verify dealer exists and is active
    const dealer = await prisma.user.findUnique({
      where: { id: dealerId },
      select: {
        id: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        email: true,
        dealerProfile: {
          select: {
            id: true,
            businessName: true,
            verified: true
          }
        }
      }
    });

    if (!dealer) {
      return NextResponse.json(
        { success: false, error: 'Dealer not found' },
        { status: 404 }
      );
    }

    if (dealer.role !== 'DEALER') {
      return NextResponse.json(
        { success: false, error: 'Selected user is not a dealer' },
        { status: 400 }
      );
    }

    if (dealer.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Dealer account is not active' },
        { status: 400 }
      );
    }

    // Sanitize text inputs
    const sanitizedData = {
      make: sanitizeText(make),
      model: sanitizeText(model),
      title: sanitizeText(title),
      description: sanitizeText(description),
      color: color ? sanitizeText(color) : null,
      county: sanitizeText(county),
      area: area ? sanitizeText(area) : null,
    };

    // Generate SEO-friendly slug with collision handling
    const generateSlug = async (title: string, attempt = 0): Promise<string> => {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      const suffix = attempt > 0 ? `-${attempt}` : '';
      const testSlug = `${baseSlug}${suffix}`;
      
      // Check if slug exists
      const existing = await prisma.car.findUnique({ 
        where: { slug: testSlug },
        select: { id: true }
      });
      
      if (existing) {
        return generateSlug(title, attempt + 1);
      }
      
      return testSlug;
    };

    // Generate unique slug
    const slug = await generateSlug(sanitizedData.title);

    // Database transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create car listing for the dealer
      const car = await tx.car.create({
        data: {
          userId: dealerId, // Create as the dealer
          title: sanitizedData.title,
          make: sanitizedData.make,
          model: sanitizedData.model,
          year: parseInt(year.toString()),
          price: parseFloat(price.toString()),
          mileage: mileage ? parseInt(mileage.toString()) : null,
          fuelType: fuelType || 'PETROL',
          transmission: transmission || 'MANUAL',
          engineSize: engineSize ? parseFloat(engineSize.toString()) : null,
          bodyType: bodyType || null,
          doors: doors ? parseInt(doors.toString()) : null,
          seats: seats ? parseInt(seats.toString()) : null,
          color: sanitizedData.color,
          condition: condition || 'USED',
          previousOwners: previousOwners ? parseInt(previousOwners.toString()) : 1,
          nctExpiry: nctExpiry ? new Date(nctExpiry) : null,
          serviceHistory: Boolean(serviceHistory),
          accidentHistory: Boolean(accidentHistory),
          description: sanitizedData.description,
          features: Array.isArray(features) ? features.slice(0, 20) : [], // Limit features
          location: {
            county: sanitizedData.county,
            area: sanitizedData.area,
            display_location: sanitizedData.area ? `${sanitizedData.area}, ${sanitizedData.county}` : sanitizedData.county,
          },
          slug,
          status: 'ACTIVE',
          moderationStatus: 'APPROVED', // Admin-created cars are pre-approved
          viewsCount: 0,
          inquiriesCount: 0,
          likesCount: 0,
          featured: false,
        },
      });

      // Create car images (limit to 10)
      if (images && images.length > 0) {
        await Promise.all(
          images.slice(0, 10).map((image: any, index: number) =>
            tx.carImage.create({
              data: {
                carId: car.id,
                originalUrl: image.originalUrl,
                thumbnailUrl: image.thumbnailUrl,
                mediumUrl: image.mediumUrl,
                largeUrl: image.largeUrl,
                orderIndex: index,
                altText: `${sanitizedData.title} - Image ${index + 1}`,
                fileSize: image.size || 0,
              },
            })
          )
        );
      }

      return car;
    });

    // Log admin action for audit trail
    console.log(`[ADMIN ACTION] Car created for dealer ${dealerId} (${dealer.dealerProfile?.businessName || dealer.email}) - Car ID: ${result.id}`);

    // Fetch complete car data for response
    const completeCarData = await prisma.car.findUnique({
      where: { id: result.id },
      include: {
        images: { orderBy: { orderIndex: 'asc' } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            dealerProfile: {
              select: {
                businessName: true,
                verified: true
              }
            }
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Car listing created successfully for dealer ${dealer.dealerProfile?.businessName || dealer.email}`,
      car: completeCarData,
      dealer: {
        id: dealer.id,
        name: dealer.dealerProfile?.businessName || `${dealer.firstName} ${dealer.lastName}`,
        email: dealer.email,
        verified: dealer.dealerProfile?.verified || false
      }
    });

  } catch (error) {
    console.error('Admin car creation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}