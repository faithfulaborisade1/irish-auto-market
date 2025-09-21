// src/app/robots.ts
import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://irishautomarket.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/profile/',
          '/messages/',
          '/_next/',
          '/my-ads',
          '/saved-cars',
          '/place-ad',
          '/edit/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/profile/',
          '/messages/',
          '/my-ads',
          '/saved-cars',
          '/place-ad',
          '/edit/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/profile/',
          '/messages/',
          '/my-ads',
          '/saved-cars',
          '/place-ad',
          '/edit/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}