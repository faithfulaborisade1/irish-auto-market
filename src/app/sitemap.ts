// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/database'

// Base URL - replace with your actual domain
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://irishautomarket.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Static pages with their priorities and change frequencies
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/cars`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/find-dealer`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/place-ad`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/register`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
    ]

    // Get all active cars for dynamic car pages
    const cars = await prisma.car.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const carPages: MetadataRoute.Sitemap = cars.map((car) => ({
      url: `${baseUrl}/cars/${car.id}`,
      lastModified: car.updatedAt || car.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Get all active dealers
    const dealers = await prisma.user.findMany({
      where: {
        role: 'DEALER',
        status: 'ACTIVE'
      },
      include: {
        dealerProfile: {
          select: {
            updatedAt: true,
            createdAt: true,
          }
        }
      }
    })

    const dealerPages: MetadataRoute.Sitemap = dealers.map((dealer) => ({
      url: `${baseUrl}/dealers/${dealer.id}`,
      lastModified: dealer.dealerProfile?.updatedAt || dealer.updatedAt || dealer.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Get unique counties for location pages
    const counties = await prisma.car.findMany({
      where: {
        status: 'ACTIVE',
        location: {
          not: null
        }
      },
      select: {
        location: true,
        updatedAt: true,
      }
    })

    // Extract unique county names and create location pages
    const uniqueCounties = new Set<string>()
    counties.forEach((car) => {
      const location = car.location as any
      if (location?.county && typeof location.county === 'string') {
        uniqueCounties.add(location.county.toLowerCase().replace(/\s+/g, '-'))
      }
    })

    const locationPages: MetadataRoute.Sitemap = Array.from(uniqueCounties).map((county) => ({
      url: `${baseUrl}/location/${county}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }))

    // Combine all pages
    const allPages = [
      ...staticPages,
      ...carPages,
      ...dealerPages,
      ...locationPages,
    ]

    console.log(`Generated sitemap with ${allPages.length} URLs:`)
    console.log(`- Static pages: ${staticPages.length}`)
    console.log(`- Car pages: ${carPages.length}`)
    console.log(`- Dealer pages: ${dealerPages.length}`)
    console.log(`- Location pages: ${locationPages.length}`)

    return allPages

  } catch (error) {
    console.error('Error generating sitemap:', error)

    // Return minimal sitemap if database fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/cars`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/find-dealer`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ]
  }
}