// src/app/api/admin/cars/[id]/moderate/route.ts - Car Moderation API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const carId = params.id;
    const body = await request.json();
    
    const { moderationStatus, rejectionReason } = body;

    // Validate moderation status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW', 'FLAGGED'];
    if (!validStatuses.includes(moderationStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid moderation status' },
        { status: 400 }
      );
    }

    // Check if car exists
    const existingCar = await prisma.car.findUnique({
      where: { id: carId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        }
      }
    });

    if (!existingCar) {
      return NextResponse.json(
        { success: false, error: 'Car not found' },
        { status: 404 }
      );
    }

    // Get admin user ID (in a real app, this would come from the JWT token)
    // For now, we'll use a placeholder - you should implement proper admin auth
    const adminUserId = 'admin-user-id'; // TODO: Get from JWT token

    // Build update data
    const updateData: any = {
      moderationStatus,
      moderatedAt: new Date(),
      moderatedBy: adminUserId,
      updatedAt: new Date(),
    };

    // Add rejection reason if provided
    if (moderationStatus === 'REJECTED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    } else if (moderationStatus === 'APPROVED') {
      // Clear rejection reason when approving
      updateData.rejectionReason = null;
    }

    // Update the car
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

    // Create notification for the car owner
    await prisma.notification.create({
      data: {
        userId: existingCar.user.id,
        type: 'SYSTEM_UPDATE',
        title: moderationStatus === 'APPROVED' 
          ? 'Car Listing Approved' 
          : 'Car Listing Rejected',
        message: moderationStatus === 'APPROVED'
          ? `Your car listing "${existingCar.title}" has been approved and is now live.`
          : `Your car listing "${existingCar.title}" has been rejected. ${rejectionReason || ''}`,
        carId: carId,
        actionUrl: `/cars/${carId}`,
        metadata: {
          moderationStatus,
          rejectionReason: rejectionReason || null,
          moderatedBy: adminUserId,
        }
      }
    });

    // Log the admin action
    // TODO: Add comprehensive admin audit logging here
    console.log(`Admin ${adminUserId} ${moderationStatus.toLowerCase()} car ${carId} (${existingCar.title})`);

    return NextResponse.json({
      success: true,
      message: `Car ${moderationStatus.toLowerCase()} successfully`,
      car: {
        ...updatedCar,
        price: Number(updatedCar.price),
        engineSize: updatedCar.engineSize ? Number(updatedCar.engineSize) : null,
      }
    });

  } catch (error) {
    console.error('Error moderating car:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to moderate car',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}