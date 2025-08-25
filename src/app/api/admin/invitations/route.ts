// src/app/api/admin/invitations/route.ts - FIXED VERSION WITH DEBUG LOGGING
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Validation schemas
const SendInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  businessName: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional()
});

const BulkInvitationSchema = z.object({
  invitations: z.array(z.object({
    email: z.string().email('Invalid email format'),
    businessName: z.string().optional(),
    contactName: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional()
  })).min(1, 'At least one invitation required').max(100, 'Maximum 100 invitations at once')
});

// Helper function to verify admin authentication and permissions
async function verifyAdminAuth(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin-token')?.value || 
                      request.cookies.get('auth-token')?.value;

    if (!adminToken) {
      return { error: 'No admin token provided', status: 401 };
    }

    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET!) as any;
    
    if (!decoded?.userId) {
      return { error: 'Invalid token format', status: 401 };
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        adminProfile: true
      }
    });

    if (!adminUser) {
      return { error: 'Admin user not found', status: 401 };
    }

    if (!adminUser.adminProfile) {
      return { error: 'User is not an admin', status: 403 };
    }

    if (adminUser.status !== 'ACTIVE') {
      return { error: 'Admin account is disabled', status: 403 };
    }

    // Only SUPER_ADMIN can send dealer invitations
    if (adminUser.adminProfile.adminRole !== 'SUPER_ADMIN') {
      return { error: 'Only Super Admins can send dealer invitations', status: 403 };
    }

    return { 
      user: adminUser, 
      adminProfile: adminUser.adminProfile
    };

  } catch (error: any) {
    console.error('Admin auth verification error:', error);
    return { error: 'Token verification failed', status: 401 };
  }
}

// Helper function to log admin actions
async function logAdminAction(adminId: string, action: string, details: any, ip?: string) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'DEALER_INVITED' as any,
        resourceType: 'DEALER_INVITATION' as any,
        resourceId: details.invitationId || null,
        ipAddress: ip || 'unknown',
        severity: 'INFO' as any,
        description: `${action}: Sent dealer invitation to ${details.email}`,
        oldValues: undefined,
        newValues: details,
        userAgent: undefined,
        endpoint: '/api/admin/invitations',
        tags: undefined
      }
    });
  } catch (error: any) {
    console.log('📝 Audit logging failed (non-critical):', error.message);
  }
}

// Generate unique invitation token
function generateInvitationToken(): string {
  return Buffer.from(`${Date.now()}-${Math.random().toString(36)}`).toString('base64url');
}

// Check if email is already a user
async function checkExistingUser(email: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, role: true, status: true }
  });
  return existingUser;
}

