// src/app/api/admin/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// GET /api/admin/reviews - Get all reviews for admin moderation
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const dealerId = searchParams.get('dealerId');

    // Build filter conditions
    const whereConditions: any = {};
    if (status !== 'all') {
      whereConditions.status = status.toUpperCase();
    }
    if (dealerId) {
      whereConditions.dealerId = dealerId;
    }

    // Get reviews with pagination
    const reviews = await prisma.dealerReview.findMany({
      where: whereConditions,
      include: {
        dealer: {
          select: {
            businessName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
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

    // Get total count
    const totalReviews = await prisma.dealerReview.count({
      where: whereConditions
    });

    // Get status counts for dashboard
    const statusCounts = await prisma.dealerReview.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      status: review.status,
      isPublic: review.isPublic,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      dealer: {
        id: review.dealerId,
        businessName: review.dealer?.businessName ||
                     `${review.dealer?.user?.firstName} ${review.dealer?.user?.lastName}`,
        email: review.dealer?.user?.email
      },
      reviewer: {
        id: review.reviewerId,
        name: review.reviewerName,
        email: review.reviewerEmail || review.reviewer?.email,
        avatar: review.reviewer?.avatar,
        isRegistered: !!review.reviewerId
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
      statusCounts: {
        pending: statusCounts.find(s => s.status === 'PENDING')?._count.status || 0,
        approved: statusCounts.find(s => s.status === 'APPROVED')?._count.status || 0,
        rejected: statusCounts.find(s => s.status === 'REJECTED')?._count.status || 0,
        flagged: statusCounts.find(s => s.status === 'FLAGGED')?._count.status || 0
      }
    });

  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}