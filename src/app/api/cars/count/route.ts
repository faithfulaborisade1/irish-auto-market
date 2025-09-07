// File: src/app/api/cars/count/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Count active cars (matching the main cars API filter)
    const count = await prisma.car.count({
      where: {
        status: 'ACTIVE',
      }
    })

    return NextResponse.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('Error fetching car count:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch car count' },
      { status: 500 }
    )
  }
}