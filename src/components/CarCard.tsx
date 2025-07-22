// 🚀 COMPLETE CARCARD COMPONENT - GRID FIX + LOCATION DISPLAY FIX
'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, ChevronLeft, ChevronRight, Calendar, Gauge, Fuel, Settings, User, Heart, Shield } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'

// 🚀 FIX #1: Lazy load LikeButton component
const LikeButton = dynamic(() => import('@/components/LikeButton'), {
  loading: () => <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>,
  ssr: false
})

interface Car {
  id: string
  title: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  fuelType: string
  transmission: string
  bodyType: string
  color: string
  description: string
  location: { city: string; county: string; area?: string; town?: string } // 🔥 ENHANCED: Added area and town
  featured: boolean
  views: number
  inquiries: number
  likesCount: number
  isLiked: boolean
  images: Array<{ id: string; url: string; alt: string }>
  seller: {
    name: string
    type: string
    phone: string
    verified: boolean
  }
  createdAt?: string
  savedAt?: string
}

interface CarCardProps {
  car: Car
  variant?: 'grid' | 'list' | 'compact'
  showSavedDate?: boolean
  showPerformance?: boolean
  showActions?: ('edit' | 'delete' | 'promote')[]
  onEdit?: (carId: string) => void
  onDelete?: (carId: string) => void
  onPromote?: (carId: string) => void
  className?: string
}

// 🚀 ENHANCED Image Carousel Component
const CarImageCarousel = React.memo(({ 
  images, 
  title, 
  featured, 
  price, 
  carId, 
  likesCount, 
  isLiked,
  savedDate,
  className = '',
  variant = 'grid'
}: {
  images: Array<{ id: string; url: string; alt: string }>
  title: string
  featured: boolean
  price: number
  carId: string
  likesCount: number
  isLiked: boolean
  savedDate?: string
  className?: string
  variant?: 'grid' | 'list' | 'compact'
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  
  const hasMultipleImages = images && images.length > 1
  const currentImage = images?.[currentImageIndex] || null

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }, [hasMultipleImages, images.length])

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }, [hasMultipleImages, images.length])

  const optimizedImageUrl = useMemo(() => {
    if (!currentImage?.url) return '/placeholder-car.jpg'
    
    return currentImage.url
      .replace(/\/c_fill,w_\d+,h_\d+,g_auto\//, '/')
      .replace(/\/c_thumb,w_\d+,h_\d+,g_auto\//, '/')
      + '?w=600&h=400&fit=cover&auto=format,compress&q=85'
  }, [currentImage?.url])

  return (
    <div 
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img  
        src={optimizedImageUrl}
        alt={currentImage?.alt || title}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = '/placeholder-car.jpg'
        }}
      />

      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-3 left-3">
          <div className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow-lg flex items-center">
            <Shield className="w-3 h-3 mr-1" />
            Featured
          </div>
        </div>
      )}

      {/* Saved Date Badge */}
      {savedDate && (
        <div className="absolute bottom-3 left-3">
          <span className="bg-orange-600 text-white px-2.5 py-1 rounded-md text-xs font-medium shadow-lg">
            Saved {savedDate}
          </span>
        </div>
      )}

      {/* Price Tag - Adjusted size based on variant */}
      <div className="absolute top-3 right-3">
        <div className={`bg-white text-gray-900 rounded font-bold shadow-md ${
          variant === 'grid' ? 'px-4 py-2 text-lg' : 'px-3 py-1.5 text-base'
        }`}>
          €{price.toLocaleString()}
        </div>
      </div>

      {/* Like Button */}
      <div className="absolute bottom-3 right-3">
        <LikeButton 
          carId={carId}
          initialLikesCount={likesCount}
          initialIsLiked={isLiked}
          size={variant === 'grid' ? 'md' : 'sm'}
          showCount={true}
          className="bg-white shadow-md rounded px-3 py-2"
        />
      </div>

      {/* Navigation arrows */}
      {hasMultipleImages && isHovered && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Image count indicator */}
      {hasMultipleImages && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
          {currentImageIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
})

CarImageCarousel.displayName = 'CarImageCarousel'

