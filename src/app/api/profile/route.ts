// src/app/api/profile/route.ts - SCHEMA-CORRECT VERSION
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Fetch user with all relations using your exact schema
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        dealerProfile: true,
        _count: {
          select: {
            cars: true,
            favorites: true,
            inquiries: true, // This is CarInquiry[] relation
            carLikes: true,
            buyerConversations: true,
            sellerConversations: true,
            sentMessages: true,
            notifications: true,
            savedSearches: true
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

    // Calculate additional stats
    const totalConversations = user._count.buyerConversations + user._count.sellerConversations;
    
    // Get received inquiries count (inquiries about user's cars)
    const receivedInquiries = await prisma.carInquiry.count({
      where: {
        car: {
          userId: decoded.userId
        }
      }
    });

    // Remove sensitive data and reshape for frontend
    const { password, ...safeUser } = user;
    const userWithStats = {
      ...safeUser,
      _count: {
        cars: user._count.cars,
        favorites: user._count.favorites,
        sentInquiries: user._count.inquiries, // Inquiries user sent
        receivedInquiries, // Inquiries user received about their cars
        sentMessages: user._count.sentMessages,
        receivedMessages: totalConversations, // Approximate
        carLikes: user._count.carLikes,
        conversations: totalConversations,
        notifications: user._count.notifications,
        savedSearches: user._count.savedSearches
      }
    };

    return NextResponse.json({
      success: true,
      user: userWithStats
    });

  } catch (error) {
    console.error('Profile API error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Parse request body
    const body = await request.json();
    const { firstName, lastName, phone, location, preferences, dealerProfile } = body;

    // Validate input
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Update user profile using exact schema field names
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        location: location || null,
        preferences: preferences || null,
        updatedAt: new Date()
      },
      include: {
        dealerProfile: true,
        _count: {
          select: {
            cars: true,
            favorites: true,
            inquiries: true,
            carLikes: true,
            buyerConversations: true,
            sellerConversations: true,
            sentMessages: true
          }
        }
      }
    });

    // Update dealer profile if provided and user is a dealer
    if (dealerProfile && updatedUser.role === 'DEALER') {
      try {
        if (updatedUser.dealerProfile) {
          // Update existing dealer profile
          await prisma.dealerProfile.update({
            where: { userId: decoded.userId },
            data: {
              businessName: dealerProfile.businessName?.trim(),
              description: dealerProfile.description?.trim() || null,
              website: dealerProfile.website?.trim() || null,
              businessHours: dealerProfile.businessHours || null,
              specialties: dealerProfile.specialties || null,
              updatedAt: new Date()
            }
          });
        } else {
          // Create new dealer profile
          await prisma.dealerProfile.create({
            data: {
              userId: decoded.userId,
              businessName: dealerProfile.businessName?.trim(),
              description: dealerProfile.description?.trim() || null,
              website: dealerProfile.website?.trim() || null,
              businessHours: dealerProfile.businessHours || null,
              specialties: dealerProfile.specialties || null
            }
          });
        }
      } catch (error) {
        console.error('Error updating dealer profile:', error);
        // Continue even if dealer profile update fails
      }
    }

    // Get final user data with updated dealer profile
    const finalUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        dealerProfile: true,
        _count: {
          select: {
            cars: true,
            favorites: true,
            inquiries: true,
            carLikes: true,
            buyerConversations: true,
            sellerConversations: true,
            sentMessages: true
          }
        }
      }
    });

    if (!finalUser) {
      return NextResponse.json(
        { error: 'User not found after update' },
        { status: 404 }
      );
    }

    // Calculate stats
    const receivedInquiries = await prisma.carInquiry.count({
      where: {
        car: {
          userId: decoded.userId
        }
      }
    });

    const totalConversations = finalUser._count.buyerConversations + finalUser._count.sellerConversations;

    // Remove sensitive data
    const { password, ...safeUser } = finalUser;
    const userWithStats = {
      ...safeUser,
      _count: {
        cars: finalUser._count.cars,
        favorites: finalUser._count.favorites,
        sentInquiries: finalUser._count.inquiries,
        receivedInquiries,
        sentMessages: finalUser._count.sentMessages,
        receivedMessages: totalConversations,
        carLikes: finalUser._count.carLikes,
        conversations: totalConversations
      }
    };

    return NextResponse.json({
      success: true,
      user: userWithStats,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}