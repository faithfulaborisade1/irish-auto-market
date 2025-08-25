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
    const carId = params.id;
    const body = await request.json();
    
    const { status, featured, featuredUntil, ...otherUpdates } = body;

    // Build update data
    const updateData: any = { ...otherUpdates };
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (featured !== undefined) {
      updateData.featured = featured;
      updateData.featuredUntil = featuredUntil ? new Date(featuredUntil) : null;
    }

    // Add audit trail
    updateData.updatedAt = new Date();

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
    // TODO: Add admin audit logging here when implemented

    return NextResponse.json({
      success: true,
      message: 'Car updated successfully',
      car: {
        ...updatedCar,
        price: Number(updatedCar.price),
        engineSize: updatedCar.engineSize ? Number(updatedCar.engineSize) : null,
      }
    });

  } catch (error) {
    console.error('Error updating car:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update car',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
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