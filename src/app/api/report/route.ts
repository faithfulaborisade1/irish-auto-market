// src/app/api/report/route.ts - Complete with Email Integration
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { sendSupportConfirmation, sendAdminNotification } from '@/lib/email'

const prisma = new PrismaClient()

// Type definitions
type IssueType = 'BUG' | 'SCAM_LISTING' | 'INAPPROPRIATE_CONTENT' | 'FAKE_DEALER' | 'PRICING_ERROR' | 'SPAM' | 'HARASSMENT' | 'TECHNICAL_ISSUE' | 'SECURITY_CONCERN' | 'DATA_PRIVACY' | 'OTHER'
type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Valid issue types
const VALID_ISSUE_TYPES = [
  'BUG',
  'SCAM_LISTING',
  'INAPPROPRIATE_CONTENT',
  'FAKE_DEALER',
  'PRICING_ERROR',
  'SPAM',
  'HARASSMENT',
  'TECHNICAL_ISSUE',
  'SECURITY_CONCERN',
  'DATA_PRIVACY',
  'OTHER'
]

// Valid severity levels
const VALID_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract form fields
    const reporterName = formData.get('reporterName') as string
    const reporterEmail = formData.get('reporterEmail') as string
    const type = formData.get('type') as string
    const severity = formData.get('severity') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const pageUrl = formData.get('pageUrl') as string
    const carId = formData.get('carId') as string
    const dealerId = formData.get('dealerId') as string
    const stepsToReproduce = formData.get('stepsToReproduce') as string
    const errorDetails = formData.get('errorDetails') as string
    const anonymous = formData.get('anonymous') === 'true'

    // Validate required fields
    if (!title || !description || !type || !severity) {
      return NextResponse.json(
        { success: false, message: 'Title, description, type, and severity are required' },
        { status: 400 }
      )
    }

    // Validate issue type
    if (!VALID_ISSUE_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid issue type selected' },
        { status: 400 }
      )
    }

    // Validate severity
    if (!VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json(
        { success: false, message: 'Invalid severity level selected' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (reporterEmail && !anonymous) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(reporterEmail)) {
        return NextResponse.json(
          { success: false, message: 'Please enter a valid email address' },
          { status: 400 }
        )
      }
    }

    // Validate description length
    if (description.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Description is too long (maximum 5000 characters)' },
        { status: 400 }
      )
    }

    // Check if user is logged in (optional)
    let userId = null
    try {
      const token = request.cookies.get('auth-token')?.value || request.cookies.get('admin-token')?.value
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        userId = decoded.userId
      }
    } catch (error) {
      // User not logged in - that's okay for reports
    }

    // Get IP address and user agent for tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Process uploaded screenshots
    const screenshots: string[] = []
    const screenshotEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('screenshot_'))
    
    for (const [key, file] of screenshotEntries) {
      if (file instanceof File) {
        // TODO: Upload to cloud storage (AWS S3, Cloudinary, etc.)
        // For now, we'll just store the filename
        screenshots.push(file.name)
      }
    }

    // Validate car ID if provided
    let validCarId = null
    if (carId) {
      const car = await prisma.car.findUnique({
        where: { id: carId },
        select: { id: true }
      })
      validCarId = car?.id || null
    }

    // Validate dealer ID if provided
    let validDealerId = null
    if (dealerId) {
      const dealer = await prisma.user.findUnique({
        where: { id: dealerId },
        select: { id: true, role: true }
      })
      if (dealer && dealer.role === 'DEALER') {
        validDealerId = dealer.id
      }
    }

    // Get browser info
    const browserInfo = {
      userAgent: userAgent,
      referer: request.headers.get('referer'),
      platform: request.headers.get('sec-ch-ua-platform'),
      mobile: request.headers.get('sec-ch-ua-mobile'),
      anonymous: anonymous
    }

    // Create issue report in database
    const issueReport = await prisma.issueReport.create({
      data: {
        reporterId: userId,
        reporterName: anonymous ? null : (reporterName?.trim() || null),
        reporterEmail: anonymous ? null : (reporterEmail?.toLowerCase().trim() || null),
        type: type as IssueType,
        severity: severity as IssueSeverity,
        title: title.trim(),
        description: description.trim(),
        pageUrl: pageUrl?.trim() || null,
        carId: validCarId,
        dealerId: validDealerId,
        stepsToReproduce: stepsToReproduce?.trim() || null,
        errorDetails: errorDetails?.trim() || null,
        screenshots: screenshots.length > 0 ? screenshots : undefined,
        browserInfo: browserInfo,
        ipAddress: ip,
        userAgent: userAgent,
        source: 'web'
      }
    })

    const reportNumber = `IAM-${issueReport.id.slice(-8).toUpperCase()}`;
    console.log(`✅ Issue report created: ${reportNumber} (${type}, ${severity})`);

    // ============================================================================
    // EMAIL NOTIFICATIONS
    // ============================================================================

    // Send confirmation email to reporter (if not anonymous and email provided)
    if (!anonymous && reporterEmail) {
      sendSupportConfirmation({
        email: reporterEmail,
        name: reporterName || 'User',
        subject: `Issue Report: ${title}`,
        category: `REPORT_${type}`,
        id: issueReport.id
      }).then(emailResult => {
        if (emailResult.success) {
          console.log(`✅ Report confirmation sent to ${reporterEmail}`);
        } else {
          console.error(`❌ Failed to send report confirmation:`, emailResult.error);
        }
      }).catch(emailError => {
        console.error('❌ Report confirmation error:', emailError);
      });
    }

    // Send admin notification for critical/high severity issues or specific types
    const criticalTypes = ['SCAM_LISTING', 'FAKE_DEALER', 'SECURITY_CONCERN', 'HARASSMENT'];
    const shouldNotifyAdmin = (
      severity === 'CRITICAL' || 
      severity === 'HIGH' ||
      criticalTypes.includes(type)
    );

    if (shouldNotifyAdmin) {
      const notificationType = (severity === 'CRITICAL' || criticalTypes.includes(type)) 
        ? 'urgent_report' 
        : 'support_contact';

      sendAdminNotification({
        type: notificationType,
        data: {
          reporterName: anonymous ? 'Anonymous User' : (reporterName || 'User'),
          reporterEmail: anonymous ? 'anonymous@report' : (reporterEmail || 'no-email'),
          type: type,
          severity: severity,
          title: title,
          description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
          id: issueReport.id,
          pageUrl: pageUrl,
          carId: validCarId,
          dealerId: validDealerId
        }
      }).then(adminResult => {
        if (adminResult.success) {
          console.log(`✅ Admin notification sent for ${severity} ${type} report`);
        } else {
          console.error(`❌ Failed to send admin notification:`, adminResult.error);
        }
      }).catch(adminError => {
        console.error('❌ Admin notification error:', adminError);
      });
    }

    // Create in-app notification for admins (for all reports)
    try {
      const adminProfiles = await prisma.adminProfile.findMany({
        where: { isActive: true },
        select: { userId: true }
      });

      if (adminProfiles.length > 0) {
        const urgencyIcon = severity === 'CRITICAL' ? '🚨' : severity === 'HIGH' ? '⚠️' : '📝';
        
        const notifications = adminProfiles.map(admin => ({
          userId: admin.userId,
          type: 'ISSUE_REPORTED' as const,
          title: `${urgencyIcon} ${severity} Report: ${type.replace('_', ' ')}`,
          message: `${anonymous ? 'Anonymous user' : (reporterName || 'User')} reported: "${title}"`,
          metadata: {
            reportId: issueReport.id,
            type: type,
            severity: severity,
            reportNumber: reportNumber,
            anonymous: anonymous,
            carId: validCarId,
            dealerId: validDealerId
          }
        }));

        await prisma.notification.createMany({
          data: notifications
        });

        console.log(`🔔 Created ${notifications.length} admin notifications for ${severity} report`);
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to create admin notifications:', notificationError);
      // Don't fail report submission if notifications fail
    }

    // Create security event for security-related reports
    if (type === 'SECURITY_CONCERN' || severity === 'CRITICAL') {
      try {
        await prisma.securityEvent.create({
          data: {
            eventType: 'SUSPICIOUS_ACTIVITY',
            severity: severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            description: `Security report: ${title}`,
            targetUserId: validDealerId || undefined,
            targetIP: ip,
            targetResource: validCarId || validDealerId || undefined,
            userAgent: userAgent,
            requestData: {
              reportId: issueReport.id,
              type: type,
              anonymous: anonymous,
              pageUrl: pageUrl
            },
            blocked: false,
            detectionMethod: 'user_report',
            riskScore: severity === 'CRITICAL' ? 90 : 70
          }
        });

        console.log(`🔒 Security event created for ${type} report`);
      } catch (securityError) {
        console.warn('⚠️ Failed to create security event:', securityError);
      }
    }

    return NextResponse.json({
      success: true,
      message: anonymous 
        ? `Anonymous report submitted successfully! Reference: ${reportNumber}`
        : `Report submitted successfully! We'll investigate and get back to you. Reference: ${reportNumber}`,
      id: issueReport.id,
      reportNumber: reportNumber
    })

  } catch (error) {
    console.error('Issue report submission error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // This endpoint can be used to get issue report statistics for admin
  try {
    // Check if user is admin
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    // Get admin profile
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId }
    })

    if (!adminProfile) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get issue report statistics
    const stats = await prisma.issueReport.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const typeStats = await prisma.issueReport.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    })

    const severityStats = await prisma.issueReport.groupBy({
      by: ['severity'],
      _count: {
        id: true
      }
    })

    // Get recent reports
    const recentReports = await prisma.issueReport.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        reporterName: true,
        reporterEmail: true,
        type: true,
        severity: true,
        title: true,
        status: true,
        createdAt: true,
        carId: true,
        dealerId: true
      }
    })

    // Get critical unresolved issues
    const criticalIssues = await prisma.issueReport.findMany({
      where: {
        severity: 'CRITICAL',
        resolved: false
      },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        reporterName: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        stats,
        typeStats,
        severityStats,
        recentReports,
        criticalIssues
      }
    })

  } catch (error) {
    console.error('Issue report stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}