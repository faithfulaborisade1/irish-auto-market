// src/app/api/admin/support/stats/route.ts - Support Statistics API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// ✅ FIX: Force dynamic rendering for cookie access
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication (following your exact pattern)
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get admin profile (following your pattern)
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId }
    });

    if (!adminProfile) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('📊 Fetching support statistics from database...');

    // ============================================================================
    // PARALLEL DATABASE QUERIES (Following your Promise.all pattern)
    // ============================================================================

    const [
      // Contact Messages Statistics
      contactStats,
      contactByCategory,
      contactByPriority,
      pendingContacts,
      
      // Feedback Statistics  
      feedbackStats,
      feedbackByType,
      feedbackByRating,
      averageRating,
      
      // Issue Report Statistics
      reportStats,
      reportByType,
      reportBySeverity,
      criticalReports,
      
      // Recent Items for Dashboard
      recentContacts,
      recentFeedback,
      recentReports,
      
      // Time-based Analytics
      contactsToday,
      feedbackToday,
      reportsToday,
      
      // Response Time Analytics
      avgResponseTime
      
    ] = await Promise.all([
      // ========================================================================
      // CONTACT MESSAGES QUERIES
      // ========================================================================
      
      // Contact status breakdown
      prisma.contactMessage.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // Contact by category
      prisma.contactMessage.groupBy({
        by: ['category'],
        _count: { id: true }
      }),
      
      // Contact by priority
      prisma.contactMessage.groupBy({
        by: ['priority'],
        _count: { id: true }
      }),
      
      // Pending contacts (NEW + IN_PROGRESS)
      prisma.contactMessage.count({
        where: {
          status: {
            in: ['NEW', 'IN_PROGRESS']
          }
        }
      }),
      
      // ========================================================================
      // FEEDBACK QUERIES
      // ========================================================================
      
      // Feedback status breakdown
      prisma.feedback.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // Feedback by type
      prisma.feedback.groupBy({
        by: ['type'],
        _count: { id: true }
      }),
      
      // Feedback by rating
      prisma.feedback.groupBy({
        by: ['rating'],
        _count: { id: true },
        where: {
          rating: { not: null }
        }
      }),
      
      // Average rating calculation
      prisma.feedback.aggregate({
        _avg: { rating: true },
        where: {
          rating: { not: null }
        }
      }),
      
      // ========================================================================
      // ISSUE REPORTS QUERIES
      // ========================================================================
      
      // Report status breakdown
      prisma.issueReport.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // Report by type
      prisma.issueReport.groupBy({
        by: ['type'],
        _count: { id: true }
      }),
      
      // Report by severity
      prisma.issueReport.groupBy({
        by: ['severity'],
        _count: { id: true }
      }),
      
      // Critical unresolved reports
      prisma.issueReport.count({
        where: {
          severity: 'CRITICAL',
          resolved: false
        }
      }),
      
      // ========================================================================
      // RECENT ITEMS FOR DASHBOARD
      // ========================================================================
      
      // Recent contact messages (last 10)
      prisma.contactMessage.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          subject: true,
          category: true,
          priority: true,
          status: true,
          createdAt: true
        }
      }),
      
      // Recent feedback (last 10)
      prisma.feedback.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          type: true,
          rating: true,
          subject: true,
          priority: true,
          status: true,
          createdAt: true
        }
      }),
      
      // Recent reports (last 10)
      prisma.issueReport.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
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
      }),
      
      // ========================================================================
      // TODAY'S ACTIVITY
      // ========================================================================
      
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
      // RESPONSE TIME ANALYTICS
      // ========================================================================
      
      // Average response time for resolved contacts (mock for now)
      Promise.resolve({ _avg: { responseTime: 4.2 } }) // Hours - can calculate from real data later
    ]);

    // ============================================================================
    // DATA PROCESSING & CALCULATIONS
    // ============================================================================

    // Calculate total counts
    const totalContacts = contactStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const totalFeedback = feedbackStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const totalReports = reportStats.reduce((sum, stat) => sum + stat._count.id, 0);

    // Calculate pending counts
    const pendingFeedback = feedbackStats
      .filter(stat => ['NEW', 'REVIEWED'].includes(stat.status))
      .reduce((sum, stat) => sum + stat._count.id, 0);
      
    const pendingReports = reportStats
      .filter(stat => ['NEW', 'INVESTIGATING'].includes(stat.status))
      .reduce((sum, stat) => sum + stat._count.id, 0);

    // Calculate high priority items
    const highPriorityContacts = contactByPriority
      .filter(stat => ['HIGH', 'URGENT'].includes(stat.priority))
      .reduce((sum, stat) => sum + stat._count.id, 0);

    // Calculate rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
      const found = feedbackByRating.find(r => r.rating === rating);
      return {
        rating,
        count: found ? found._count.id : 0
      };
    });

    // ============================================================================
    // RESPONSE DATA STRUCTURE
    // ============================================================================

    const supportStats = {
      // Summary Statistics
      summary: {
        totalContacts,
        totalFeedback,
        totalReports,
        pendingContacts,
        pendingFeedback,
        pendingReports,
        criticalReports,
        averageRating: Number(averageRating._avg.rating?.toFixed(1)) || 0,
        avgResponseTime: avgResponseTime._avg.responseTime || 0
      },

      // Today's Activity
      today: {
        contacts: contactsToday,
        feedback: feedbackToday,
        reports: reportsToday,
        total: contactsToday + feedbackToday + reportsToday
      },

      // Contact Message Analytics
      contacts: {
        total: totalContacts,
        pending: pendingContacts,
        highPriority: highPriorityContacts,
        byStatus: contactStats,
        byCategory: contactByCategory,
        byPriority: contactByPriority,
        recent: recentContacts
      },

      // Feedback Analytics
      feedback: {
        total: totalFeedback,
        pending: pendingFeedback,
        averageRating: Number(averageRating._avg.rating?.toFixed(1)) || 0,
        byStatus: feedbackStats,
        byType: feedbackByType,
        ratingDistribution,
        recent: recentFeedback
      },

      // Issue Report Analytics
      reports: {
        total: totalReports,
        pending: pendingReports,
        critical: criticalReports,
        byStatus: reportStats,
        byType: reportByType,
        bySeverity: reportBySeverity,
        recent: recentReports
      },

      // Performance Metrics
      performance: {
        avgResponseTimeHours: avgResponseTime._avg.responseTime || 0,
        responseRate: totalContacts > 0 ? Math.round((totalContacts - pendingContacts) / totalContacts * 100) : 0,
        satisfactionScore: averageRating._avg.rating ? Math.round(averageRating._avg.rating * 20) : 0 // Convert 5-star to 100-point scale
      },

      // Urgent Actions Required
      urgentActions: [
        ...(criticalReports > 0 ? [{
          type: 'critical_reports',
          count: criticalReports,
          message: `${criticalReports} critical issue report${criticalReports > 1 ? 's' : ''} need immediate attention`,
          priority: 'CRITICAL',
          url: '/admin/support?tab=reports&filter=critical'
        }] : []),
        
        ...(highPriorityContacts > 0 ? [{
          type: 'high_priority_contacts',
          count: highPriorityContacts,
          message: `${highPriorityContacts} high-priority contact${highPriorityContacts > 1 ? 's' : ''} awaiting response`,
          priority: 'HIGH',
          url: '/admin/support?tab=contacts&filter=high-priority'
        }] : []),
        
        ...(pendingContacts > 10 ? [{
          type: 'contact_backlog',
          count: pendingContacts,
          message: `Contact message backlog: ${pendingContacts} pending responses`,
          priority: 'MEDIUM',
          url: '/admin/support?tab=contacts&filter=pending'
        }] : [])
      ]
    };

    console.log('✅ Support statistics successfully compiled:', {
      totalContacts,
      totalFeedback,
      totalReports,
      pendingContacts,
      criticalReports,
      averageRating: supportStats.summary.averageRating
    });

    return NextResponse.json({
      success: true,
      data: supportStats
    });

  } catch (error: any) {
    console.error('❌ Support stats API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to load support statistics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}