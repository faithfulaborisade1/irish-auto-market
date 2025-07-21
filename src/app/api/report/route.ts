// src/app/api/report/route.ts - FIXED - Matches Your Email Service Exactly
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { IssueType, IssueSeverity, ReportStatus, SecurityEventType, SecuritySeverity, NotificationType } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// Validation schema using your exact Prisma enums
const ReportSchema = z.object({
  reporterName: z.string().max(100, 'Name too long').optional(),
  reporterEmail: z.string().email('Invalid email format').optional(),
  type: z.nativeEnum(IssueType),
  severity: z.nativeEnum(IssueSeverity),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  pageUrl: z.string().optional(),
  carId: z.string().optional(),
  dealerId: z.string().optional(),
  stepsToReproduce: z.string().optional(),
  errorDetails: z.string().optional(),
  anonymous: z.boolean().optional().default(false)
})

// Check if issue should trigger urgent admin notification
function shouldNotifyAdmin(type: IssueType, severity: IssueSeverity): boolean {
  // ✅ FIXED: Type-safe critical type checking
  const isCriticalType = type === IssueType.SCAM_LISTING ||
                        type === IssueType.FAKE_DEALER ||
                        type === IssueType.SECURITY_CONCERN ||
                        type === IssueType.HARASSMENT;
                        
  return severity === IssueSeverity.CRITICAL || 
         severity === IssueSeverity.HIGH ||
         isCriticalType;
}

