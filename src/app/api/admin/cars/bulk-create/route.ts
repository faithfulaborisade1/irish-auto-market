// src/app/api/admin/cars/bulk-create/route.ts - Admin bulk creates cars for specific dealer
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processImageUrls } from '@/lib/image-processor';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface BulkCarData {
  dealerId: string;
  cars: Array<{
    make: string;
    model: string;
    year: number;
    price: number;
    currency?: string;
    title: string;
    description: string;
    county: string;
    area?: string;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
    engineSize?: number;
    bodyType?: string;
    doors?: number;
    seats?: number;
    color?: string;
    condition?: string;
    previousOwners?: number;
    nctExpiry?: string;
    serviceHistory?: boolean;
    accidentHistory?: boolean;
    features?: string[];
    // Support both image URLs (new) and already-processed images (old)
    imageUrls?: string[];
    images?: Array<{
      originalUrl: string;
      thumbnailUrl: string;
      mediumUrl: string;
      largeUrl: string;
      size?: number;
    }>;
  }>;
}

// Validation for single car
function validateSingleCar(car: any, index: number) {
  const errors: string[] = [];
  const prefix = `Car ${index + 1}:`;
  
  // Required fields
  if (!car.make?.trim()) errors.push(`${prefix} Make is required`);
  if (!car.model?.trim()) errors.push(`${prefix} Model is required`);
  if (!car.year || car.year < 1900 || car.year > new Date().getFullYear() + 1) {
    errors.push(`${prefix} Valid year is required`);
  }
  if (!car.price || car.price < 0 || car.price > 500000) {
    errors.push(`${prefix} Valid price is required (€0 - €500,000)`);
  }
  if (!car.title?.trim() || car.title.length > 200) {
    errors.push(`${prefix} Title is required (max 200 characters)`);
  }
  if (!car.description?.trim() || car.description.length > 2000) {
    errors.push(`${prefix} Description is required (max 2000 characters)`);
  }
  if (!car.county?.trim()) errors.push(`${prefix} County is required`);
  
  // Images validation - support both imageUrls and images
  const hasImageUrls = car.imageUrls && Array.isArray(car.imageUrls) && car.imageUrls.length > 0;
  const hasImages = car.images && Array.isArray(car.images) && car.images.length > 0;

  if (!hasImageUrls && !hasImages) {
    errors.push(`${prefix} At least one image URL is required`);
  }
  if (hasImageUrls && car.imageUrls.length > 10) {
    errors.push(`${prefix} Maximum 10 images allowed`);
  }
  if (hasImages && car.images.length > 10) {
    errors.push(`${prefix} Maximum 10 images allowed`);
  }
  
  // Optional field validation
  if (car.mileage && (car.mileage < 0 || car.mileage > 600000)) {
    errors.push(`${prefix} Invalid mileage (max 600,000 km)`);
  }
  if (car.engineSize && (car.engineSize < 0.1 || car.engineSize > 10)) {
    errors.push(`${prefix} Invalid engine size`);
  }
  
  return errors;
}

// Sanitize text input
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// Parse date in DD/MM/YYYY or ISO format
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Try DD/MM/YYYY format first
  const ddmmyyyyMatch = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    // Validate the date is valid
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try ISO format or other standard formats
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

// Generate unique slug
async function generateSlug(title: string, attempt = 0): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  const suffix = attempt > 0 ? `-${attempt}` : '';
  const testSlug = `${baseSlug}${suffix}`;
  
  const existing = await prisma.car.findUnique({ 
    where: { slug: testSlug },
    select: { id: true }
  });
  
  if (existing) {
    return generateSlug(title, attempt + 1);
  }
  
  return testSlug;
}

