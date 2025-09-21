// src/app/api/admin/reviews/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

interface Params {
  params: {
    id: string;
  };
}

// PATCH /api/admin/reviews/[id] - Update review status
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, firstName: true, lastName: true }
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reviewId = params.id;
    const body = await request.json();
    const { status, moderatorNotes } = body;

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Check if review exists
    const existingReview = await prisma.dealerReview.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Update review status
    const updatedReview = await prisma.dealerReview.update({
      where: { id: reviewId },
      data: {
        status,
        moderatorNotes: moderatorNotes || null
      },
      include: {
        dealer: {
          select: {
            businessName: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Log admin action for audit trail
    await prisma.adminAuditLog.create({
      data: {
        adminId: decoded.userId,
        action: 'REVIEW_MODERATION',
        resourceType: 'DEALER_REVIEW',
        resourceId: reviewId,
        description: `Review ${status.toLowerCase()} for dealer: ${updatedReview.dealer?.businessName || `${updatedReview.dealer?.user?.firstName} ${updatedReview.dealer?.user?.lastName}`}`,
        oldValues: { status: existingReview.status },
        newValues: { status, moderatorNotes },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || null,
        endpoint: `/api/admin/reviews/${reviewId}`
      }
    });

    return NextResponse.json({
      success: true,
      message: `Review ${status.toLowerCase()} successfully`,
      review: {
        id: updatedReview.id,
        status: updatedReview.status,
        moderatorNotes: updatedReview.moderatorNotes
      }
    });

  } catch (error) {
    console.error('Error updating review status:', error);
    return NextResponse.json(
      { error: 'Failed to update review status' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews/[id] - Delete review (hard delete)
export async function DELETE(request: NextRequest, { params }: Params) {
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

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin required' }, { status: 403 });
    }

    const reviewId = params.id;

    // Check if review exists and get details for audit
    const existingReview = await prisma.dealerReview.findUnique({
      where: { id: reviewId },
      include: {
        dealer: {
          select: {
            businessName: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Delete the review
    await prisma.dealerReview.delete({
      where: { id: reviewId }
    });

    // Log admin action for audit trail
    await prisma.adminAuditLog.create({
      data: {
        adminId: decoded.userId,
        action: 'REVIEW_DELETION',
        resourceType: 'DEALER_REVIEW',
        resourceId: reviewId,
        description: `Deleted review for dealer: ${existingReview.dealer?.businessName || `${existingReview.dealer?.user?.firstName} ${existingReview.dealer?.user?.lastName}`}`,
        oldValues: {
          rating: existingReview.rating,
          comment: existingReview.comment,
          reviewerName: existingReview.reviewerName,
          status: existingReview.status
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || null,
        endpoint: `/api/admin/reviews/${reviewId}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}