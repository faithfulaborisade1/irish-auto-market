// File: src/app/api/cars/count/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Count active cars (based on your schema structure)
    const count = await prisma.car.count({
      where: {
        // Only count cars that should be visible to users
        // Adjust these filters based on your business logic:
        // approved: true,        // If you have approval system
        // status: 'ACTIVE',      // If you have status field
        // deletedAt: null,       // If you use soft delete
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