export async function POST(request: NextRequest) {
  try {
    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 5000000) { // 5MB limit
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    // Parse request body
    const body: BulkCarData = await request.json();
    
    if (!body.dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    if (!body.cars || !Array.isArray(body.cars) || body.cars.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one car is required' },
        { status: 400 }
      );
    }

    // Limit bulk operations to prevent abuse
    if (body.cars.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 cars per bulk upload' },
        { status: 400 }
      );
    }

    // Verify dealer exists and is active
    const dealer = await prisma.user.findUnique({
      where: { id: body.dealerId },
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

    // Validate all cars first
    const allValidationErrors: string[] = [];
    body.cars.forEach((car, index) => {
      const errors = validateSingleCar(car, index);
      allValidationErrors.push(...errors);
    });

    if (allValidationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: allValidationErrors.slice(0, 50) // Limit error messages
        },
        { status: 400 }
      );
    }

    // Process cars in batches to avoid timeouts
    const batchSize = 10;
    const createdCars: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < body.cars.length; i += batchSize) {
      const batch = body.cars.slice(i, i + batchSize);
      
      try {
        // Process batch in transaction
        const batchResults = await prisma.$transaction(
          async (tx) => {
            const results = [];
            
            for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
              const carData = batch[batchIndex];
              const globalIndex = i + batchIndex;

              try {
                // Process image URLs if provided
                let processedImages = carData.images || [];
                if (carData.imageUrls && carData.imageUrls.length > 0) {
                  console.log(`[DEBUG] Processing ${carData.imageUrls.length} image URLs for car: ${carData.title}`);
                  try {
                    processedImages = await processImageUrls(carData.imageUrls, 10);
                    console.log(`[DEBUG] Successfully processed ${processedImages.length} images`);
                  } catch (imageError) {
                    console.error(`[DEBUG] Image processing error:`, imageError);
                    throw new Error(`Failed to process images: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
                  }
                }

                // Sanitize text inputs
                const sanitizedData = {
                  make: sanitizeText(carData.make),
                  model: sanitizeText(carData.model),
                  title: sanitizeText(carData.title),
                  description: sanitizeText(carData.description),
                  color: carData.color ? sanitizeText(carData.color) : null,
                  county: sanitizeText(carData.county),
                  area: carData.area ? sanitizeText(carData.area) : null,
                };

                // Generate unique slug
                const slug = await generateSlug(sanitizedData.title);

                // Create car
                const car = await tx.car.create({
                  data: {
                    userId: body.dealerId,
                    title: sanitizedData.title,
                    make: sanitizedData.make,
                    model: sanitizedData.model,
                    year: parseInt(carData.year.toString()),
                    price: parseFloat(carData.price.toString()),
                    mileage: carData.mileage ? parseInt(carData.mileage.toString()) : null,
                    fuelType: (carData.fuelType && ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID', 'LPG', 'CNG'].includes(carData.fuelType)) ? carData.fuelType as any : null,
                    transmission: (carData.transmission && ['MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC', 'CVT'].includes(carData.transmission)) ? carData.transmission as any : null,
                    engineSize: carData.engineSize ? parseFloat(carData.engineSize.toString()) : null,
                    bodyType: (carData.bodyType && ['HATCHBACK', 'SALOON', 'ESTATE', 'SUV', 'COUPE', 'CONVERTIBLE', 'MPV', 'VAN', 'PICKUP', 'OTHER'].includes(carData.bodyType)) ? carData.bodyType as any : null,
                    doors: carData.doors ? parseInt(carData.doors.toString()) : null,
                    seats: carData.seats ? parseInt(carData.seats.toString()) : null,
                    color: sanitizedData.color,
                    condition: (carData.condition && ['NEW', 'USED', 'CERTIFIED_PRE_OWNED'].includes(carData.condition)) ? carData.condition as any : 'USED',
                    previousOwners: carData.previousOwners ? parseInt(carData.previousOwners.toString()) : 1,
                    nctExpiry: carData.nctExpiry ? parseDate(carData.nctExpiry.toString()) : null,
                    serviceHistory: Boolean(carData.serviceHistory),
                    accidentHistory: Boolean(carData.accidentHistory),
                    description: sanitizedData.description,
                    features: Array.isArray(carData.features) ? carData.features.slice(0, 20) : [],
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

                // Create car images from processed images
                if (processedImages && processedImages.length > 0) {
                  await Promise.all(
                    processedImages.slice(0, 10).map((image: any, imageIndex: number) =>
                      tx.carImage.create({
                        data: {
                          carId: car.id,
                          originalUrl: image.originalUrl,
                          thumbnailUrl: image.thumbnailUrl,
                          mediumUrl: image.mediumUrl,
                          largeUrl: image.largeUrl,
                          orderIndex: imageIndex,
                          altText: `${sanitizedData.title} - Image ${imageIndex + 1}`,
                          fileSize: image.size || 0,
                        },
                      })
                    )
                  );
                }

                results.push({
                  index: globalIndex,
                  carId: car.id,
                  title: car.title,
                  success: true
                });

              } catch (carError) {
                console.error(`Error creating car ${globalIndex + 1}:`, carError);
                errors.push(`Car ${globalIndex + 1} (${carData.title}): ${carError instanceof Error ? carError.message : 'Unknown error'}`);
                results.push({
                  index: globalIndex,
                  title: carData.title,
                  success: false,
                  error: carError instanceof Error ? carError.message : 'Unknown error'
                });
              }
            }
            
            return results;
          },
          {
            timeout: 30000 // 30 second timeout per batch
          }
        );

        createdCars.push(...batchResults);

      } catch (batchError) {
        console.error(`Batch error for cars ${i + 1} to ${Math.min(i + batchSize, body.cars.length)}:`, batchError);
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
      }
    }

    // Calculate results
    const successCount = createdCars.filter(car => car.success).length;
    const failureCount = createdCars.filter(car => !car.success).length;

    // Log admin action
    console.log(`[ADMIN BULK ACTION] ${successCount} cars created, ${failureCount} failed for dealer ${body.dealerId} (${dealer.dealerProfile?.businessName || dealer.email})`);

    return NextResponse.json({
      success: true,
      message: `Bulk upload completed: ${successCount} cars created successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      summary: {
        total: body.cars.length,
        successful: successCount,
        failed: failureCount,
        dealer: {
          id: dealer.id,
          name: dealer.dealerProfile?.businessName || `${dealer.firstName} ${dealer.lastName}`,
          email: dealer.email,
          verified: dealer.dealerProfile?.verified || false
        }
      },
      results: createdCars,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Admin bulk car creation error:', {
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