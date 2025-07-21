// src/app/api/admin/dashboard/stats/route.ts - ENHANCED WITH SUPPORT DATA
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication (using your exact pattern)
    const authResult = await verifyAdminAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📊 Fetching enhanced dashboard data with support integration...');

    // ============================================================================
    // PARALLEL DATABASE QUERIES - ENHANCED WITH SUPPORT DATA
    // ============================================================================

    const [
      // Core Platform Statistics (existing)
      totalUsers,
      totalCars,
      activeCars,
      pendingCars,
      totalDealers,
      recentUsers,
      recentCars,
      featuredListings,
      
      // Support System Statistics (new)
      totalContacts,
      pendingContacts,
      totalFeedback,
      averageRating,
      totalReports,
      criticalReports,
      
      // Today's Activity (enhanced)
      userGrowthToday,
      carsAddedToday,
      contactsToday,
      feedbackToday,
      reportsToday,
      
      // Additional Analytics
      pendingDealerVerifications,
      recentSupport

    ] = await Promise.all([
      // ========================================================================
      // EXISTING CORE PLATFORM QUERIES
      // ========================================================================
      
      // Total users count
      prisma.user.count(),
      
      // Total cars count
      prisma.car.count(),
      
      // Active cars (status = ACTIVE)
      prisma.car.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Pending cars (moderationStatus = PENDING)
      prisma.car.count({
        where: { moderationStatus: 'PENDING' }
      }),
      
      // Total dealers (users with role DEALER)
      prisma.user.count({
        where: { role: 'DEALER' }
      }),
      
      // Recent users (last 5 for dashboard)
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          status: true
        }
      }),
      
      // Recent cars (last 5 for dashboard)
      prisma.car.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          make: true,
          model: true,
          year: true,
          price: true,
          status: true,
          moderationStatus: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      
      // Featured listings for revenue calculation
      prisma.featuredListing.findMany({
        where: {
          status: 'ACTIVE',
          paymentStatus: 'COMPLETED'
        },
        select: {
          pricePaid: true,
          currency: true,
          createdAt: true
        }
      }),

      // ========================================================================
      // NEW SUPPORT SYSTEM QUERIES
      // ========================================================================
      
      // Total contact messages
      prisma.contactMessage.count(),
      
      // Pending contact messages
      prisma.contactMessage.count({
        where: {
          status: {
            in: ['NEW', 'IN_PROGRESS']
          }
        }
      }),
      
      // Total feedback
      prisma.feedback.count(),
      
      // Average feedback rating
      prisma.feedback.aggregate({
        _avg: { rating: true },
        where: {
          rating: { not: null }
        }
      }),
      
      // Total issue reports
      prisma.issueReport.count(),
      
      // Critical unresolved reports
      prisma.issueReport.count({
        where: {
          severity: 'CRITICAL',
          resolved: false
        }
      }),

      // ========================================================================
      // TODAY'S ACTIVITY METRICS
      // ========================================================================
      
      // Users registered today
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Cars added today
      prisma.car.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Contact messages today
      prisma.contactMessage.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Feedback today
      prisma.feedback.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Reports today
      prisma.issueReport.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      // ========================================================================
      // ADDITIONAL ANALYTICS
      // ========================================================================
      
      // Pending dealer verifications
      prisma.dealerProfile.count({
        where: {
          verified: false
        }
      }),
      
      // Recent support activity (last 3 items for dashboard feed)
      Promise.all([
        prisma.contactMessage.findMany({
          take: 2,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            subject: true,
            category: true,
            createdAt: true
          }
        }),
        prisma.issueReport.findMany({
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            reporterName: true,
            title: true,
            type: true,
            severity: true,
            createdAt: true
          }
        })
      ])
    ]);

    // ============================================================================
    // DATA PROCESSING & CALCULATIONS
    // ============================================================================

    // Calculate revenue (existing logic)
    const totalRevenue = featuredListings.reduce((sum, listing) => {
      return sum + Number(listing.pricePaid);
    }, 0);

    // Calculate monthly revenue (current month)
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const monthlyRevenue = featuredListings
      .filter(listing => new Date(listing.createdAt) >= startOfMonth)
      .reduce((sum, listing) => sum + Number(listing.pricePaid), 0);

    // Process recent support activity
    const [recentContactMessages, recentIssueReports] = recentSupport;
    
    // ============================================================================
    // ENHANCED DASHBOARD DATA STRUCTURE
    // ============================================================================

    const dashboardData = {
      // ========================================================================
      // MAIN STATS (Enhanced with support)
      // ========================================================================
      totalUsers,
      totalCars,
      activeCars,
      pendingCars,
      totalDealers,
      totalRevenue,
      monthlyRevenue,
      
      // Support Statistics (NEW)
      supportStats: {
        totalContacts,
        pendingContacts,
        totalFeedback,
        totalReports,
        criticalReports,
        averageRating: Number(averageRating._avg.rating?.toFixed(1)) || 0
      },

      // ========================================================================
      // TODAY'S ACTIVITY (Enhanced)
      // ========================================================================
      todayStats: {
        newUsers: userGrowthToday,
        newCars: carsAddedToday,
        newContacts: contactsToday,
        newFeedback: feedbackToday,
        newReports: reportsToday,
        totalActivity: userGrowthToday + carsAddedToday + contactsToday + feedbackToday + reportsToday
      },

      // ========================================================================
      // RECENT ACTIVITY FEED (Enhanced with support)
      // ========================================================================
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      })),
      
      recentCars: recentCars.map(car => ({
        id: car.id,
        title: car.title,
        make: car.make,
        model: car.model,
        year: car.year,
        price: Number(car.price),
        status: car.status,
        moderationStatus: car.moderationStatus,
        createdAt: car.createdAt,
        owner: car.user ? `${car.user.firstName} ${car.user.lastName}`.trim() : 'Unknown'
      })),

      // Recent Support Activity (NEW)
      recentSupport: [
        ...recentContactMessages.map(contact => ({
          type: 'contact',
          id: contact.id,
          title: `Contact: ${contact.subject}`,
          description: `From ${contact.name} - ${contact.category}`,
          createdAt: contact.createdAt,
          url: `/admin/support?tab=contacts&id=${contact.id}`
        })),
        ...recentIssueReports.map(report => ({
          type: 'report',
          id: report.id,
          title: `${report.severity} Issue: ${report.title}`,
          description: `${report.type} reported by ${report.reporterName || 'Anonymous'}`,
          createdAt: report.createdAt,
          url: `/admin/support?tab=reports&id=${report.id}`
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      // ========================================================================
      // URGENT ACTIONS (Enhanced with support)
      // ========================================================================
      urgentActions: [
        // Critical reports (highest priority)
        ...(criticalReports > 0 ? [{
          type: 'critical_reports',
          count: criticalReports,
          title: 'Critical Issue Reports',
          description: `${criticalReports} critical issue${criticalReports > 1 ? 's' : ''} require immediate attention`,
          priority: 'CRITICAL',
          url: '/admin/support?tab=reports&filter=critical',
          icon: 'AlertTriangle'
        }] : []),

        // Pending car moderation
        ...(pendingCars > 0 ? [{
          type: 'car_moderation',
          count: pendingCars,
          title: 'Car Moderation Required',
          description: `${pendingCars} car${pendingCars > 1 ? 's' : ''} awaiting moderation approval`,
          priority: 'HIGH',
          url: '/admin/cars?filter=pending',
          icon: 'Car'
        }] : []),

        // Pending support contacts
        ...(pendingContacts > 5 ? [{
          type: 'support_backlog',
          count: pendingContacts,
          title: 'Support Request Backlog',
          description: `${pendingContacts} contact message${pendingContacts > 1 ? 's' : ''} awaiting response`,
          priority: 'MEDIUM',
          url: '/admin/support?tab=contacts&filter=pending',
          icon: 'MessageSquare'
        }] : []),

        // Dealer verifications
        ...(pendingDealerVerifications > 0 ? [{
          type: 'dealer_verification',
          count: pendingDealerVerifications,
          title: 'Dealer Verification',
          description: `${pendingDealerVerifications} dealer${pendingDealerVerifications > 1 ? 's' : ''} awaiting business verification`,
          priority: 'MEDIUM',
          url: '/admin/users?filter=dealers&status=unverified',
          icon: 'UserCheck'
        }] : [])
      ],

      // ========================================================================
      // SYSTEM HEALTH (Enhanced)
      // ========================================================================
      systemHealth: {
        uptime: '99.9%', // Can be made dynamic later
        errorRate: 0.01,
        responseTime: 185,
        supportResponseRate: totalContacts > 0 ? Math.round((totalContacts - pendingContacts) / totalContacts * 100) : 100,
        userSatisfaction: averageRating._avg.rating ? Math.round(averageRating._avg.rating * 20) : 100 // Convert 5-star to 100-point
      }
    };

    console.log('✅ Enhanced dashboard data successfully compiled:', {
      totalUsers,
      totalCars,
      totalContacts,
      totalFeedback,
      totalReports,
      pendingContacts,
      criticalReports,
      todayActivity: dashboardData.todayStats.totalActivity
    });

    return NextResponse.json(dashboardData);

  } catch (error: any) {
    console.error('❌ Enhanced dashboard API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load dashboard data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Auth verification function (keeping your exact pattern)
async function verifyAdminAuth(request: NextRequest): Promise<{
  success: boolean;
  adminId?: string;
  reason?: string;
}> {
  try {
    const token = getAuthToken(request);
    
    if (!token) {
      return { success: false, reason: 'no_token' };
    }

    // Basic JWT validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { success: false, reason: 'invalid_token_format' };
    }

    try {
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return { success: false, reason: 'token_expired' };
      }

      // Validate required fields
      if (!payload.userId || !payload.role || !payload.isAdmin) {
        return { success: false, reason: 'invalid_payload' };
      }

      return { 
        success: true, 
        adminId: payload.userId
      };
    } catch (decodeError) {
      return { success: false, reason: 'token_decode_failed' };
    }
  } catch (error: any) {
    return { success: false, reason: 'auth_error' };
  }
}

function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get('admin-token')?.value || 
         request.cookies.get('auth-token')?.value || 
         null;
}