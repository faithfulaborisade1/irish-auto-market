'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Phone, Mail, MapPin, Calendar, Gauge, Fuel, Settings, Eye, MessageCircle, X, ChevronLeft, ChevronRight, Star, Shield, Clock, Heart, Share2, Car, Zap, Users } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoanittFinanceButton from '@/components/LoanittFinanceButton'
import { formatPrice } from '@/utils/currency'

interface CarDetailPageProps {
  params: {
    id: string
  }
}

// Clean Car Image Gallery Component
interface CarImageGalleryProps {
  images: Array<{ id: string; url: string; alt: string }>
  title: string
  featured: boolean
  views: number
  inquiries: number
}

function CarImageGallery({ images, title, featured, views, inquiries }: CarImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFullscreen, setShowFullscreen] = useState(false)
  
  const hasMultipleImages = images && images.length > 1
  const currentImage = images?.[currentImageIndex] || null

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

  const getOptimizedImageUrl = (url: string, size: 'main' | 'thumbnail' = 'main') => {
    if (!url) return '/placeholder-car.jpg';

    if (size === 'thumbnail') {
      return url
        .replace(/\/c_fill,w_\d+,h_\d+,g_auto\//, '/')
        .replace(/\/c_thumb,w_\d+,h_\d+,g_auto\//, '/')
        + '?w=100&h=75&fit=cover&auto=format,compress&q=85';
    } else {
      return url
        .replace(/\/c_fill,w_\d+,h_\d+,g_auto\//, '/')
        .replace(/\/c_thumb,w_\d+,h_\d+,g_auto\//, '/')
        + '?w=600&h=400&fit=cover&auto=format,compress&q=85';
    }
  };

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden cursor-pointer group" onClick={() => setShowFullscreen(true)}>
        <img
          src={getOptimizedImageUrl(currentImage?.url, 'main')}
          alt={currentImage?.alt || title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-car.jpg'
          }}
        />
        
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center shadow-lg">
              <Star className="w-4 h-4 mr-1 fill-current" />
              Featured
            </div>
          </div>
        )}

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-10 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-10 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Expand hint */}
        <div className="absolute bottom-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm">
            Click to expand
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {hasMultipleImages && (
        <div className="mt-4">
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {images.slice(0, 8).map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  index === currentImageIndex 
                    ? 'border-blue-500 ring-2 ring-blue-500/30' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={getOptimizedImageUrl(image.url, 'thumbnail')}
                  alt={`${title} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {images.length > 8 && (
              <div className="flex-shrink-0 w-20 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium">
                +{images.length - 8}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center z-10 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center z-10 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center z-10 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            <div className="relative max-w-6xl max-h-full">
              <img
                src={currentImage?.url || '/placeholder-car.jpg'}
                alt={currentImage?.alt || title}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {hasMultipleImages && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to get NCT status and styling
function getNCTStatus(nctExpiry: string | null | undefined): { text: string; color: string } {
  if (!nctExpiry) {
    return { text: 'Not Available', color: 'text-gray-500' }
  }

  try {
    const expiryDate = new Date(nctExpiry)
    const today = new Date()
    const monthsUntilExpiry = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
    
    // Format the date nicely
    const formattedDate = expiryDate.toLocaleDateString('en-IE', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })

    if (expiryDate < today) {
      return { text: `Expired ${formattedDate}`, color: 'text-red-600' }
    } else if (monthsUntilExpiry < 1) {
      return { text: `Expires Soon (${formattedDate})`, color: 'text-orange-600' }
    } else if (monthsUntilExpiry < 3) {
      return { text: `${formattedDate}`, color: 'text-yellow-600' }
    } else {
      return { text: `${formattedDate}`, color: 'text-green-600' }
    }
  } catch (error) {
    return { text: 'Invalid Date', color: 'text-gray-500' }
  }
}

export default function CarDetailPage({ params }: CarDetailPageProps) {
  const router = useRouter()
  const [car, setCar] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showPhoneNumber, setShowPhoneNumber] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [otherDealerCars, setOtherDealerCars] = useState<any[]>([])

  // Share functionality
  const handleShare = async () => {
    const url = window.location.href
    const title = `${car.make} ${car.model} ${car.year} - ${formatPrice(car.price, car.currency || 'EUR')}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this ${car.make} ${car.model} on Irish Auto Market`,
          url: url
        })
      } catch (error) {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      } catch (error) {
        alert('Unable to share or copy link')
      }
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const method = isFavorited ? 'DELETE' : 'POST'
      const response = await fetch(`/api/cars/${car.id}/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (data.success) {
        setIsFavorited(data.favorited)
        setFavoritesCount(data.favoritesCount || 0)
      } else {
        alert('Failed to update favorite')
      }
    } catch (error) {
      console.error('Error updating favorite:', error)
      alert('Failed to update favorite')
    }
  }

  useEffect(() => {
    fetchCar()
    checkAuth()
  }, [params.id])

  useEffect(() => {
    if (car && user) {
      checkIfFavorited()
    }
  }, [car, user])

  const checkIfFavorited = async () => {
    try {
      const response = await fetch(`/api/cars/${car.id}/favorite`)
      const data = await response.json()
      if (data.success) {
        setIsFavorited(data.favorited)
        setFavoritesCount(data.favoritesCount || 0)
      }
    } catch (error) {
      console.log('Could not check favorite status')
    }
  }

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success) {
        setUser(data.user)
      } else {
        // Don't clear user state on auth failure - just log it
        console.log('Auth check failed:', data.message)
      }
    } catch (error) {
      console.log('User not logged in')
    }
  }

  async function fetchCar() {
  try {
    setLoading(true)
    const response = await fetch(`/api/cars/${params.id}`)
    
    if (!response.ok) {
      setError(true)
      return
    }
    
    const data = await response.json()
    if (data.success && data.car) {
      setCar(data.car)

      // Set other dealer cars if available
      if (data.otherDealerCars && data.otherDealerCars.length > 0) {
        setOtherDealerCars(data.otherDealerCars)
      }

      // 🆕 ADD THIS: Increment view count
      fetch(`/api/cars/${params.id}/view`, {
        method: 'POST'
      }).catch(error => {
        console.log('Failed to track view:', error)
      })

    } else {
      setError(true)
    }
  } catch (error) {
    console.error('Error fetching car:', error)
    setError(true)
  } finally {
    setLoading(false)
  }
}

  const handleSendMessage = async () => {
    if (!messageText.trim() || sendingMessage) return
    
    if (!user) {
      router.push('/login')
      return
    }

    if (user.id === car.userId) {
      alert("You can't message yourself about your own car!")
      return
    }

    try {
      setSendingMessage(true)
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          carId: params.id,
          message: messageText.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        router.push(`/messages/${data.conversation.id}`)
      } else {
        alert('Failed to send message: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  const openMessageModal = async () => {
    if (!user) {
      // Double-check auth before redirecting to login
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          // User is actually logged in, proceed with modal
          if (data.user.id === car.userId) {
            alert("You can't message yourself about your own car!")
            return
          }
          setShowMessageModal(true)
          setMessageText(`Hi, I'm interested in your ${car.make} ${car.model} ${car.year}. Is it still available?`)
          return
        }
      } catch (error) {
        console.log('Auth recheck failed')
      }
      router.push('/login')
      return
    }

    if (user.id === car.userId) {
      alert("You can't message yourself about your own car!")
      return
    }

    setShowMessageModal(true)
    setMessageText(`Hi, I'm interested in your ${car.make} ${car.model} ${car.year}. Is it still available?`)
  }

  const getLocationDisplay = (location: any) => {
    if (!location) return 'Location not specified'
    
    if (typeof location === 'string') {
      return location
    }
    
    if (typeof location === 'object') {
      if (location.display_location) {
        return location.display_location
      }
      
      const area = location.area || location.city || location.town
      const county = location.county || location.region
      
      if (area && county) {
        return `${area}, ${county}`
      } else if (county) {
        return county
      } else if (area) {
        return area
      }
    }
    
    return 'Ireland'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading car details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Car Not Found</h1>
            <p className="text-gray-600 mb-4">The car you're looking for doesn't exist or has been removed.</p>
            <Link href="/cars" className="text-green-600 hover:underline">
              Back to car listings
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="py-6 border-b border-gray-200">
            <Link 
              href="/cars" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to listings
            </Link>
          </div>

          {/* Main Content */}
          <div className="py-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Left: Image Gallery */}
              <div className="lg:col-span-3">
                <CarImageGallery
                  images={car.images || []}
                  title={car.title}
                  featured={car.featured}
                  views={car.views || car.viewsCount || 0}
                  inquiries={car.inquiries || car.inquiriesCount || 0}
                />
              </div>

              {/* Right: Car Details */}
              <div className="lg:col-span-2">
                <div className="sticky top-8">
                  
                  {/* Title & Price */}
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {car.make} {car.model} {car.year}
                    </h1>
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {formatPrice(car.price, car.currency || 'EUR')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {car.views || car.viewsCount || 0} views
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {getLocationDisplay(car.location)}
                      </span>
                    </div>
                  </div>

                  {/* Key Specs */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <div className="font-semibold text-gray-900">{car.year}</div>
                      <div className="text-sm text-gray-600">Year</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <Gauge className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <div className="font-semibold text-gray-900">{car.mileage?.toLocaleString() || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Kilometres</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <Fuel className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <div className="font-semibold text-gray-900 capitalize">{car.fuelType?.toLowerCase() || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Fuel</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <Settings className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <div className="font-semibold text-gray-900 capitalize">{car.transmission?.toLowerCase() || 'N/A'}</div>
                      <div className="text-sm text-gray-600">Transmission</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center col-span-2">
                      <Shield className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <div className={`font-semibold text-sm ${getNCTStatus(car.nctExpiry).color}`}>
                        {getNCTStatus(car.nctExpiry).text}
                      </div>
                      <div className="text-sm text-gray-600">NCT Status</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 mb-6">
                    <button
                      onClick={openMessageModal}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Contact Seller
                    </button>

                    <button
                      onClick={() => setShowPhoneNumber(!showPhoneNumber)}
                      className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      {showPhoneNumber ? (car.seller?.phone || 'No phone available') : 'Show Phone Number'}
                    </button>

                    {/* Finance Button */}
                    <LoanittFinanceButton
                      car={{
                        make: car.make,
                        model: car.model,
                        year: car.year,
                        price: Number(car.price),
                        mileage: car.mileage || undefined
                      }}
                      dealer={car.userId ? {
                        id: car.userId,
                        name: car.seller?.businessName || car.seller?.name || 'Dealer'
                      } : undefined}
                      variant="secondary"
                      size="md"
                      fullWidth
                    />

                    <div className="flex space-x-3">
                      <button
                        onClick={handleShare}
                        className="flex-1 border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </button>
                      <button
                        onClick={handleFavorite}
                        className={`flex-1 border py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center ${
                          isFavorited
                            ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${isFavorited ? 'fill-current' : ''}`} />
                        {isFavorited ? 'Favorited' : 'Add to Favorites'}
                      </button>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-2">
                      {car.seller?.businessName || car.seller?.name || 'Private Seller'}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <Shield className="w-4 h-4 mr-1" />
                      {(car.seller?.type === 'dealer' || car.seller?.type === 'DEALER') ? 'Verified Dealer' : 'Private Seller'}
                      {car.seller?.verified && (
                        <span className="ml-2 text-orange-500">⭐ Verified</span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {getLocationDisplay(car.location)}
                    </div>

                    {showPhoneNumber && car.seller?.phone && (
                      <a
                        href={`tel:${car.seller.phone}`}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {car.seller.phone}
                      </a>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Description */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Description</h2>
                  <div className="text-gray-700 leading-relaxed">
                    {car.description || 'No description available for this vehicle.'}
                  </div>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold mb-4">Specifications</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Make</span>
                      <span className="font-medium">{car.make}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model</span>
                      <span className="font-medium">{car.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year</span>
                      <span className="font-medium">{car.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Body Type</span>
                      <span className="font-medium capitalize">{car.bodyType?.toLowerCase() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color</span>
                      <span className="font-medium">{car.color || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engine Size</span>
                      <span className="font-medium">{car.engineSize ? `${car.engineSize}L` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Doors</span>
                      <span className="font-medium">{car.doors || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seats</span>
                      <span className="font-medium">{car.seats || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">NCT Expiry</span>
                      <span className={`font-medium ${getNCTStatus(car.nctExpiry).color}`}>
                        {getNCTStatus(car.nctExpiry).text}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other Dealer Cars Section */}
          {otherDealerCars.length > 0 && (
            <div className="mt-12 pb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  More from {car.seller?.name || 'this dealer'}
                </h2>
                <p className="text-gray-600">
                  Check out other vehicles from this {car.seller?.type === 'dealer' ? 'dealership' : 'seller'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherDealerCars.map((otherCar) => (
                  <Link
                    key={otherCar.id}
                    href={`/cars/${otherCar.id}`}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    {/* Car Image */}
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      {otherCar.image ? (
                        <img
                          src={otherCar.image.url}
                          alt={otherCar.image.alt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-car.jpg'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Car className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Car Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-1">
                        {otherCar.make} {otherCar.model}
                      </h3>

                      <div className="text-2xl font-bold text-green-600 mb-3">
                        {formatPrice(otherCar.price, 'EUR')}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>{otherCar.year}</span>
                        </div>
                        <div className="flex items-center">
                          <Gauge className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>{otherCar.mileage ? `${otherCar.mileage.toLocaleString()} km` : 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <Fuel className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="capitalize">{otherCar.fuelType?.toLowerCase() || 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <Settings className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="capitalize">{otherCar.transmission?.toLowerCase() || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{getLocationDisplay(otherCar.location)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* View All Button */}
              {otherDealerCars.length >= 6 && (
                <div className="mt-6 text-center">
                  <Link
                    href={`/dealers/${car.userId}`}
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    View All Cars from {car.seller?.name || 'this dealer'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Contact Seller</h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={car.images?.[0]?.url || '/placeholder-car.jpg'}
                    alt={car.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <div className="font-medium text-sm">{car.make} {car.model} {car.year}</div>
                    <div className="text-green-600 font-semibold">{formatPrice(car.price, car.currency || 'EUR')}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write your message here..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    messageText.trim() && !sendingMessage
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}