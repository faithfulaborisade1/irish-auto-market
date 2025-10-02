// API endpoint to download images from URLs and upload to Cloudinary
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dmynffe63',
  api_key: process.env.CLOUDINARY_API_KEY || '175672295118562',
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface ImageUrlRequest {
  imageUrls: string[];
  maxImages?: number;
}

interface ProcessedImage {
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
  size: number;
  publicId: string;
}

// Validate if URL is an image
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    return validExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

// Download image from URL and upload to Cloudinary
async function downloadAndUploadImage(imageUrl: string): Promise<ProcessedImage> {
  try {
    // Validate URL
    if (!isValidImageUrl(imageUrl)) {
      throw new Error(`Invalid image URL: ${imageUrl}`);
    }

    // Download image using fetch
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image from ${imageUrl}: ${response.status} ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`URL does not point to an image (content-type: ${contentType}): ${imageUrl}`);
    }

    // Get image buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const size = buffer.length;

    // Check file size (max 10MB)
    if (size > 10 * 1024 * 1024) {
      throw new Error(`Image size exceeds 10MB limit: ${(size / 1024 / 1024).toFixed(2)}MB`);
    }

    // Check Cloudinary config before attempting upload
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dmynffe63';
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(`Cloudinary configuration missing! Cloud Name: ${cloudName ? '✓' : '✗'}, API Key: ${apiKey ? '✓' : '✗'}, API Secret: ${apiSecret ? '✓' : '✗'}`);
    }

    // Upload to Cloudinary using upload stream
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'irish_auto_market/cars',
          resource_type: 'image',
          quality: 'auto',
          format: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message || JSON.stringify(error)}`));
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

    return {
      originalUrl: uploadResult.secure_url,
      thumbnailUrl: `${baseUrl}/c_limit,w_150,h_150,q_auto,f_auto/${uploadResult.public_id}`,
      mediumUrl: `${baseUrl}/c_limit,w_500,h_400,q_auto,f_auto/${uploadResult.public_id}`,
      largeUrl: `${baseUrl}/c_limit,w_800,h_600,q_auto,f_auto/${uploadResult.public_id}`,
      size,
      publicId: uploadResult.public_id,
    };
  } catch (error) {
    console.error(`Error processing image ${imageUrl}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageUrlRequest = await request.json();

    if (!body.imageUrls || !Array.isArray(body.imageUrls) || body.imageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Image URLs array is required' },
        { status: 400 }
      );
    }

    const maxImages = body.maxImages || 10;
    if (body.imageUrls.length > maxImages) {
      return NextResponse.json(
        { success: false, error: `Maximum ${maxImages} images allowed` },
        { status: 400 }
      );
    }

    // Process all images in parallel
    const results = await Promise.allSettled(
      body.imageUrls.map(url => downloadAndUploadImage(url))
    );

    const successful: ProcessedImage[] = [];
    const failed: { url: string; error: string }[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          url: body.imageUrls[index],
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        });
      }
    });

    // If all images failed, return error
    if (successful.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'All images failed to process',
          details: failed
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${successful.length} of ${body.imageUrls.length} images`,
      images: successful,
      failed: failed.length > 0 ? failed : undefined,
    });

  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
