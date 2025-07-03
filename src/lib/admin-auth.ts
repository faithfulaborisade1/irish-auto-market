// src/lib/admin-auth.ts - TYPESCRIPT ERRORS FIXED
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AdminSession {
  id: string;
  userId: string;
  adminRole: string;
  permissions: string[];
  email: string;
  name: string;
}

export class AdminAuth {
  // ✅ FIXED: Proper JWT_SECRET handling with validation
  private static get JWT_SECRET(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required but not set');
    }
    return secret;
  }

  static async login(email: string, password: string, ipAddress: string, userAgent?: string) {
    try {
      console.log('🔍 AdminAuth.login called for:', email);
      console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          adminProfile: true
        }
      });

      console.log('👤 User found:', !!user, 'Has admin profile:', !!user?.adminProfile);

      if (!user || !user.adminProfile) {
        throw new Error('Invalid credentials');
      }

      const isValid = await bcrypt.compare(password, user.password || '');
      console.log('🔑 Password valid:', isValid);
      
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Create JWT payload
      const payload = {
        userId: user.id,
        adminRole: user.adminProfile.adminRole,
        permissions: user.adminProfile.permissions,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        iat: Math.floor(Date.now() / 1000) // Current time
      };

      console.log('📦 JWT Payload:', payload);
      console.log('🔐 Using JWT_SECRET length:', this.JWT_SECRET.length);

      const sessionToken = jwt.sign(payload, this.JWT_SECRET, { 
        expiresIn: '24h',
        algorithm: 'HS256'
      });

      console.log('🎫 Token created, length:', sessionToken.length);
      console.log('🎫 Token preview:', sessionToken.substring(0, 50) + '...');

      return {
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.adminProfile.adminRole,
          permissions: user.adminProfile.permissions
        }
      };

    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      throw error;
    }
  }

  static async verifyToken(token: string): Promise<AdminSession | null> {
    try {
      console.log('🔍 Verifying token...');
      console.log('🎫 Token length:', token?.length);
      console.log('🎫 Token preview:', token?.substring(0, 50) + '...');
      console.log('🔐 Using JWT_SECRET length:', this.JWT_SECRET.length);
      
      if (!token) {
        console.log('❌ No token provided');
        return null;
      }

      // Try to decode without verification first to see what's in the token
      try {
        const decoded = jwt.decode(token);
        console.log('📦 Decoded token (no verification):', decoded);
      } catch (decodeError: any) {
        console.log('❌ Cannot decode token:', decodeError.message);
      }

      // Now try to verify - ✅ FIXED: this.JWT_SECRET is now guaranteed to be string
      const verified = jwt.verify(token, this.JWT_SECRET, { 
        algorithms: ['HS256'] 
      }) as any;
      
      console.log('✅ Token verified successfully:', {
        userId: verified.userId,
        email: verified.email,
        adminRole: verified.adminRole,
        exp: new Date(verified.exp * 1000).toISOString()
      });

      return {
        id: verified.userId,
        userId: verified.userId,
        adminRole: verified.adminRole,
        permissions: verified.permissions,
        email: verified.email,
        name: verified.name
      };

    } catch (error: any) {
      console.error('❌ Token verification failed:', error.message);
      console.error('❌ Error type:', error.name);
      
      if (error.name === 'TokenExpiredError') {
        console.log('⏰ Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        console.log('🔐 JWT signature/format error');
      } else if (error.name === 'NotBeforeError') {
        console.log('⏰ Token not active yet');
      }
      
      return null;
    }
  }

  static async logout(token: string) {
    console.log('🚪 Logout called');
  }

  static getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for') || '127.0.0.1';
  }

  // ✅ ADDED: Utility method to check if JWT_SECRET is configured
  static isConfigured(): boolean {
    return !!process.env.JWT_SECRET;
  }

  // ✅ ADDED: Method to validate environment setup
  static validateEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET environment variable is required');
    } else if (process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET should be at least 32 characters long for security');
    }

    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL environment variable is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}