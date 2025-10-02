// src/app/api/admin/cars/[id]/route.ts - Individual Car Management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const carId = params.id;

    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            phone: true,
            location: true,
            dealerProfile: {
              select: {
                businessName: true,
                verified: true,
                subscriptionType: true,
                website: true,
                description: true,
              }
            }
          }
        },
        images: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            originalUrl: true,
            thumbnailUrl: true,
            mediumUrl: true,
            largeUrl: true,
            altText: true,
            orderIndex: true,
          }
        },
        inquiries: {
          include: {
            buyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        priceHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5,
        }
      }
    });

    if (!car) {
      return NextResponse.json(
        { success: false, error: 'Car not found' },
        { status: 404 }
      );
    }

    // Transform the data
    const transformedCar = {
      ...car,
      price: Number(car.price),
      engineSize: car.engineSize ? Number(car.engineSize) : null,
      mainImage: car.images.length > 0 ? car.images[0].thumbnailUrl || car.images[0].originalUrl : null,
      priceHistory: car.priceHistory.map(history => ({
        ...history,
        oldPrice: Number(history.oldPrice),
        newPrice: Number(history.newPrice),
      }))
    };

    return NextResponse.json({
      success: true,
      car: transformedCar
    });

  } catch (error) {
    console.error('Error fetching car details:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch car details',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Verify authentication (middleware already checked this, but double-check)
    const token = request.cookies.get('admin-token')?.value || request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Decode token to get admin info
    let adminUserId: string;
    let adminRole: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      adminUserId = payload.userId;
      adminRole = payload.role;

      // Verify admin privileges
      if (!payload.isAdmin || !['ADMIN', 'SUPER_ADMIN'].includes(adminRole)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Insufficient privileges' },
          { status: 403 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const carId = params.id;
    const body = await request.json();

    // 2. Validate required fields
    const {
      title, make, model, year, price, condition, status,
      featured, featuredUntil, location, currency, nctExpiry,
      ...otherUpdates
    } = body;

    // Validation
    if (title && (typeof title !== 'string' || title.trim().length < 3)) {
      return NextResponse.json(
        { success: false, error: 'Title must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (make && (typeof make !== 'string' || make.trim().length < 1)) {
      return NextResponse.json(
        { success: false, error: 'Make is required' },
        { status: 400 }
      );
    }

    if (model && (typeof model !== 'string' || model.trim().length < 1)) {
      return NextResponse.json(
        { success: false, error: 'Model is required' },
        { status: 400 }
      );
    }

    if (year !== undefined) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 2) {
        return NextResponse.json(
          { success: false, error: `Year must be between 1900 and ${new Date().getFullYear() + 2}` },
          { status: 400 }
        );
      }
    }

    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return NextResponse.json(
          { success: false, error: 'Price must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Verify car exists before updating
    const existingCar = await prisma.car.findUnique({
      where: { id: carId },
      select: { id: true, title: true, make: true, model: true, slug: true, year: true }
    });

    if (!existingCar) {
      return NextResponse.json(
        { success: false, error: 'Car not found' },
        { status: 404 }
      );
    }

    // 3. Build update data
    const updateData: any = { ...otherUpdates };

    if (title !== undefined) updateData.title = title.trim();
    if (make !== undefined) updateData.make = make.trim();
    if (model !== undefined) updateData.model = model.trim();
    if (year !== undefined) updateData.year = parseInt(year);
    if (price !== undefined) updateData.price = parseFloat(price);
    if (condition !== undefined) updateData.condition = condition;
    if (currency !== undefined) updateData.currency = currency;

    if (status !== undefined) {
      updateData.status = status;
    }

    if (featured !== undefined) {
      updateData.featured = featured;
      updateData.featuredUntil = featuredUntil ? new Date(featuredUntil) : null;
    }

    // Handle location (JSON field)
    if (location !== undefined) {
      updateData.location = location;
    }

    // Handle NCT expiry date
    if (nctExpiry !== undefined && nctExpiry !== null && nctExpiry !== '') {
      try {
        updateData.nctExpiry = new Date(nctExpiry);
      } catch (e) {
        return NextResponse.json(
          { success: false, error: 'Invalid NCT expiry date format' },
          { status: 400 }
        );
      }
    } else if (nctExpiry === '' || nctExpiry === null) {
      updateData.nctExpiry = null;
    }

    // 4. Regenerate slug if title, make, or model changed
    const shouldRegenerateSlug =
      (title && title !== existingCar.title) ||
      (make && make !== existingCar.make) ||
      (model && model !== existingCar.model);

    if (shouldRegenerateSlug) {
      const newTitle = title || existingCar.title;
      const newMake = make || existingCar.make;
      const newModel = model || existingCar.model;
      const newYear = year || existingCar.year;

      // Generate slug: make-model-year-randomid
      const baseSlug = `${newMake}-${newModel}-${newYear}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if slug exists
      let newSlug = baseSlug;
      let slugExists = await prisma.car.findFirst({
        where: {
          slug: newSlug,
          id: { not: carId }
        }
      });

      // Add suffix if slug exists
      let counter = 1;
      while (slugExists) {
        newSlug = `${baseSlug}-${counter}`;
        slugExists = await prisma.car.findFirst({
          where: {
            slug: newSlug,
            id: { not: carId }
          }
        });
        counter++;
      }

      updateData.slug = newSlug;
    }

    // Add audit trail
    updateData.updatedAt = new Date();

    // 5. Update the car
    const updatedCar = await prisma.car.update({
      where: { id: carId },
      data: updateData,
      include: {
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
                verified: true,
              }
            }
          }
        }
      }
    });

    // Log the admin action
    console.log(`[ADMIN ACTION] User ${adminUserId} (${adminRole}) updated car ${carId}`, {
      changes: Object.keys(updateData),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Car updated successfully',
      car: {
        ...updatedCar,
        price: Number(updatedCar.price),
        engineSize: updatedCar.engineSize ? Number(updatedCar.engineSize) : null,
      }
    });

  } catch (error: any) {
    console.error('Error updating car:', error);

    // More specific error messages
    let errorMessage = 'Failed to update car';
    let statusCode = 500;

    if (error.code === 'P2002') {
      errorMessage = 'A car with this slug already exists';
      statusCode = 409;
    } else if (error.code === 'P2025') {
      errorMessage = 'Car not found';
      statusCode = 404;
    } else if (error.name === 'ValidationError') {
      errorMessage = error.message;
      statusCode = 400;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const carId = params.id;

    // First check if car exists
    const existingCar = await prisma.car.findUnique({
      where: { id: carId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!existingCar) {
      return NextResponse.json(
        { success: false, error: 'Car not found' },
        { status: 404 }
      );
    }

    // Delete the car (this will cascade delete related records due to schema setup)
    await prisma.car.delete({
      where: { id: carId }
    });

    // Log the admin action
    // TODO: Add admin audit logging here when implemented

    return NextResponse.json({
      success: true,
      message: 'Car deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting car:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete car',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
