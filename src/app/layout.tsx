// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import ReactQueryProvider from '@/components/providers/ReactQueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Irish Auto Market - Ireland\'s Premier Car Marketplace',
    template: '%s | Irish Auto Market'
  },
  description: 'Find your perfect car from Ireland\'s most trusted dealers and private sellers. Browse thousands of quality used cars with verified listings.',
  keywords: [
    'cars for sale Ireland',
    'used cars Ireland',
    'car dealers Ireland',
    'Irish cars',
    'automobile marketplace',
    'buy cars online',
    'sell cars Ireland'
  ],
  authors: [{ name: 'Irish Auto Market Team' }],
  creator: 'Irish Auto Market',
  publisher: 'Irish Auto Market',
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: process.env.APP_URL || 'http://localhost:3000',
    siteName: 'Irish Auto Market',
    title: 'Irish Auto Market - Ireland\'s Premier Car Marketplace',
    description: 'Find your perfect car from Ireland\'s most trusted dealers and private sellers.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Irish Auto Market - Find Your Perfect Car'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Irish Auto Market - Ireland\'s Premier Car Marketplace',
    description: 'Find your perfect car from Ireland\'s most trusted dealers and private sellers.',
    images: ['/og-image.jpg'],
    creator: '@irishautomarket'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#169B62" />
        <meta name="msapplication-TileColor" content="#169B62" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.className
      )}>
        {/* 🚀 REACT QUERY PROVIDER WRAPPER */}
        <ReactQueryProvider>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
          </div>
        </ReactQueryProvider>
      </body>
    </html>
  )
}