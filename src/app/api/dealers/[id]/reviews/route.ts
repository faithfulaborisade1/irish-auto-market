// src/app/api/dealers/[id]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/dealers/[id]/reviews - Get all reviews for a dealer
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const dealerId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get reviews with pagination
    const reviews = await prisma.dealerReview.findMany({
      where: {
        dealerId,
        status: 'APPROVED',
        isPublic: true
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Get total count and rating stats
    const [totalReviews, ratingStats] = await Promise.all([
      prisma.dealerReview.count({
        where: {
          dealerId,
          status: 'APPROVED',
          isPublic: true
        }
      }),
      prisma.dealerReview.groupBy({
        by: ['rating'],
        where: {
          dealerId,
          status: 'APPROVED',
          isPublic: true
        },
        _count: {
          rating: true
        }
      })
    ]);

    // Calculate average rating
    const allRatings = await prisma.dealerReview.findMany({
      where: {
        dealerId,
        status: 'APPROVED',
        isPublic: true
      },
      select: {
        rating: true
      }
    });

    const averageRating = allRatings.length > 0
      ? allRatings.reduce((sum, review) => sum + review.rating, 0) / allRatings.length
      : 0;

    // Transform rating stats
    const ratingBreakdown = [1, 2, 3, 4, 5].map(rating => {
      const stat = ratingStats.find(s => s.rating === rating);
      return {
        rating,
        count: stat?._count.rating || 0,
        percentage: totalReviews > 0 ? ((stat?._count.rating || 0) / totalReviews) * 100 : 0
      };
    });

    // Transform reviews
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt,
      reviewer: {
        name: review.reviewerName,
        avatar: review.reviewer?.avatar,
        firstName: review.reviewer?.firstName
      }
    }));

    return NextResponse.json({
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit)
      },
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingBreakdown
      }
    });

  } catch (error) {
    console.error('Error fetching dealer reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/dealers/[id]/reviews - Create a new review
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const dealerId = params.id;
    const body = await request.json();
    const { rating, title, comment, reviewerName, reviewerEmail } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Comment must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (!reviewerName || reviewerName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Reviewer name is required' },
        { status: 400 }
      );
    }

    // Check if dealer exists
    const dealer = await prisma.dealerProfile.findUnique({
      where: { id: dealerId }
    });

    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    // Check for authenticated user (optional)
    let userId = null;
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        userId = decoded.userId;

        // Check if user already reviewed this dealer
        const existingReview = await prisma.dealerReview.findFirst({
          where: {
            dealerId,
            reviewerId: userId
          }
        });

        if (existingReview) {
          return NextResponse.json(
            { error: 'You have already reviewed this dealer' },
            { status: 400 }
          );
        }
      } catch (error) {
        // Invalid token, continue as anonymous
      }
    }

    // Create the review
    const review = await prisma.dealerReview.create({
      data: {
        dealerId,
        reviewerId: userId,
        reviewerName: reviewerName.trim(),
        reviewerEmail: reviewerEmail?.trim() || null,
        rating: parseInt(rating),
        title: title?.trim() || null,
        comment: comment.trim(),
        status: 'PENDING', // Reviews need approval
        isPublic: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully and is pending approval',
      reviewId: review.id
    });

  } catch (error) {
    console.error('Error creating dealer review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}