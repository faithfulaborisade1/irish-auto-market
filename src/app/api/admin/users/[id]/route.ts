// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const UpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().optional()
});

const UpdateUserDataSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['USER', 'DEALER']).optional() // Only allow changing to these roles
});

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin-token')?.value || 
                      request.cookies.get('auth-token')?.value;

    if (!adminToken) {
      return { error: 'No admin token provided', status: 401 };
    }

    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET!) as any;
    
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { adminProfile: true }
    });

    if (!adminUser || !adminUser.adminProfile) {
      return { error: 'Admin user not found', status: 401 };
    }

    if (adminUser.status !== 'ACTIVE') {
      return { error: 'Admin account is disabled', status: 403 };
    }

    // Only SUPER_ADMIN can manage users
    if (adminUser.adminProfile.adminRole !== 'SUPER_ADMIN') {
      return { error: 'Only Super Admins can manage users', status: 403 };
    }

    return { user: adminUser, adminProfile: adminUser.adminProfile };

  } catch (error: any) {
    console.error('Admin auth verification error:', error);
    return { error: 'Token verification failed', status: 401 };
  }
}

// Helper function to log admin actions (with error handling)
async function logAdminAction(adminId: string, action: string, details: any, ip?: string) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: action as any,
        resourceType: 'USER' as any,
        resourceId: details.targetUserId || null,
        ipAddress: ip || 'unknown',
        severity: details.reason === 'Server error' ? 'ERROR' : 'INFO',
        description: `${action}: ${details.reason || 'User management action'}`,
        oldValues: details.oldValues ? details.oldValues : undefined,
        newValues: details,
        userAgent: undefined,
        endpoint: '/api/admin/users/[id]',
        tags: undefined
      }
    });
  } catch (error: any) {
    console.log('📝 Audit logging failed (non-critical):', error.message);
  }
}