// Send dealer invitation email
async function sendInvitationEmail(invitation: any, adminName: string) {
  try {
    console.log('📧 Attempting to send dealer invitation email to:', invitation.email);
    
    // Check if environment is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }
    
    console.log('✅ Environment check passed, importing email function...');
    
    // Dynamic import to prevent build issues
    const { sendDealerInvitation } = await import('@/lib/email');
    console.log('✅ Email function imported successfully');
    
    // Prepare the invitation data with correct parameter structure
    const invitationData = {
      email: invitation.email,
      businessName: invitation.businessName || undefined,
      contactName: invitation.contactName || undefined,  
      location: invitation.location || undefined,
      registrationToken: invitation.registrationToken,
      adminName: adminName
    };
    
    console.log('📧 Sending invitation with data:', {
      email: invitationData.email,
      businessName: invitationData.businessName,
      contactName: invitationData.contactName,
      location: invitationData.location,
      hasToken: !!invitationData.registrationToken,
      adminName: invitationData.adminName
    });
    
    // Call the email function with correct parameters
    const result = await sendDealerInvitation(invitationData);

    console.log('📧 Email send result:', result);
    
    if (result.success) {
      console.log('✅ Dealer invitation sent successfully to:', invitation.email, 'with ID:', result.emailId);
    } else {
      console.error('❌ Failed to send dealer invitation:', result.error);
    }
    
    return result;
    
  } catch (error: any) {
    console.error('❌ Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// GET /api/admin/invitations - Get all dealer invitations
export async function GET(request: NextRequest) {
  try {
    console.log('📧 GET /api/admin/invitations - Fetching dealer invitations');

    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== 'all') {
      whereClause.status = status;
    }

    // Get total count
    const totalCount = await prisma.dealerInvitation.count({
      where: whereClause
    });

    // Fetch invitations with admin and dealer info
    const invitations = await prisma.dealerInvitation.findMany({
      where: whereClause,
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
        },
        dealerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            dealerProfile: {
              select: {
                businessName: true,
                verified: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Transform for frontend
    const transformedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      businessName: invitation.businessName,
      contactName: invitation.contactName,
      phone: invitation.phone,
      location: invitation.location,
      status: invitation.status,
      sentAt: invitation.sentAt.toISOString(),
      viewedAt: invitation.viewedAt?.toISOString() || null,
      registeredAt: invitation.registeredAt?.toISOString() || null,
      invitedBy: {
        name: `${invitation.admin.user.firstName} ${invitation.admin.user.lastName}`,
        email: invitation.admin.user.email
      },
      dealerUser: invitation.dealerUser ? {
        id: invitation.dealerUser.id,
        name: `${invitation.dealerUser.firstName} ${invitation.dealerUser.lastName}`,
        email: invitation.dealerUser.email,
        registeredAt: invitation.dealerUser.createdAt.toISOString(),
        businessName: invitation.dealerUser.dealerProfile?.businessName,
        verified: invitation.dealerUser.dealerProfile?.verified
      } : null,
      createdAt: invitation.createdAt.toISOString()
    }));

    // Calculate statistics
    const stats = {
      total: totalCount,
      sent: invitations.filter(i => i.status === 'SENT').length,
      viewed: invitations.filter(i => i.status === 'VIEWED').length,
      registered: invitations.filter(i => i.status === 'REGISTERED').length,
      alreadyMember: invitations.filter(i => i.status === 'ALREADY_MEMBER').length
    };

    return NextResponse.json({
      success: true,
      invitations: transformedInvitations,
      statistics: stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching invitations:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch invitations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/invitations - Send dealer invitation(s)
export async function POST(request: NextRequest) {
  try {
    console.log('📧 POST /api/admin/invitations - Sending dealer invitations');

    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const currentAdmin = authResult.user;
    console.log('🔍 DEBUG: Current admin:', currentAdmin.firstName, currentAdmin.lastName);
    console.log('🔍 DEBUG: Admin profile ID:', currentAdmin.adminProfile?.id);
    
    const body = await request.json();

    // Determine if single or bulk invitation
    const isBulk = Array.isArray(body.invitations);
    let validatedData;

    if (isBulk) {
      const validation = BulkInvitationSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Invalid bulk invitation data',
            details: validation.error.issues
          },
          { status: 400 }
        );
      }
      validatedData = validation.data.invitations;
    } else {
      const validation = SendInvitationSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Invalid invitation data',
            details: validation.error.issues
          },
          { status: 400 }
        );
      }
      validatedData = [validation.data];
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[],
      alreadyExists: [] as any[]
    };

    const adminName = `${currentAdmin.firstName} ${currentAdmin.lastName}`;
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    console.log('🔍 DEBUG: About to process', validatedData.length, 'invitations');

    // Process each invitation
    for (const invitationData of validatedData) {
      try {
        const email = invitationData.email.toLowerCase();
        
        console.log('🔍 DEBUG: Processing invitation for:', email);

        // Check if user already exists
        const existingUser = await checkExistingUser(email);
        if (existingUser) {
          console.log('🔍 DEBUG: User already exists:', email);
          results.alreadyExists.push({
            email,
            reason: `User already exists with role: ${existingUser.role}`,
            existingUser: {
              id: existingUser.id,
              role: existingUser.role,
              status: existingUser.status
            }
          });
          continue;
        }

        // Check if invitation already exists
        const existingInvitation = await prisma.dealerInvitation.findFirst({
          where: { email }
        });

        if (existingInvitation) {
          console.log('🔍 DEBUG: Invitation already exists for:', email);
          results.alreadyExists.push({
            email,
            reason: 'Invitation already sent',
            existingInvitation: {
              id: existingInvitation.id,
              status: existingInvitation.status,
              sentAt: existingInvitation.sentAt.toISOString()
            }
          });
          continue;
        }

        // Generate token BEFORE creating invitation
        const registrationToken = generateInvitationToken();
        console.log('🔍 DEBUG: Generated registration token:', registrationToken);
        console.log('🔍 DEBUG: About to create invitation record...');

        // Create invitation record with better error handling
        let invitation;
        try {
          invitation = await prisma.dealerInvitation.create({
            data: {
              email,
              businessName: invitationData.businessName || null,
              contactName: invitationData.contactName || null,
              phone: invitationData.phone || null,
              location: invitationData.location || null,
              registrationToken,
              invitedBy: currentAdmin.adminProfile!.id,
              ipAddress: clientIP,
              source: isBulk ? 'bulk_import' : 'admin_dashboard'
            }
          });
          
          console.log('✅ DEBUG: Invitation record created successfully:', invitation.id);
          console.log('🔍 DEBUG: Invitation data:', {
            id: invitation.id,
            email: invitation.email,
            registrationToken: invitation.registrationToken,
            invitedBy: invitation.invitedBy
          });
          
        } catch (dbError: any) {
          console.error('❌ DATABASE ERROR creating invitation:', dbError);
          console.error('❌ Error details:', {
            message: dbError.message,
            code: dbError.code,
            meta: dbError.meta
          });
          
          results.failed.push({
            email,
            reason: `Database error: ${dbError.message}`
          });
          continue;
        }

        // Send email
        console.log('🔍 DEBUG: About to send email for:', email);
        const emailResult = await sendInvitationEmail(invitation, adminName);

        if (emailResult.success) {
          console.log('🔍 DEBUG: Email sent successfully, adding to results...');
          results.successful.push({
            id: invitation.id,
            email,
            businessName: invitationData.businessName,
            contactName: invitationData.contactName,
            emailId: emailResult.emailId
          });

          // Log successful invitation
          if (currentAdmin.adminProfile) {
            await logAdminAction(
              currentAdmin.adminProfile.id,
              'DEALER_INVITATION_SENT',
              {
                invitationId: invitation.id,
                email,
                businessName: invitationData.businessName,
                method: isBulk ? 'bulk' : 'individual',
                emailId: emailResult.emailId
              },
              clientIP
            );
          }
        } else {
          console.log('🔍 DEBUG: Email failed:', emailResult.error);
          results.failed.push({
            email,
            reason: emailResult.error || 'Email sending failed'
          });

          // Keep invitation record even if email fails (for retry)
          console.log(`⚠️ Email failed for ${email}, but invitation record created for retry`);
        }

        console.log('🔍 DEBUG: Results so far:', {
          successful: results.successful.length,
          failed: results.failed.length,
          alreadyExists: results.alreadyExists.length
        });

      } catch (error: any) {
        console.error(`❌ Error processing invitation for ${invitationData.email}:`, error);
        results.failed.push({
          email: invitationData.email,
          reason: error.message || 'Processing failed'
        });
      }
    }

    const summary = {
      total: validatedData.length,
      successful: results.successful.length,
      failed: results.failed.length,
      alreadyExists: results.alreadyExists.length
    };

    console.log(`✅ Invitation batch complete: ${summary.successful}/${summary.total} successful`);
    console.log('🔍 DEBUG: Final results:', results);

    return NextResponse.json({
      success: true,
      message: `Processed ${summary.total} invitations: ${summary.successful} sent, ${summary.failed} failed, ${summary.alreadyExists} already exist`,
      summary,
      results: {
        successful: results.successful,
        failed: results.failed,
        alreadyExists: results.alreadyExists
      }
    });

  } catch (error: any) {
    console.error('❌ Error sending invitations:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send invitations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}