export default function CarCard({
  car,
  variant = 'grid',
  showSavedDate = false,
  showPerformance = false,
  showActions = [],
  onEdit,
  onDelete,
  onPromote,
  className = ''
}: CarCardProps) {
  
  if (!car || !car.id) {
    console.warn('CarCard: car object is undefined or missing id:', car)
    return null
  }
  
  const formattedDate = useMemo(() => {
    if (!showSavedDate || !car.savedAt) return undefined
    
    const date = new Date(car.savedAt)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString('en-IE', { 
        day: 'numeric', 
        month: 'short' 
      })
    }
  }, [showSavedDate, car.savedAt])

  // 🔥 COMPLETELY REDESIGNED: Professional layout classes
  const containerClasses = useMemo(() => {
    const base = "bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200"
    
    switch (variant) {
      case 'list':
        return `${base} flex cursor-pointer overflow-hidden` // Horizontal layout
      case 'compact':
        return `${base} cursor-pointer overflow-hidden`
      default: // 'grid'
        return `${base} cursor-pointer overflow-hidden flex flex-col` // 🔥 NEW: Vertical flex layout
    }
  }, [variant])

  const imageContainerClasses = useMemo(() => {
    switch (variant) {
      case 'list':
        return 'w-80 h-56 flex-shrink-0' // List: Fixed width
      case 'compact':
        return 'h-44'
      default: // 'grid'
        return 'h-72 w-full' // 🔥 INCREASED: Bigger image for grid (288px height)
    }
  }, [variant])

  const contentClasses = useMemo(() => {
    switch (variant) {
      case 'list':
        return 'flex-1 p-6 flex flex-col justify-between' // List: Flex content
      case 'compact':
        return 'p-4'
      default: // 'grid'
        return 'p-7 flex-1 flex flex-col' // 🔥 INCREASED: More padding for larger cards
    }
  }, [variant])

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* Conditional Link wrapper */}
      {showActions.length === 0 ? (
        <Link href={`/cars/${car.id}`} className={variant === 'list' ? 'flex w-full' : 'flex flex-col h-full w-full'}>
          <CarImageCarousel
            images={car.images}
            title={car.title}
            featured={car.featured}
            price={car.price}
            carId={car.id}
            likesCount={car.likesCount}
            isLiked={car.isLiked}
            savedDate={formattedDate}
            className={imageContainerClasses}
            variant={variant}
          />
          
          <div className={contentClasses}>
            <CarContent 
              car={car} 
              variant={variant} 
              showPerformance={showPerformance}
              showActions={showActions}
              onEdit={onEdit}
              onDelete={onDelete}
              onPromote={onPromote}
            />
          </div>
        </Link>
      ) : (
        <div className={variant === 'list' ? 'flex w-full' : 'flex flex-col h-full w-full'}>
          <CarImageCarousel
            images={car.images}
            title={car.title}
            featured={car.featured}
            price={car.price}
            carId={car.id}
            likesCount={car.likesCount}
            isLiked={car.isLiked}
            savedDate={formattedDate}
            className={imageContainerClasses}
            variant={variant}
          />
          
          <div className={contentClasses}>
            <CarContent 
              car={car} 
              variant={variant} 
              showPerformance={showPerformance}
              showActions={showActions}
              onEdit={onEdit}
              onDelete={onDelete}
              onPromote={onPromote}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 🔥 ENHANCED: Content Component with better grid layout + FIXED LOCATION
const CarContent = React.memo(({ 
  car, 
  variant, 
  showPerformance, 
  showActions,
  onEdit,
  onDelete,
  onPromote 
}: {
  car: Car
  variant: 'grid' | 'list' | 'compact'
  showPerformance: boolean
  showActions: ('edit' | 'delete' | 'promote')[]
  onEdit?: (carId: string) => void
  onDelete?: (carId: string) => void
  onPromote?: (carId: string) => void
}) => {
  
  // 🔥 NEW: Smart location display function
  const getLocationDisplay = () => {
    const area = car.location.area || car.location.city || car.location.town;
    const county = car.location.county;
    
    if (area && county) {
      return `${area}, Co. ${county}`;
    } else if (county) {
      return `Co. ${county}`;
    } else {
      return 'Location not specified';
    }
  };
  
  return (
    <>
      {/* Main Content - Grows to fill space */}
      <div className="flex-1">
        {/* Car Title */}
        <h3 className={`font-bold text-gray-900 leading-tight mb-3 ${
          variant === 'grid' ? 'text-xl' :  // 🔥 NEW: Larger title for grid
          variant === 'list' ? 'text-xl' : 'text-lg'
        }`}>
          {car.title}
        </h3>
        
        {/* Location - 🔥 FIXED: Now shows area + county */}
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-2 text-green-600" />
          <span className={`font-medium ${
            variant === 'grid' ? 'text-sm' : 'text-sm'
          }`}>
            {getLocationDisplay()}
          </span>
        </div>

        {/* Car Specifications */}
        <div className={`grid gap-3 mb-4 ${
          variant === 'list' ? 'grid-cols-4' :      // List: 4 columns
          variant === 'grid' ? 'grid-cols-2' :      // 🔥 NEW: Grid 2 columns for better spacing
          'grid-cols-2'                              // Compact: 2 columns
        }`}>
          <div className="flex flex-col">
            <div className="flex items-center text-gray-500 text-xs mb-1">
              <Calendar className="w-3 h-3 mr-1" />
              Year
            </div>
            <span className={`font-semibold text-gray-900 ${
              variant === 'grid' ? 'text-base' : 'text-sm'
            }`}>
              {car.year}
            </span>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center text-gray-500 text-xs mb-1">
              <Gauge className="w-3 h-3 mr-1" />
              Mileage
            </div>
            <span className={`font-semibold text-gray-900 ${
              variant === 'grid' ? 'text-base' : 'text-sm'
            }`}>
              {car.mileage?.toLocaleString()} km
            </span>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center text-gray-500 text-xs mb-1">
              <Fuel className="w-3 h-3 mr-1" />
              Fuel
            </div>
            <span className={`font-semibold text-gray-900 capitalize ${
              variant === 'grid' ? 'text-base' : 'text-sm'
            }`}>
              {car.fuelType?.toLowerCase()}
            </span>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center text-gray-500 text-xs mb-1">
              <Settings className="w-3 h-3 mr-1" />
              Trans
            </div>
            <span className={`font-semibold text-gray-900 capitalize ${
              variant === 'grid' ? 'text-base' : 'text-sm'
            }`}>
              {car.transmission?.toLowerCase()}
            </span>
          </div>
        </div>

        {/* Performance Stats */}
        {showPerformance && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-bold text-green-700 text-lg">{car.views}</div>
              <div className="text-xs text-green-600">Views</div>
            </div>
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-bold text-blue-700 text-lg">{car.inquiries}</div>
              <div className="text-xs text-blue-600">Inquiries</div>
            </div>
            <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="font-bold text-orange-700 text-lg">{car.likesCount}</div>
              <div className="text-xs text-orange-600">Likes</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Always at bottom */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pt-6 border-t border-gray-100 ${
        variant === 'grid' ? 'mt-6' : 'mt-auto'
      }`}>
        {/* Seller Info */}
        <div className="flex items-center">
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-1.5 text-gray-400" />
            <span className="flex items-center">
              {car.seller.verified && <Shield className="w-3 h-3 mr-1 text-green-600" />}
              {car.seller.verified ? '✓ Verified' : ''} {car.seller.type}
            </span>
          </div>
        </div>

        {/* Action Buttons or View Details */}
        {showActions.length > 0 ? (
          <div className="flex space-x-2">
            {showActions.includes('edit') && onEdit && (
              <button
                onClick={() => onEdit(car.id)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
            {showActions.includes('promote') && onPromote && (
              <button
                onClick={() => onPromote(car.id)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Promote
              </button>
            )}
            {showActions.includes('delete') && onDelete && (
              <button
                onClick={() => onDelete(car.id)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        ) : (
          <div className={`bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-md ${
            variant === 'grid' ? 'px-6 py-3 text-center w-full' :  // 🔥 NEW: Full width button for grid
            'px-6 py-2.5 text-center sm:text-left'
          }`}>
            View Details
          </div>
        )}
      </div>
    </>
  )
})

CarContent.displayName = 'CarContent'