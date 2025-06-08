'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, Filter, Grid, List, ArrowLeft } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LikeButton from '@/components/LikeButton'

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
  location: { city: string; county: string }
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
}

function CarsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  
  // Get search parameters
  const searchQuery = searchParams.get('q') || ''
  const makeFilter = searchParams.get('make') || ''
  const countyFilter = searchParams.get('county') || ''
  const priceRangeFilter = searchParams.get('priceRange') || ''
  const yearFilter = searchParams.get('year') || ''

  // Fetch cars based on search parameters
  useEffect(() => {
    async function fetchCars() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        
        if (searchQuery) params.set('q', searchQuery)
        if (makeFilter) params.set('make', makeFilter)
        if (countyFilter) params.set('county', countyFilter)
        if (priceRangeFilter) params.set('priceRange', priceRangeFilter)
        if (yearFilter) params.set('year', yearFilter)
        params.set('sort', sortBy)
        
        const response = await fetch(`/api/cars?${params.toString()}`)
        const data = await response.json()
        
        if (data.success) {
          setCars(data.cars)
        }
      } catch (error) {
        console.error('Error fetching cars:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCars()
  }, [searchQuery, makeFilter, countyFilter, priceRangeFilter, yearFilter, sortBy])

  // Build search description
  const getSearchDescription = () => {
    const terms = []
    if (searchQuery) terms.push(`"${searchQuery}"`)
    if (makeFilter) terms.push(makeFilter)
    if (countyFilter) terms.push(countyFilter)
    
    if (terms.length > 0) {
      return `Search results for ${terms.join(', ')}`
    }
    return 'All Cars'
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-primary hover:text-primary/80 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getSearchDescription()}</h1>
            <p className="text-gray-600 mt-1">
              {loading ? 'Loading...' : `${cars.length} car${cars.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          
          <Link
            href="/"
            className="flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            <Search className="w-4 h-4 mr-2" />
            New Search
          </Link>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <button className="flex items-center text-gray-600 hover:text-primary transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="year-new">Year: Newest</option>
              <option value="mileage-low">Mileage: Lowest</option>
              <option value="most-liked">Most Liked</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cars Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading cars...</p>
        </div>
      ) : cars.length > 0 ? (
        <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-6'}`}>
          {cars.map((car) => (
            <div key={car.id} className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
              viewMode === 'list' ? 'flex' : ''
            }`}>
              <div className={`relative ${viewMode === 'list' ? 'w-80 h-48 flex-shrink-0' : 'h-48'}`}>
                <Image
                  src={car.images[0]?.url || '/placeholder-car.jpg'}
                  alt={car.images[0]?.alt || car.title}
                  fill
                  className="object-cover"
                />
                {car.featured && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                      Featured
                    </span>
                  </div>
                )}
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <span className="bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    €{car.price.toLocaleString()}
                  </span>
                  <LikeButton 
                    carId={car.id}
                    initialLikesCount={car.likesCount}
                    initialIsLiked={car.isLiked}
                    size="sm"
                    showCount={false}
                    className="bg-white bg-opacity-90 rounded-full"
                  />
                </div>
              </div>

              <div className={`p-6 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                <div>
                  <h3 className={`font-bold text-gray-900 mb-2 ${viewMode === 'list' ? 'text-2xl' : 'text-xl'}`}>
                    {car.title}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{car.location.city}, {car.location.county}</span>
                  </div>

                  <div className={`grid gap-4 mb-4 text-sm ${
                    viewMode === 'list' ? 'grid-cols-4' : 'grid-cols-2'
                  }`}>
                    <div>
                      <span className="text-gray-500">Year:</span>
                      <span className="font-medium ml-1">{car.year}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mileage:</span>
                      <span className="font-medium ml-1">{car.mileage?.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Fuel:</span>
                      <span className="font-medium ml-1 capitalize">{car.fuelType?.toLowerCase()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Transmission:</span>
                      <span className="font-medium ml-1 capitalize">{car.transmission?.toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between ${viewMode === 'list' ? 'mt-4' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      {car.seller.verified ? '✓ Verified' : ''} {car.seller.type}
                    </span>
                    <LikeButton 
                      carId={car.id}
                      initialLikesCount={car.likesCount}
                      initialIsLiked={car.isLiked}
                      size="sm"
                    />
                  </div>
                  <Link
                    href={`/cars/${car.id}`}
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or browse all cars.</p>
          <Link
            href="/cars"
            className="inline-flex items-center rounded bg-primary px-4 py-2 text-white hover:bg-primary/90 transition-colors"
          >
            Browse All Cars
          </Link>
        </div>
      )}
    </div>
  )
}

export default function CarsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Header */}
      <Header currentPage="cars" />

      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <CarsContent />
      </Suspense>

      {/* Shared Footer */}
      <Footer />
    </div>
  )
}