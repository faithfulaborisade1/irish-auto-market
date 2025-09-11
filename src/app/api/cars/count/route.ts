// File: src/app/api/cars/count/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Count active cars (matching the main cars API filter)
    const count = await prisma.car.count({
      where: {
        status: 'ACTIVE',
      }
    })

    const response = NextResponse.json({
      success: true,
      count
    })
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching car count:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch car count' },
      { status: 500 }
    )
  }
}