// components/CarCard.tsx - Updated with centralized types
'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Heart, Calendar, Gauge, Fuel, Settings, MapPin, Eye, MessageCircle, Star, Shield, User, CheckCircle } from 'lucide-react'
import type { Car } from '@/types/car'

// 🔥 YOUR ENHANCED LIKEBUTTON - EXACT API INTEGRATION
const LikeButton = ({ carId }: { carId: string }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Get initial like status when component mounts
  React.useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(`/api/cars/${carId}/like`)
        const data = await response.json()
        if (data.success) {
          setIsLiked(data.liked)
          setLikesCount(data.likesCount)
        }
      } catch (error) {
        console.error('Error fetching like status:', error)
      } finally {
        setInitialized(true)
      }
    }

    fetchLikeStatus()
  }, [carId])

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading || !initialized) return
    
    try {
      setLoading(true)
      
      // ✅ FIXED: Use POST for liking, DELETE for unliking (matches your API exactly)
      const method = isLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/cars/${carId}/like`, {
        method: method,
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsLiked(data.liked)
        setLikesCount(data.likesCount)
      } else {
        // Handle specific errors from your API
        if (response.status === 401) {
          alert('Please log in to like cars')
        } else if (response.status === 400) {
          alert(data.error) // "Cannot like your own car" etc.
        }
      }
    } catch (error) {
      console.error('Like error:', error)
      alert('Failed to update like. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!initialized) {
    return (
      <div className="p-1.5 sm:p-2 rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`relative p-1.5 sm:p-2 rounded-full transition-all duration-200 touch-manipulation ${
        isLiked 
          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
          : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-600'
      } shadow-lg backdrop-blur-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isLiked ? 'Unlike this car' : 'Like this car'}
    >
      <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isLiked ? 'fill-current' : ''} ${loading ? 'animate-pulse' : ''}`} />
      {likesCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
          {likesCount > 99 ? '99+' : likesCount}
        </span>
      )}
    </button>
  )
}

// ✅ FIXED: Updated interface to use centralized Car type
interface CarCardProps {
  car: Car  // Now uses the centralized type from types/car.ts
  variant?: 'grid' | 'list'
  showPerformance?: boolean
  showSavedDate?: boolean
  className?: string
}

// ✅ YOUR ENHANCED CarImageCarousel - WITH MOBILE OPTIMIZATIONS
const CarImageCarousel = React.memo(({ images, title, featured, price, carId }: {
  images?: Array<{ id: string; url: string; alt: string }>
  title: string
  featured?: boolean
  price: number
  carId: string
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const hasMultipleImages = images && images.length > 1
  const currentImage = images?.[currentImageIndex]

  // ✅ YOUR PROFESSIONAL getOptimizedImageUrl - PRESERVED
  const getOptimizedImageUrl = (url?: string) => {
    if (!url) return '/placeholder-car.jpg'
    return url
      .replace(/\/c_fill,w_\d+,h_\d+,g_auto\//, '/')
      .replace(/\/c_thumb,w_\d+,h_\d+,g_auto\//, '/')
      + '?w=600&h=400&fit=cover&auto=format,compress&q=85'
  }

  const nextImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  return (
    <div className="relative aspect-[4/3] bg-gray-100 rounded-t-xl overflow-hidden group">
      <img
        src={getOptimizedImageUrl(currentImage?.url)}
        alt={currentImage?.alt || title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = '/placeholder-car.jpg'
        }}
      />
      
      {/* Image overlay badges - MOBILE OPTIMIZED */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Featured badge */}
        {featured && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium flex items-center shadow-lg">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 fill-current" />
              Featured
            </div>
          </div>
        )}

        {/* Image counter - MOBILE RESPONSIVE */}
        {hasMultipleImages && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        )}

        {/* Price overlay - MOBILE RESPONSIVE */}
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
          <div className="bg-black/80 backdrop-blur-sm text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg">
            <div className="text-base sm:text-lg font-bold">€{price.toLocaleString()}</div>
          </div>
        </div>

        {/* Like button - MOBILE OPTIMIZED */}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 pointer-events-auto">
          <LikeButton carId={carId} />
        </div>
      </div>

      {/* Navigation arrows - MOBILE FRIENDLY */}
      {hasMultipleImages && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevImage(); }}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 touch-manipulation"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextImage(); }}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 touch-manipulation"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
})

CarImageCarousel.displayName = 'CarImageCarousel'

// ✅ ENHANCED CarContent - WITH IMPROVED LOCATION DISPLAY
const CarContent = React.memo(({ car, variant, showPerformance, showSavedDate }: {
  car: Car  // ✅ FIXED: Use centralized Car type
  variant?: 'grid' | 'list'
  showPerformance?: boolean
  showSavedDate?: boolean
}) => {
  // ✅ YOUR PROFESSIONAL date formatting - PRESERVED
  const formattedDate = useMemo(() => {
    if (!showSavedDate || !car.savedAt) return undefined
    try {
      const date = new Date(car.savedAt)
      return date.toLocaleDateString('en-IE', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return undefined
    }
  }, [showSavedDate, car.savedAt])

  // 🚀 ENHANCED getLocationDisplay - BETTER LOGIC FOR IRISH AREAS
  const getLocationDisplay = (location: any) => {
    if (!location) return 'Ireland'
    
    // Handle simple string (already formatted)
    if (typeof location === 'string') {
      return location
    }
    
    if (typeof location === 'object') {
      // Check for pre-formatted display location
      if (location.display_location) {
        return location.display_location
      }
      
      // Extract area and county information
      const area = location.area || location.city || location.town
      let county = location.county || location.region
      
      // Clean up county name (remove "Co. " prefix if present)
      if (county && county.startsWith('Co. ')) {
        county = county.substring(4)
      }
      
      // 🎯 ENHANCED: Return "Area, County" format when both available
      if (area && county) {
        return `${area}, ${county}`
      } else if (county) {
        return county
      } else if (area) {
        return area
      }
      
      // 🚀 NEW: Try to extract from address field if available
      if (location.address && typeof location.address === 'string') {
        // Parse address like "Tullamore, Co. Offaly" or "Athlone, Westmeath"
        const parts = location.address.split(',').map((part: string) => part.trim())
        if (parts.length >= 2) {
          const lastPart = parts[parts.length - 1].replace(/^Co\.\s*/, '')
          const secondLastPart = parts[parts.length - 2]
          return `${secondLastPart}, ${lastPart}`
        }
        return location.address
      }
    }
    
    return 'Ireland'
  }

  // ✅ YOUR PROFESSIONAL SellerStatus component - PRESERVED
  const SellerStatus = () => {
    if (!car.seller) return null

    const isDealer = car.seller.type === 'dealer' || car.seller.type === 'DEALER'
    const isVerified = car.seller.verified

    if (isDealer) {
      return (
        <div className="flex items-center space-x-1">
          <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
          <span className="text-xs font-medium text-blue-600">
            {isVerified ? 'Verified Dealer' : 'Dealer'}
          </span>
          {isVerified && <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />}
        </div>
      )
    } else {
      return (
        <div className="flex items-center space-x-1">
          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
          <span className="text-xs text-gray-600">Private Seller</span>
        </div>
      )
    }
  }

  return (
    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
      {/* Header: Title + Seller Status - MOBILE OPTIMIZED */}
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight flex-1 mr-2">
            {car.title}
          </h3>
          <SellerStatus />
        </div>
        
        <div className="flex items-center text-xs sm:text-sm text-gray-600">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{getLocationDisplay(car.location)}</span>
          {showSavedDate && formattedDate && (
            <>
              <span className="mx-2">•</span>
              <span>Saved {formattedDate}</span>
            </>
          )}
        </div>
      </div>

      {/* Key specs - MOBILE RESPONSIVE GRID */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
        <div className="flex items-center text-gray-600">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400" />
          <span>{car.year}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Gauge className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400" />
          <span>{car.mileage?.toLocaleString() || 'N/A'} km</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Fuel className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400" />
          <span className="capitalize">{car.fuelType?.toLowerCase() || 'N/A'}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400" />
          <span className="capitalize">{car.transmission?.toLowerCase() || 'N/A'}</span>
        </div>
      </div>

      {/* ✅ YOUR PROFESSIONAL Performance stats - PRESERVED WITH MOBILE */}
      {showPerformance && (
        <div className="flex items-center justify-between text-xs text-gray-500 py-2 border-t border-gray-100">
          <div className="flex items-center">
            <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
            <span>{car.views || 0} views</span>
          </div>
          <div className="flex items-center">
            <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
            <span>{car.inquiries || 0} inquiries</span>
          </div>
          <div className="flex items-center">
            <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
            <span>{car.likesCount || 0} likes</span>
          </div>
        </div>
      )}

      {/* View Details Button - MOBILE RESPONSIVE */}
      <div className="pt-1 sm:pt-2">
        <Link
          href={`/cars/${car.id}`}
          className="block w-full bg-green-600 text-white text-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
        >
          View Details
        </Link>
      </div>
    </div>
  )
})

CarContent.displayName = 'CarContent'

export default function CarCard({ 
  car, 
  variant = 'grid', 
  showPerformance = false, 
  showSavedDate = false,
  className = '' 
}: CarCardProps) {
  // ✅ YOUR PROFESSIONAL memoized container classes - ENHANCED WITH MOBILE
  const containerClasses = useMemo(() => {
    const baseClasses = 'bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group border border-gray-200'
    
    if (variant === 'list') {
      return `${baseClasses} flex flex-col sm:flex-row ${className}`
    } else {
      return `${baseClasses} flex flex-col ${className}`
    }
  }, [variant, className])

  if (variant === 'list') {
    return (
      <div className={containerClasses}>
        <div className="w-full sm:w-80 flex-shrink-0">
          <CarImageCarousel
            images={car.images}
            title={car.title}
            featured={car.featured}
            price={car.price}
            carId={car.id}
          />
        </div>
        <div className="flex-1 min-w-0">
          <CarContent 
            car={car}
            variant={variant}
            showPerformance={showPerformance}
            showSavedDate={showSavedDate}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <CarImageCarousel
        images={car.images}
        title={car.title}
        featured={car.featured}
        price={car.price}
        carId={car.id}
      />
      <CarContent 
        car={car}
        variant={variant}
        showPerformance={showPerformance}
        showSavedDate={showSavedDate}
      />
    </div>
  )
}