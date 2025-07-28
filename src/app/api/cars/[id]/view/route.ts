import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Increment the view count
    await prisma.car.update({
      where: { id: params.id },
      data: {
        viewsCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}