// src/app/api/admin/cars/[id]/photos/route.ts - Car Photo Management API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadAndUploadImage, processImageUrls } from '@/lib/image-processor';

interface RouteParams {
  params: { id: string };
}

// GET - Retrieve all photos for a car
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const carId = params.id;

    const images = await prisma.carImage.findMany({
      where: { carId },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error('Error fetching car images:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch car images',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// POST - Add new photos to a car
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('admin-token')?.value || request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Decode token to verify admin privileges
    let adminUserId: string;
    let adminRole: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      adminUserId = payload.userId;
      adminRole = payload.role;

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

    // 2. Verify car exists
    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: {
        images: true,
      },
    });

    if (!car) {
      return NextResponse.json(
        { success: false, error: 'Car not found' },
        { status: 404 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { imageUrls, base64Images } = body;

    // Check total image limit (max 20 images per car)
    const currentImageCount = car.images.length;
    const maxImages = 20;

    let processedImages;

    if (base64Images && Array.isArray(base64Images) && base64Images.length > 0) {
      // Handle base64 file uploads
      if (currentImageCount + base64Images.length > maxImages) {
        return NextResponse.json(
          {
            success: false,
            error: `Maximum ${maxImages} images allowed per car. Currently: ${currentImageCount}, Adding: ${base64Images.length}`
          },
          { status: 400 }
        );
      }

      // Upload base64 images to Cloudinary
      const cloudinary = require('cloudinary').v2;

      processedImages = await Promise.all(
        base64Images.map(async (base64String: string) => {
          try {
            const uploadResult = await cloudinary.uploader.upload(base64String, {
              folder: 'irish_auto_market/cars',
              resource_type: 'image',
              quality: 'auto:good',
            });

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

            return {
              originalUrl: uploadResult.secure_url,
              thumbnailUrl: `${baseUrl}/c_limit,w_150,h_150,q_auto,f_auto/${uploadResult.public_id}`,
              mediumUrl: `${baseUrl}/c_limit,w_500,h_400,q_auto,f_auto/${uploadResult.public_id}`,
              largeUrl: `${baseUrl}/c_limit,w_800,h_600,q_auto,f_auto/${uploadResult.public_id}`,
              size: uploadResult.bytes,
              publicId: uploadResult.public_id,
            };
          } catch (error) {
            console.error('Error uploading base64 image:', error);
            throw error;
          }
        })
      );
    } else if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      // Handle URL-based uploads
      if (currentImageCount + imageUrls.length > maxImages) {
        return NextResponse.json(
          {
            success: false,
            error: `Maximum ${maxImages} images allowed per car. Currently: ${currentImageCount}, Adding: ${imageUrls.length}`
          },
          { status: 400 }
        );
      }

      // 4. Process and upload images from URLs to Cloudinary
      processedImages = await processImageUrls(imageUrls, imageUrls.length);
    } else {
      return NextResponse.json(
        { success: false, error: 'Either imageUrls or base64Images array is required' },
        { status: 400 }
      );
    }

    // 5. Save images to database
    const startIndex = currentImageCount;
    const createdImages = await Promise.all(
      processedImages.map((img, index) =>
        prisma.carImage.create({
          data: {
            carId,
            originalUrl: img.originalUrl,
            thumbnailUrl: img.thumbnailUrl,
            mediumUrl: img.mediumUrl,
            largeUrl: img.largeUrl,
            orderIndex: startIndex + index,
            fileSize: img.size,
          },
        })
      )
    );

    // Log the admin action
    console.log(`[ADMIN ACTION] User ${adminUserId} (${adminRole}) added ${createdImages.length} images to car ${carId}`, {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${createdImages.length} images`,
      images: createdImages,
    });
  } catch (error: any) {
    console.error('Error adding car images:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add car images',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// PATCH - Update photo order or details
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('admin-token')?.value || request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Decode token to verify admin privileges
    let adminUserId: string;
    let adminRole: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      adminUserId = payload.userId;
      adminRole = payload.role;

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
    const { imageOrders } = body;

    // imageOrders should be an array of { id, orderIndex }
    if (!imageOrders || !Array.isArray(imageOrders)) {
      return NextResponse.json(
        { success: false, error: 'imageOrders array is required' },
        { status: 400 }
      );
    }

    // 2. Verify car exists
    const car = await prisma.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      return NextResponse.json(
        { success: false, error: 'Car not found' },
        { status: 404 }
      );
    }

    // 3. Update image orders
    await Promise.all(
      imageOrders.map(({ id, orderIndex }) =>
        prisma.carImage.update({
          where: { id },
          data: { orderIndex },
        })
      )
    );

    // Log the admin action
    console.log(`[ADMIN ACTION] User ${adminUserId} (${adminRole}) reordered ${imageOrders.length} images for car ${carId}`, {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Image order updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating image order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update image order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove specific photos
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('admin-token')?.value || request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Decode token to verify admin privileges
    let adminUserId: string;
    let adminRole: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      adminUserId = payload.userId;
      adminRole = payload.role;

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
    const { searchParams } = new URL(request.url);
    const imageIds = searchParams.get('imageIds')?.split(',') || [];

    if (imageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'imageIds parameter is required' },
        { status: 400 }
      );
    }

    // 2. Verify car exists
    const car = await prisma.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      return NextResponse.json(
        { success: false, error: 'Car not found' },
        { status: 404 }
      );
    }

    // 3. Delete images
    await prisma.carImage.deleteMany({
      where: {
        id: { in: imageIds },
        carId, // Ensure images belong to this car
      },
    });

    // 4. Reorder remaining images
    const remainingImages = await prisma.carImage.findMany({
      where: { carId },
      orderBy: { orderIndex: 'asc' },
    });

    await Promise.all(
      remainingImages.map((img, index) =>
        prisma.carImage.update({
          where: { id: img.id },
          data: { orderIndex: index },
        })
      )
    );

    // Log the admin action
    console.log(`[ADMIN ACTION] User ${adminUserId} (${adminRole}) deleted ${imageIds.length} images from car ${carId}`, {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${imageIds.length} images`,
    });
  } catch (error: any) {
    console.error('Error deleting car images:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete car images',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