// Get notification type for admin emails
function getNotificationType(type: IssueType, severity: IssueSeverity): 'urgent_report' | 'support_contact' {
  // ✅ FIXED: Type-safe critical type checking
  const isCriticalType = type === IssueType.SCAM_LISTING ||
                        type === IssueType.FAKE_DEALER ||
                        type === IssueType.SECURITY_CONCERN ||
                        type === IssueType.HARASSMENT;
                        
  return (severity === IssueSeverity.CRITICAL || isCriticalType) 
    ? 'urgent_report' 
    : 'support_contact';
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 Processing issue report submission...')

    // Parse form data
    const formData = await request.formData()
    
    // Extract and validate form fields
    const reportData = {
      reporterName: formData.get('reporterName') as string || undefined,
      reporterEmail: formData.get('reporterEmail') as string || undefined,
      type: formData.get('type') as string,
      severity: formData.get('severity') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      pageUrl: formData.get('pageUrl') as string || undefined,
      carId: formData.get('carId') as string || undefined,
      dealerId: formData.get('dealerId') as string || undefined,
      stepsToReproduce: formData.get('stepsToReproduce') as string || undefined,
      errorDetails: formData.get('errorDetails') as string || undefined,
      anonymous: formData.get('anonymous') === 'true'
    }

    const validatedData = ReportSchema.parse(reportData)

    // Get user info if authenticated (optional)
    let userId: string | undefined
    let user: any = null

    try {
      const token = request.cookies.get('auth-token')?.value || request.cookies.get('admin-token')?.value
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, firstName: true, lastName: true, email: true }
        })
        if (user) {
          userId = user.id
        }
      }
    } catch (authError) {
      console.log('No authentication - proceeding as anonymous report')
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent')
    const referer = request.headers.get('referer')

    // Process uploaded screenshots
    const screenshots: string[] = []
    const screenshotEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('screenshot_'))
    
    for (const [key, file] of screenshotEntries) {
      if (file instanceof File) {
        // TODO: Upload to cloud storage (AWS S3, Cloudinary, etc.)
        // For now, we'll store the filename
        screenshots.push(file.name)
      }
    }

    // Validate car ID if provided
    let validCarId: string | undefined
    if (validatedData.carId) {
      const car = await prisma.car.findUnique({
        where: { id: validatedData.carId },
        select: { id: true }
      })
      validCarId = car?.id
    }

    // Validate dealer ID if provided  
    let validDealerId: string | undefined
    if (validatedData.dealerId) {
      const dealer = await prisma.user.findUnique({
        where: { id: validatedData.dealerId },
        select: { id: true, role: true }
      })
      if (dealer && dealer.role === 'DEALER') {
        validDealerId = dealer.id
      }
    }

    // Create issue report in database
    const issueReport = await prisma.issueReport.create({
      data: {
        reporterId: userId,
        reporterName: validatedData.anonymous ? undefined : validatedData.reporterName,
        reporterEmail: validatedData.anonymous ? undefined : validatedData.reporterEmail,
        type: validatedData.type,
        severity: validatedData.severity,
        title: validatedData.title,
        description: validatedData.description,
        pageUrl: validatedData.pageUrl || referer,
        carId: validCarId,
        dealerId: validDealerId,
        stepsToReproduce: validatedData.stepsToReproduce,
        errorDetails: validatedData.errorDetails,
        screenshots: screenshots.length > 0 ? screenshots : undefined,
        browserInfo: {
          userAgent: userAgent,
          referer: referer,
          platform: request.headers.get('sec-ch-ua-platform'),
          mobile: request.headers.get('sec-ch-ua-mobile'),
          anonymous: validatedData.anonymous
        },
        ipAddress: ipAddress,
        userAgent: userAgent,
        source: 'web',
        status: ReportStatus.NEW
      }
    })

    console.log(`✅ Issue report created: ${issueReport.id}`)

    // Create reference number
    const reportNumber = `IAM-${issueReport.id.slice(-8).toUpperCase()}`

    // ✅ FIXED: Send confirmation email using your exact function signature
    let confirmationResult: { success: boolean; error?: string; emailId?: string } = { 
      success: false, 
      error: 'Email service not available or anonymous report' 
    }
    
    if (!validatedData.anonymous && validatedData.reporterEmail) {
      try {
        if (process.env.RESEND_API_KEY) {
          const { sendSupportConfirmation } = await import('@/lib/email')
          
          // Using your exact function signature: sendSupportConfirmation(contact: { email, name, subject, category, id })
          confirmationResult = await sendSupportConfirmation({
            email: validatedData.reporterEmail,
            name: validatedData.reporterName || 'User',
            subject: `Issue Report: ${validatedData.title}`,
            category: `REPORT_${validatedData.type}`,
            id: issueReport.id
          })
        }
      } catch (emailError: any) {
        console.error('❌ Confirmation email failed:', emailError.message)
        confirmationResult = { success: false, error: emailError.message }
      }

      console.log(`📧 Confirmation email result:`, confirmationResult)
    }

    // ✅ FIXED: Send admin notification using your exact function signature
    let adminResult: { success: boolean; error?: string; emailId?: string } = { 
      success: false, 
      error: 'Not urgent report' 
    }
    
    if (shouldNotifyAdmin(validatedData.type, validatedData.severity)) {
      try {
        if (process.env.RESEND_API_KEY) {
          const { sendAdminNotification } = await import('@/lib/email')
          
          // Using your exact function signature: sendAdminNotification(notification: { type, data })
          adminResult = await sendAdminNotification({
            type: getNotificationType(validatedData.type, validatedData.severity),
            data: {
              type: validatedData.type.replace('_', ' '),
              severity: validatedData.severity,
              title: validatedData.title,
              reporterName: validatedData.anonymous ? 'Anonymous User' : (validatedData.reporterName || 'User'),
              reporterEmail: validatedData.anonymous ? 'anonymous@report' : (validatedData.reporterEmail || 'no-email'),
              message: validatedData.description.substring(0, 200) + (validatedData.description.length > 200 ? '...' : ''),
              id: issueReport.id
            }
          })
        }
      } catch (adminEmailError: any) {
        console.error('❌ Admin notification failed:', adminEmailError.message)
        adminResult = { success: false, error: adminEmailError.message }
      }

      console.log(`🔔 Admin notification result:`, adminResult)
    }

    // Create in-app notifications for admins
    try {
      const adminProfiles = await prisma.adminProfile.findMany({
        where: { isActive: true },
        select: { userId: true }
      })

      if (adminProfiles.length > 0) {
        const urgencyIcon = validatedData.severity === IssueSeverity.CRITICAL ? '🚨' : 
                           validatedData.severity === IssueSeverity.HIGH ? '⚠️' : '📝'
        
        const notifications = adminProfiles.map(admin => ({
          userId: admin.userId,
          type: NotificationType.ISSUE_REPORTED,
          title: `${urgencyIcon} ${validatedData.severity} Report: ${validatedData.type.replace(/_/g, ' ')}`,
          message: `${validatedData.anonymous ? 'Anonymous user' : (validatedData.reporterName || 'User')} reported: "${validatedData.title}"`,
          metadata: {
            reportId: issueReport.id,
            type: validatedData.type,
            severity: validatedData.severity,
            reportNumber: reportNumber,
            anonymous: validatedData.anonymous,
            carId: validCarId,
            dealerId: validDealerId
          }
        }))

        await prisma.notification.createMany({
          data: notifications
        })

        console.log(`🔔 Created ${notifications.length} admin notifications`)
      }
    } catch (notificationError) {
      console.warn('⚠️ Admin notifications failed:', notificationError)
      // Don't fail the request if notifications fail
    }

    // Create security event for security-related reports
    if (validatedData.type === IssueType.SECURITY_CONCERN || validatedData.severity === IssueSeverity.CRITICAL) {
      try {
        await prisma.securityEvent.create({
          data: {
            eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
            severity: validatedData.severity === IssueSeverity.CRITICAL ? SecuritySeverity.CRITICAL : SecuritySeverity.HIGH,
            description: `Security report: ${validatedData.title}`,
            targetUserId: validDealerId,
            targetIP: ipAddress,
            targetResource: validCarId || validDealerId,
            userAgent: userAgent,
            requestData: {
              reportId: issueReport.id,
              type: validatedData.type,
              anonymous: validatedData.anonymous,
              pageUrl: validatedData.pageUrl
            },
            blocked: false,
            detectionMethod: 'user_report',
            riskScore: validatedData.severity === IssueSeverity.CRITICAL ? 90 : 70
          }
        })

        console.log(`🔒 Security event created for ${validatedData.type} report`)
      } catch (securityError) {
        console.warn('⚠️ Failed to create security event:', securityError)
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: validatedData.anonymous 
        ? `Anonymous report submitted successfully! Reference: ${reportNumber}`
        : `Report submitted successfully! We'll investigate and get back to you. Reference: ${reportNumber}`,
      data: {
        id: issueReport.id,
        reportNumber: reportNumber,
        type: validatedData.type,
        severity: validatedData.severity,
        confirmationEmail: {
          sent: confirmationResult.success,
          error: confirmationResult.error
        },
        adminNotification: {
          sent: adminResult.success,
          reason: adminResult.error || 'Sent successfully'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Error processing report:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid report data',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    // Handle database errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Duplicate report submission detected' },
        { status: 409 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit report. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint for admin access (report statistics)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('admin-token')?.value || request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { adminProfile: true }
    })

    if (!user?.adminProfile) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const severity = url.searchParams.get('severity')

    // Build where clause
    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    if (severity) where.severity = severity

    // Get issue report statistics
    const [reportsList, totalCount, criticalIssues] = await Promise.all([
      prisma.issueReport.findMany({
        where,
        select: {
          id: true,
          reporterName: true,
          reporterEmail: true,
          type: true,
          severity: true,
          title: true,
          status: true,
          resolved: true,
          createdAt: true,
          carId: true,
          dealerId: true,
          description: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.issueReport.count({ where }),
      prisma.issueReport.findMany({
        where: {
          severity: IssueSeverity.CRITICAL,
          resolved: false
        },
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          reporterName: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Transform data for response
    const transformedReports = reportsList.map(report => ({
      id: report.id,
      reporterName: report.reporterName || 'Anonymous',
      reporterEmail: report.reporterEmail || 'Not provided',
      type: report.type,
      severity: report.severity,
      title: report.title,
      status: report.status,
      resolved: report.resolved,
      createdAt: report.createdAt,
      carId: report.carId,
      dealerId: report.dealerId,
      descriptionPreview: report.description?.substring(0, 100) + (report.description && report.description.length > 100 ? '...' : ''),
      reportNumber: `IAM-${report.id.slice(-8).toUpperCase()}`
    }))

    return NextResponse.json({
      success: true,
      data: {
        reports: transformedReports,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        criticalIssues: criticalIssues.length
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching reports:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

// Runtime configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'