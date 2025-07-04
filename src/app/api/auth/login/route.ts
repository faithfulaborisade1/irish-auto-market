// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimiters } from '@/lib/rate-limit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Input validation schema
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Get client IP helper
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

// Enhanced input validation
function validateLoginInput(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  } else if (data.password.length < 1) {
    errors.push('Password cannot be empty');
  }
  
  return { isValid: errors.length === 0, errors };
}

// Add random delay to prevent timing attacks
function addSecurityDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 200) + 100; // 100-300ms
  return new Promise(resolve => setTimeout(resolve, delay));
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // ✅ CRITICAL: Use login rate limiter for actual login attempts
    const rateLimitResult = await rateLimiters.login.check(request);
    
    if (!rateLimitResult.success) {
      const clientIP = getClientIP(request);
      console.log(`🚨 Login rate limit exceeded for IP: ${clientIP}`);
      
      // Add security delay even for rate limited requests
      await addSecurityDelay();
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many login attempts. Please try again in 15 minutes.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Parse and validate request body
    let requestData: any;
    try {
      requestData = await request.json();
    } catch (parseError) {
      await addSecurityDelay();
      return NextResponse.json(
        { success: false, message: 'Invalid request format' },
        { status: 400 }
      );
    }

    // ✅ SECURITY: Enhanced input validation
    const validation = validateLoginInput(requestData);
    if (!validation.isValid) {
      await addSecurityDelay();
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid input',
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    const { email, password, rememberMe = false }: LoginRequest = requestData;

    // ✅ SECURITY: Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user with enhanced error handling
    let user;
    try {
      user = await db.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          password: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          dealerProfile: {
            select: {
              id: true,
              businessName: true,
              verified: true,
              subscriptionType: true,
              logo: true,
              description: true
            }
          }
        }
      });
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      await addSecurityDelay();
      return NextResponse.json(
        { success: false, message: 'Login service temporarily unavailable' },
        { status: 503 }
      );
    }

    // ✅ SECURITY: Always add delay to prevent timing attacks
    await addSecurityDelay();

    // Check if user exists and has password
    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ✅ SECURITY: Check account status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Account is not active',
          accountStatus: user.status 
        },
        { status: 403 }
      );
    }

    // ✅ SECURITY: Verify password with timing attack protection
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('Password comparison error:', bcryptError);
      return NextResponse.json(
        { success: false, message: 'Authentication service error' },
        { status: 500 }
      );
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ✅ SECURITY: Generate secure JWT token
    let token: string;
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }
      
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: Date.now().toString(), // Add session ID for potential token revocation
      };
      
      token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { 
          expiresIn: rememberMe ? '30d' : '7d',
          issuer: 'irishautomarket.ie',
          audience: 'irishautomarket-users'
        }
      );
    } catch (jwtError) {
      console.error('JWT generation error:', jwtError);
      return NextResponse.json(
        { success: false, message: 'Authentication service error' },
        { status: 500 }
      );
    }

    // ✅ SECURITY: Update last login timestamp
    try {
      await db.user.update({
        where: { id: user.id },
        data: { 
          lastLoginAt: new Date(),
          // Could add loginCount increment here
        }
      });
    } catch (updateError) {
      console.error('Failed to update last login:', updateError);
      // Don't fail the login for this, just log it
    }

    // Prepare sanitized user data (exclude sensitive fields)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      dealerProfile: user.dealerProfile
    };

    // Create secure response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userData
    });

    // ✅ SECURITY: Set secure HTTP-only cookie
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to allow navigation from external links
      path: '/',
      maxAge: cookieMaxAge
    });

    // ✅ SECURITY: Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    // ✅ SECURITY: Log successful login (without sensitive data)
    const clientIP = getClientIP(request);
    const processingTime = Date.now() - startTime;
    console.log(`✅ Successful login for user ${user.id} from IP ${clientIP} (${processingTime}ms)`);

    return response;

  } catch (error: any) {
    const clientIP = getClientIP(request);
    const processingTime = Date.now() - startTime;
    console.error(`❌ Login error from IP ${clientIP} (${processingTime}ms):`, error);
    
    // Add security delay for errors too
    await addSecurityDelay();
    
    // ✅ SECURITY: Generic error message to prevent information disclosure
    return NextResponse.json(
      { 
        success: false, 
        message: 'Login service temporarily unavailable',
        errorId: Date.now().toString()
      },
      { status: 500 }
    );
  }
}