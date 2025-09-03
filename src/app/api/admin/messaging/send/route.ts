import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sendCustomAdminEmail } from '@/lib/email'
import { prisma } from '@/lib/database'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

// Rate limiting for email sending
const emailRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10, // Max 10 different IPs per minute
})

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest) {
  try {
    // Get token from cookies
    const adminToken = request.cookies.get('admin-token')?.value || 
                      request.cookies.get('auth-token')?.value;

    if (!adminToken) {
      console.log('❌ No admin token found in cookies')
      return null
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(adminToken, process.env.JWT_SECRET!);
    } catch (jwtError: any) {
      console.log('❌ JWT verification failed:', jwtError.message);
      return null
    }

    // Check if user still exists and is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        adminProfile: true 
      }
    });

    console.log('🔍 Admin auth check - User found:', {
      userId: user?.id,
      email: user?.email,
      hasAdminProfile: !!user?.adminProfile,
      adminProfileId: user?.adminProfile?.id,
      adminRole: user?.adminProfile?.adminRole,
      isActive: user?.adminProfile?.isActive
    });

    if (!user || !user.adminProfile || !user.adminProfile.isActive) {
      console.log('❌ User not found or admin profile inactive')
      return null
    }

    // Check if user account is active
    if (user.status !== 'ACTIVE') {
      console.log('❌ User account not active')
      return null
    }

    // Return admin info with correct IDs
    return {
      id: user.adminProfile.id, // AdminProfile.id for foreign key references
      userId: user.id, // User.id for other purposes
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.adminProfile.adminRole
    }
  } catch (error) {
    console.error('❌ Admin auth verification error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Starting email send request...')
    
    // Rate limiting
    const headersList = headers()
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               request.ip || 
               'unknown'

    try {
      await emailRateLimit.check(request, 10, ip) // 10 requests per minute per IP
    } catch {
      console.log('❌ Rate limit exceeded for IP:', ip)
      return NextResponse.json(
        { error: 'Too many email requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Verify admin authentication
    console.log('🔍 Verifying admin authentication for email send...')
    const admin = await verifyAdminAuth(request)
    
    if (!admin) {
      console.log('❌ Admin authentication failed for email send')
      return NextResponse.json(
        { 
          error: 'Unauthorized - Admin access required',
          details: 'Please make sure you are logged in as an admin'
        },
        { status: 401 }
      )
    }
    
    console.log('✅ Admin authenticated for email send:', {
      email: admin.email,
      role: admin.role,
      adminProfileId: admin.id
    })

    const body = await request.json()
    const { recipients, subject, message, template, emailType } = body

    console.log('📋 Email request data:', {
      recipientCount: recipients?.length,
      subject,
      template,
      emailType,
      hasMessage: !!message
    })

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      console.log('❌ Invalid recipients')
      return NextResponse.json(
        { error: 'Recipients are required and must be an array of email addresses' },
        { status: 400 }
      )
    }

    if (!subject || !message) {
      console.log('❌ Missing subject or message')
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      console.log('❌ Invalid email addresses:', invalidEmails)
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    console.log('✅ Validation passed, sending emails...')

    // Send emails using the sendCustomAdminEmail function
    const result = await sendCustomAdminEmail({
      recipients,
      subject,
      message,
      adminName: `${admin.firstName} ${admin.lastName}`,
      emailType: emailType || 'marketing',
      template: template || 'general'
    })

    console.log('📧 Email send result:', {
      success: result.success,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      error: result.error
    })

    if (!result.success) {
      console.error('❌ Email sending failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to send emails' },
        { status: 500 }
      )
    }

    // Log the email campaign in AdminAuditLog for history tracking
    try {
      console.log('🔍 Attempting to create audit log with admin ID:', admin.id);
      
      // Double-check the admin profile exists
      const adminProfileExists = await prisma.adminProfile.findUnique({
        where: { id: admin.id }
      });
      
      console.log('🔍 Admin profile exists check:', {
        adminId: admin.id,
        exists: !!adminProfileExists,
        profileData: adminProfileExists ? {
          id: adminProfileExists.id,
          adminRole: adminProfileExists.adminRole,
          isActive: adminProfileExists.isActive
        } : null
      });
      
      if (!adminProfileExists) {
        throw new Error(`Admin profile not found for ID: ${admin.id}`);
      }
      
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'USER_CREATED', // Using existing enum value closest to EMAIL_CAMPAIGN_SENT
          resourceType: 'USER', // Using existing enum value
          description: `Email campaign sent: ${subject}`,
          newValues: {
            subject,
            template,
            recipientCount: recipients.length,
            successCount: result.totalSent,
            failureCount: result.totalFailed,
            spamScore: result.spamScore,
            emailType: emailType,
            campaignType: 'email_campaign' // Custom marker
          },
          ipAddress: ip,
          userAgent: headersList.get('user-agent') || 'Unknown',
          endpoint: '/api/admin/messaging/send'
        }
      })
      
      console.log('✅ Email campaign logged in audit trail')
    } catch (auditError) {
      console.error('❌ Failed to log email campaign in audit trail:', auditError)
      // Don't fail the whole operation if audit logging fails - email was still sent successfully
    }

    console.log('✅ Email sending completed successfully')

    return NextResponse.json({
      success: true,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      results: result.results,
      errors: result.errors,
      spamScore: result.spamScore,
      warnings: result.warnings
    })

  } catch (error: any) {
    console.error('❌ Unexpected error in email send endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching email campaign history...')
    
    // Verify admin authentication
    const admin = await verifyAdminAuth(request)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Fetch email campaigns from audit logs
    const emailCampaigns = await prisma.adminAuditLog.findMany({
      where: {
        AND: [
          {
            newValues: {
              path: ['campaignType'],
              equals: 'email_campaign'
            }
          }
        ]
      },
      include: {
        admin: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 campaigns
    })

    const campaigns = emailCampaigns.map(log => ({
      id: log.id,
      subject: (log.newValues as any)?.subject || 'Unknown Subject',
      template: (log.newValues as any)?.template || 'general',
      recipients: (log.newValues as any)?.recipientCount || 0,
      sent: (log.newValues as any)?.successCount || 0,
      failed: (log.newValues as any)?.failureCount || 0,
      spamScore: (log.newValues as any)?.spamScore,
      status: (log.newValues as any)?.successCount > 0 ? 'completed' as const : 'failed' as const,
      sentAt: log.createdAt.toISOString(),
      sentBy: log.admin ? `${log.admin.user.firstName} ${log.admin.user.lastName}` : 'Unknown Admin'
    }))

    console.log(`✅ Found ${campaigns.length} email campaigns`)

    return NextResponse.json({
      success: true,
      campaigns
    })

  } catch (error: any) {
    console.error('❌ Failed to fetch email campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email campaigns', details: error.message },
      { status: 500 }
    )
  }
}