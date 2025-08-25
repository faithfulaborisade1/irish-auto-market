// Create: src/app/api/check-invitations/route.ts
// Temporary route to check what's actually in the database

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking invitations in database...');
    
    // Get all invitations
    const invitations = await prisma.dealerInvitation.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📊 Found invitations:', invitations.length);
    
    // Calculate actual stats
    const stats = {
      total: invitations.length,
      sent: invitations.filter(i => i.status === 'SENT').length,
      viewed: invitations.filter(i => i.status === 'VIEWED').length,
      registered: invitations.filter(i => i.status === 'REGISTERED').length,
      alreadyMember: invitations.filter(i => i.status === 'ALREADY_MEMBER').length
    };
    
    console.log('📊 Calculated stats:', stats);
    
    // Get admin profiles for reference
    const adminProfiles = await prisma.adminProfile.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    console.log('👥 Admin profiles found:', adminProfiles.length);
    
    return NextResponse.json({
      success: true,
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        businessName: inv.businessName,
        status: inv.status,
        sentAt: inv.sentAt,
        registrationToken: inv.registrationToken ? 'Present' : 'Missing',
        invitedBy: {
          name: `${inv.admin.user.firstName} ${inv.admin.user.lastName}`,
          email: inv.admin.user.email
        }
      })),
      stats,
      adminProfiles: adminProfiles.map(admin => ({
        id: admin.id,
        role: admin.adminRole,
        user: admin.user
      })),
      totalInvitations: invitations.length,
      lastInvitation: invitations[0] || null
    });
    
  } catch (error: any) {
    console.error('❌ Error checking invitations:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}