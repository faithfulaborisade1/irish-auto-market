// src/app/api/admin/invitations/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Validation schema
const ValidateTokenSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

// GET /api/admin/invitations/validate?token=xxx - Validate invitation token
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/invitations/validate - Validating invitation token');

    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    // ✅ FIX: Check if token is null before using it
    if (!token) {
      return NextResponse.json(
        { 
          error: 'Missing invitation token',
          valid: false
        },
        { status: 400 }
      );
    }

    const validation = ValidateTokenSchema.safeParse({ token });
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid token format',
          details: validation.error.issues,
          valid: false
        },
        { status: 400 }
      );
    }

    // Find invitation by token - now token is guaranteed to be string
    const invitation = await prisma.dealerInvitation.findFirst({
      where: { 
        registrationToken: token, // ✅ TypeScript happy now
        status: {
          in: ['SENT', 'VIEWED'] // Only allow pending invitations
        }
      },
      include: {
        admin: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired invitation token',
          valid: false
        },
        { status: 404 }
      );
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true, role: true, status: true }
    });

    if (existingUser) {
      // Update invitation status
      await prisma.dealerInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ALREADY_MEMBER' }
      });

      return NextResponse.json(
        { 
          error: 'Email address is already registered',
          valid: false,
          existingUser: {
            role: existingUser.role,
            status: existingUser.status
          }
        },
        { status: 409 }
      );
    }

    // Update invitation to mark as viewed
    if (invitation.status === 'SENT') {
      await prisma.dealerInvitation.update({
        where: { id: invitation.id },
        data: { 
          status: 'VIEWED',
          viewedAt: new Date()
        }
      });
    }

    // Return invitation details for pre-filling form
    const invitationData = {
      id: invitation.id,
      email: invitation.email,
      businessName: invitation.businessName,
      contactName: invitation.contactName,
      phone: invitation.phone,
      location: invitation.location,
      sentAt: invitation.sentAt.toISOString(),
      invitedBy: {
        name: `${invitation.admin.user.firstName} ${invitation.admin.user.lastName}`,
        email: invitation.admin.user.email
      }
    };

    console.log(`✅ Valid invitation token for ${invitation.email}`);

    return NextResponse.json({
      success: true,
      valid: true,
      invitation: invitationData,
      message: 'Valid invitation token'
    });

  } catch (error: any) {
    console.error('❌ Error validating invitation token:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to validate invitation token',
        valid: false,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/invitations/validate - Update invitation status after registration
export async function POST(request: NextRequest) {
  try {
    console.log('✅ POST /api/admin/invitations/validate - Marking invitation as registered');

    const body = await request.json();
    const { token, userId } = body;

    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Token and userId are required' },
        { status: 400 }
      );
    }

    // Find and update invitation
    const invitation = await prisma.dealerInvitation.findFirst({
      where: { 
        registrationToken: token,
        status: {
          in: ['SENT', 'VIEWED']
        }
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Update invitation status to registered
    await prisma.dealerInvitation.update({
      where: { id: invitation.id },
      data: { 
        status: 'REGISTERED',
        registeredAt: new Date(),
        dealerUserId: userId
      }
    });

    console.log(`✅ Invitation marked as registered for ${invitation.email}`);

    return NextResponse.json({
      success: true,
      message: 'Invitation registration completed'
    });

  } catch (error: any) {
    console.error('❌ Error updating invitation status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update invitation status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}