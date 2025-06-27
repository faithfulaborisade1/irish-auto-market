'use client'

import Link from 'next/link'
import { Search, MapPin, Grid, List, ArrowLeft, Filter } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LikeButton from '@/components/LikeButton'
import CarFilters from '@/components/CarFilters'

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

// FIXED: Updated FilterState to match CarFilters.tsx exactly
interface FilterState {
  // Basic filters
  searchText: string
  make: string
  model: string
  
  // Seller type
  sellerType: string[] // ['dealership', 'private']
  
  // Price
  priceFrom: string
  priceTo: string
  
  // Year
  yearFrom: string
  yearTo: string
  
  // Mileage
  mileageFrom: string
  mileageTo: string
  
  // Location - FIXED: Changed from 'location' to 'county' and 'area'
  county: string
  area: string
  radius: string
  
  // Fuel type
  fuelType: string[]
  
  // Transmission
  transmission: string[]
  
  // Body type
  bodyType: string[]
  
  // Engine
  engineSizeFrom: string
  engineSizeTo: string
  enginePowerFrom: string
  enginePowerTo: string
  
  // Electric
  batteryRange: string
  
  // Other filters
  seatCount: string
  doors: string
  color: string
  registrationCountry: string
  
  // Verifications
  nctValid: boolean
  warrantyDuration: string
  totalOwners: string
  
  // Ad type
  adType: string
}

function CarsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  
  // FIXED: Updated initial state to match new FilterState interface
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    searchText: '',
    make: '',
    model: '',
    sellerType: [],
    priceFrom: '',
    priceTo: '',
    yearFrom: '',
    yearTo: '',
    mileageFrom: '',
    mileageTo: '',
    county: '',      // FIXED: Changed from 'location' to 'county'
    area: '',        // FIXED: Added 'area'
    radius: '',
    fuelType: [],
    transmission: [],
    bodyType: [],
    engineSizeFrom: '',
    engineSizeTo: '',
    enginePowerFrom: '',
    enginePowerTo: '',
    batteryRange: '',
    seatCount: '',
    doors: '',
    color: '',
    registrationCountry: '',
    nctValid: false,
    warrantyDuration: '',
    totalOwners: '',
    adType: 'for-sale'
  })

  // Initialize filters from URL params
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())
    setCurrentFilters(prev => ({
      ...prev,
      searchText: params.q || '',
      make: params.make || '',
      model: params.model || '',
      priceFrom: params.minPrice || '',
      priceTo: params.maxPrice || '',
      yearFrom: params.minYear || '',
      yearTo: params.maxYear || '',
      county: params.county || '',     // FIXED: Changed from 'location' to 'county'
      area: params.area || ''          // FIXED: Added area parameter
    }))
  }, [searchParams])

  // Fetch cars based on filters
  const fetchCars = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Basic filters
      if (currentFilters.searchText) params.set('q', currentFilters.searchText)
      if (currentFilters.make) params.set('make', currentFilters.make)
      if (currentFilters.model) params.set('model', currentFilters.model)
      
      // Price filters
      if (currentFilters.priceFrom) params.set('minPrice', currentFilters.priceFrom)
      if (currentFilters.priceTo) params.set('maxPrice', currentFilters.priceTo)
      
      // Year filters
      if (currentFilters.yearFrom) params.set('minYear', currentFilters.yearFrom)
      if (currentFilters.yearTo) params.set('maxYear', currentFilters.yearTo)
      
      // Mileage filters
      if (currentFilters.mileageFrom) params.set('minMileage', currentFilters.mileageFrom)
      if (currentFilters.mileageTo) params.set('maxMileage', currentFilters.mileageTo)
      
      // Location - FIXED: Updated to use 'county' and 'area'
      if (currentFilters.county) params.set('county', currentFilters.county)
      if (currentFilters.area) params.set('area', currentFilters.area)
      
      // Array filters
      if (currentFilters.fuelType.length > 0) params.set('fuelType', currentFilters.fuelType.join(','))
      if (currentFilters.transmission.length > 0) params.set('transmission', currentFilters.transmission.join(','))
      if (currentFilters.bodyType.length > 0) params.set('bodyType', currentFilters.bodyType.join(','))
      if (currentFilters.sellerType.length > 0) params.set('sellerType', currentFilters.sellerType.join(','))
      
      // Other filters
      if (currentFilters.seatCount) params.set('seats', currentFilters.seatCount)
      if (currentFilters.doors) params.set('doors', currentFilters.doors)
      if (currentFilters.nctValid) params.set('nctValid', 'true')
      
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

  // Handle filter changes
  const handleFiltersChange = (newFilters: FilterState) => {
    setCurrentFilters(newFilters)
  }

  // Handle search button click
  const handleSearch = () => {
    fetchCars()
  }

  // Fetch cars when sort changes
  useEffect(() => {
    fetchCars()
  }, [sortBy])

  // Get active filter count for display
  const getActiveFilterCount = () => {
    let count = 0
    if (currentFilters.searchText) count++
    if (currentFilters.make) count++
    if (currentFilters.model) count++
    if (currentFilters.priceFrom || currentFilters.priceTo) count++
    if (currentFilters.yearFrom || currentFilters.yearTo) count++
    if (currentFilters.mileageFrom || currentFilters.mileageTo) count++
    if (currentFilters.county) count++        // FIXED: Changed from 'location' to 'county'
    if (currentFilters.area) count++          // FIXED: Added area count
    count += currentFilters.fuelType.length
    count += currentFilters.transmission.length
    count += currentFilters.bodyType.length
    count += currentFilters.sellerType.length
    if (currentFilters.seatCount) count++
    if (currentFilters.doors) count++
    if (currentFilters.nctValid) count++
    return count
  }

  // Build search description
  const getSearchDescription = () => {
    const terms = []
    if (currentFilters.searchText) terms.push(`"${currentFilters.searchText}"`)
    if (currentFilters.make) terms.push(currentFilters.make)
    if (currentFilters.county) terms.push(currentFilters.county)    // FIXED: Changed from 'location' to 'county'
    
    if (terms.length > 0) {
      return `Search results for ${terms.join(', ')}`
    }
    return 'All Cars'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Filter Sidebar */}
      <div className={`${filtersOpen ? 'lg:w-80' : 'lg:w-0'} transition-all duration-300 flex-shrink-0`}>
        <CarFilters
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
          className="lg:h-screen lg:sticky lg:top-0"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
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
                  {getActiveFilterCount() > 0 && (
                    <span className="ml-2 text-primary">
                      ({getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied)
                    </span>
                  )}
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

            {/* Controls */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-4">
                {/* Mobile filter toggle */}
                <button 
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden flex items-center text-gray-600 hover:text-primary transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {getActiveFilterCount() > 0 && (
                    <span className="ml-1 bg-primary text-white text-xs rounded-full px-2 py-1">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>

                {/* Desktop filter toggle */}
                <button 
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="hidden lg:flex items-center text-gray-600 hover:text-primary transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {filtersOpen ? 'Hide' : 'Show'} Filters
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
            <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'space-y-6'}`}>
              {cars.map((car) => (
                <div key={car.id} className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                  viewMode === 'list' ? 'md:flex' : ''
                }`}>
                  <div className={`relative ${
                    viewMode === 'list' 
                      ? 'h-48 md:w-80 md:h-56 md:flex-shrink-0' 
                      : 'h-48'
                  }`}>
                    <img
                      src={car.images[0]?.url || '/placeholder-car.jpg'}
                      alt={car.images[0]?.alt || car.title}
                      className="w-full h-full object-cover"
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

                  <div className={`p-6 ${
                    viewMode === 'list' 
                      ? 'md:flex-1 md:flex md:flex-col md:justify-between' 
                      : ''
                  }`}>
                    <div>
                      <h3 className={`font-bold text-gray-900 mb-2 ${
                        viewMode === 'list' ? 'text-xl md:text-2xl' : 'text-xl'
                      }`}>
                        {car.title}
                      </h3>
                      
                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{car.location.city}, {car.location.county}</span>
                      </div>

                      <div className={`grid gap-4 mb-4 text-sm ${
                        viewMode === 'list' 
                          ? 'grid-cols-2 md:grid-cols-4' 
                          : 'grid-cols-2'
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

                    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 ${
                      viewMode === 'list' ? 'md:mt-4' : ''
                    }`}>
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
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors text-center sm:text-left"
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
      </div>
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