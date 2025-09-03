import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { testEmailService, getEmailConfig } from '@/lib/email'
import { prisma } from '@/lib/database'

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin-token')?.value || 
                      request.cookies.get('auth-token')?.value;

    if (!adminToken) {
      return null
    }

    let decoded: any;
    try {
      decoded = jwt.verify(adminToken, process.env.JWT_SECRET!);
    } catch (jwtError: any) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        adminProfile: true 
      }
    });

    if (!user || !user.adminProfile || !user.adminProfile.isActive) {
      return null
    }

    if (user.status !== 'ACTIVE') {
      return null
    }

    return {
      id: user.adminProfile.id, // AdminProfile.id for consistency
      userId: user.id, // User.id for other purposes
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.adminProfile.adminRole
    }
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminAuth(request)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    console.log('🧪 Testing email service...')

    // Get email configuration
    const emailConfig = getEmailConfig()
    console.log('📧 Email config:', emailConfig)

    // Test the email service
    const testResult = await testEmailService()
    console.log('🧪 Email test result:', testResult)

    return NextResponse.json({
      success: true,
      config: emailConfig,
      testResult: testResult
    })

  } catch (error: any) {
    console.error('❌ Email test error:', error)
    return NextResponse.json(
      { error: 'Email test failed', details: error.message },
      { status: 500 }
    )
  }
}