// GET /api/admin/users/[id] - Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`👤 GET /api/admin/users/${params.id} - Fetching user details`);

    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const currentAdmin = authResult.user;
    const userId = params.id;

    // Get user with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dealerProfile: true,
        adminProfile: true,
        cars: {
          select: {
            id: true,
            title: true,
            make: true,
            model: true,
            year: true,
            price: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 cars
        },
        sentMessages: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            conversation: {
              select: {
                car: {
                  select: {
                    title: true,
                    make: true,
                    model: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 messages
        },
        revenueRecords: {
          select: {
            amount: true,
            source: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate user statistics
    const activeCarsCount = user.cars.filter(car => car.status === 'ACTIVE').length;
    const totalRevenue = user.revenueRecords.reduce((sum, record) => sum + Number(record.amount), 0);

    // Transform user data
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: !!user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      preferences: user.preferences,
      
      // Statistics
      totalCars: user.cars.length,
      activeCars: activeCarsCount,
      totalMessages: user.sentMessages.length,
      totalRevenue: totalRevenue,
      
      // Related data
      dealerProfile: user.dealerProfile,
      adminProfile: user.adminProfile ? {
        ...user.adminProfile,
        lastLoginAt: user.adminProfile.lastLoginAt?.toISOString() || null,
        createdAt: user.adminProfile.createdAt.toISOString(),
        updatedAt: user.adminProfile.updatedAt.toISOString()
      } : null,
      
      // Recent activity
      recentCars: user.cars.map(car => ({
        ...car,
        price: Number(car.price),
        createdAt: car.createdAt.toISOString()
      })),
      recentMessages: user.sentMessages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
        carTitle: msg.conversation?.car?.title || 'Unknown Car'
      })),
      revenueHistory: user.revenueRecords.map(record => ({
        ...record,
        amount: Number(record.amount),
        createdAt: record.createdAt.toISOString()
      }))
    };

    // Log access (with fixed admin ID and null check)
    if (currentAdmin.adminProfile) {
      await logAdminAction(
        currentAdmin.adminProfile.id, // 🔧 FIXED: Use adminProfile.id
        'USER_VIEWED',
        {
          targetUserId: userId,
          targetEmail: user.email,
          targetRole: user.role,
          viewedBy: currentAdmin.email
        },
        request.headers.get('x-forwarded-for') || 'unknown'
      );
    }

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error: any) {
    console.error('❌ Error fetching user details:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user details',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/admin/users/[id] - Update user details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`✏️ PUT /api/admin/users/${params.id} - Updating user`);

    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const currentAdmin = authResult.user;
    const userId = params.id;

    // Parse request body
    const body = await request.json();
    
    // Check if this is a status update or data update
    if ('isActive' in body) {
      // Handle status update
      const validationResult = UpdateUserStatusSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid status update data', details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const { isActive, reason } = validationResult.data;
      
      // Get current user to check role and status
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { adminProfile: true }
      });

      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Prevent disabling admin accounts through this endpoint
      if (currentUser.adminProfile && !isActive) {
        return NextResponse.json(
          { error: 'Use admin-specific endpoints to manage admin accounts' },
          { status: 400 }
        );
      }

      const newStatus = isActive ? 'ACTIVE' : 'SUSPENDED';
      const oldStatus = currentUser.status;

      // Update user status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: newStatus,
          updatedAt: new Date()
        }
      });

      // Log status change (with fixed admin ID and null check)
      if (currentAdmin.adminProfile) {
        await logAdminAction(
          currentAdmin.adminProfile.id, // 🔧 FIXED: Use adminProfile.id
          isActive ? 'USER_VERIFIED' : 'USER_SUSPENDED',
          {
            targetUserId: userId,
            targetEmail: currentUser.email,
            targetRole: currentUser.role,
            oldStatus,
            newStatus,
            reason: reason || 'No reason provided',
            updatedBy: currentAdmin.email,
            oldValues: { status: oldStatus },
            newValues: { status: newStatus, reason }
          },
          request.headers.get('x-forwarded-for') || 'unknown'
        );
      }

      return NextResponse.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          status: updatedUser.status,
          updatedAt: updatedUser.updatedAt
        }
      });

    } else {
      // Handle data update
      const validationResult = UpdateUserDataSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid user data', details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const updateData = validationResult.data;

      // Get current user data for audit log
      const currentUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      // Log update (with fixed admin ID and null check)
      if (currentAdmin.adminProfile) {
        await logAdminAction(
          currentAdmin.adminProfile.id, // 🔧 FIXED: Use adminProfile.id
          'USER_CREATED', // Using closest existing enum value
          {
            targetUserId: userId,
            targetEmail: currentUser.email,
            updatedBy: currentAdmin.email,
            oldValues: {
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              phone: currentUser.phone,
              role: currentUser.role
            },
            newValues: updateData
          },
          request.headers.get('x-forwarded-for') || 'unknown'
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          role: updatedUser.role,
          updatedAt: updatedUser.updatedAt
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Error updating user:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/admin/users/[id] - HARD DELETE user (permanently removes all data)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🗑️ DELETE /api/admin/users/${params.id} - HARD DELETING user (permanent)`);

    // Check for hard delete confirmation in query params
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.status || 401 }
      );
    }

    const currentAdmin = authResult.user;
    const userId = params.id;

    // Get user with ALL related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminProfile: true,
        dealerProfile: true,
        cars: {
          include: {
            images: true,
            conversations: {
              include: {
                messages: true
              }
            },
            likes: true
          }
        },
        sentMessages: {
          include: {
            conversation: true
          }
        },
        buyerConversations: {
          include: {
            messages: true
          }
        },
        sellerConversations: {
          include: {
            messages: true
          }
        },
        carLikes: true,
        notifications: true,
        revenueRecords: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deletion of admin accounts
    if (user.adminProfile) {
      return NextResponse.json(
        { error: 'Cannot delete admin accounts through this endpoint' },
        { status: 400 }
      );
    }

    // If not hard delete, do soft delete (suspend)
    if (!hardDelete) {
      const suspendedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'SUSPENDED',
          updatedAt: new Date()
        }
      });

      // Log suspension
      if (currentAdmin.adminProfile) {
        await logAdminAction(
          currentAdmin.adminProfile.id,
          'USER_SUSPENDED',
          {
            targetUserId: userId,
            targetEmail: user.email,
            targetRole: user.role,
            suspendedBy: currentAdmin.email,
            oldValues: { status: user.status },
            newValues: { status: 'SUSPENDED' }
          },
          request.headers.get('x-forwarded-for') || 'unknown'
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User suspended successfully. Use ?hard=true for permanent deletion.',
        action: 'suspended',
        user: {
          id: suspendedUser.id,
          email: suspendedUser.email,
          status: suspendedUser.status
        }
      });
    }

    // HARD DELETE - Remove ALL user data permanently
    console.log(`🚨 HARD DELETE: Permanently removing user ${user.email} and ALL associated data`);

    // Store user info for logging before deletion
    const userInfo = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      carsCount: user.cars.length,
      messagesCount: user.sentMessages.length,
      likesCount: user.carLikes.length,
      notificationsCount: user.notifications.length
    };

    // Use transaction to ensure all data is deleted atomically
    await prisma.$transaction(async (tx) => {
      // 1. Delete all car-related data
      for (const car of user.cars) {
        // Delete car likes
        await tx.carLike.deleteMany({
          where: { carId: car.id }
        });

        // Delete car images
        await tx.carImage.deleteMany({
          where: { carId: car.id }
        });

        // Delete messages in car conversations
        for (const conversation of car.conversations) {
          await tx.message.deleteMany({
            where: { conversationId: conversation.id }
          });
        }

        // Delete car conversations
        await tx.conversation.deleteMany({
          where: { carId: car.id }
        });

        // Delete car favorites
        await tx.favoriteCar.deleteMany({
          where: { carId: car.id }
        });

        // Delete the car
        await tx.car.delete({
          where: { id: car.id }
        });
      }

      // 2. Delete user's messages in other conversations
      await tx.message.deleteMany({
        where: { senderId: userId }
      });

      // 3. Delete conversations where user is involved (buyer or seller)
      const userConversations = [
        ...user.buyerConversations, 
        ...user.sellerConversations
      ];
      
      for (const conversation of userConversations) {
        // Delete all messages in this conversation
        await tx.message.deleteMany({
          where: { conversationId: conversation.id }
        });
      }
      
      // Delete the conversations themselves
      await tx.conversation.deleteMany({
        where: { 
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        }
      });

      // 4. Delete user's car likes
      await tx.carLike.deleteMany({
        where: { userId: userId }
      });

      // 5. Delete user's favorite cars
      await tx.favoriteCar.deleteMany({
        where: { userId: userId }
      });

      // 6. Delete user's notifications
      await tx.notification.deleteMany({
        where: { userId: userId }
      });

      // 7. Delete revenue records
      await tx.revenueRecord.deleteMany({
        where: { userId: userId }
      });

      // 8. Delete saved searches
      await tx.savedSearch.deleteMany({
        where: { userId: userId }
      });

      // 9. Delete contact messages
      await tx.contactMessage.deleteMany({
        where: { userId: userId }
      });

      // 10. Delete feedback
      await tx.feedback.deleteMany({
        where: { userId: userId }
      });

      // 11. Delete issue reports (both created and dealer reports)
      await tx.issueReport.deleteMany({
        where: { 
          OR: [
            { userId: userId },
            { dealerId: userId }
          ]
        }
      });

      // 12. Delete page views (web analytics)
      await tx.pageView.deleteMany({
        where: { userId: userId }
      });

      // 13. Delete accounts (OAuth accounts)
      await tx.account.deleteMany({
        where: { userId: userId }
      });

      // 14. Delete sessions
      await tx.session.deleteMany({
        where: { userId: userId }
      });

      // 15. Delete dealer invitation if exists
      await tx.dealerInvitation.deleteMany({
        where: { userId: userId }
      });

      // 16. Delete dealer profile if exists
      if (user.dealerProfile) {
        await tx.dealerProfile.delete({
          where: { userId: userId }
        });
      }

      // 17. Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    // Log HARD deletion
    if (currentAdmin.adminProfile) {
      await logAdminAction(
        currentAdmin.adminProfile.id,
        'USER_DELETED',
        {
          targetUserId: userId,
          targetEmail: userInfo.email,
          targetRole: userInfo.role,
          deletedBy: currentAdmin.email,
          deletionType: 'HARD_DELETE',
          dataRemoved: {
            carsCount: userInfo.carsCount,
            messagesCount: userInfo.messagesCount,
            likesCount: userInfo.likesCount,
            notificationsCount: userInfo.notificationsCount
          },
          oldValues: { 
            status: user.status,
            email: userInfo.email,
            existed: true 
          },
          newValues: { 
            deleted: true,
            dataRemoved: 'ALL',
            emailAvailable: true 
          }
        },
        request.headers.get('x-forwarded-for') || 'unknown'
      );
    }

    console.log(`✅ HARD DELETE completed for user ${userInfo.email}. Email is now available for reuse.`);

    return NextResponse.json({
      success: true,
      message: `User "${userInfo.email}" and all associated data permanently deleted. Email can now be reused.`,
      action: 'hard_deleted',
      dataRemoved: {
        user: userInfo.firstName + ' ' + userInfo.lastName,
        email: userInfo.email,
        cars: userInfo.carsCount,
        messages: userInfo.messagesCount,
        likes: userInfo.likesCount,
        notifications: userInfo.notificationsCount
      }
    });

  } catch (error: any) {
    console.error('❌ Error deleting user:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}