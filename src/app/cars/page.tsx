'use client'

import Link from 'next/link'
import { Search, Grid, List, ArrowLeft, Filter, X } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CarFilters from '@/components/CarFilters'
import CarCard from '@/components/CarCard'

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
  location: any
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

interface FilterState {
  searchText: string
  make: string
  model: string
  sellerType: string[]
  priceFrom: string
  priceTo: string
  yearFrom: string
  yearTo: string
  mileageFrom: string
  mileageTo: string
  county: string
  area: string
  radius: string
  fuelType: string[]
  transmission: string[]
  bodyType: string[]
  engineSizeFrom: string
  engineSizeTo: string
  enginePowerFrom: string
  enginePowerTo: string
  batteryRange: string
  seatCount: string
  doors: string
  color: string
  registrationCountry: string
  nctValid: boolean
  warrantyDuration: string
  totalOwners: string
  adType: string
}

function CarsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  
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
    county: '',
    area: '',
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

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())
    console.log('🔗 URL params received:', params)
    
    let priceFrom = ''
    let priceTo = ''
    if (params.priceRange) {
      const [min, max] = params.priceRange.split('-')
      priceFrom = min && min !== '0' ? min : ''
      priceTo = max && max !== '1000000' ? max : ''
    }
    
    let yearFrom = ''
    let yearTo = ''
    if (params.year) {
      const [min, max] = params.year.split('-')
      yearFrom = min && min !== '1900' ? min : ''
      yearTo = max && max !== '2025' ? max : ''
    }
    
    const newFilters = {
      ...currentFilters,
      searchText: params.q || '',
      make: params.make || '',
      model: params.model || '',
      priceFrom,
      priceTo,
      yearFrom,
      yearTo,
      county: params.county || '',
      area: params.area || ''
    }
    
    console.log('🎯 Setting filters from URL:', newFilters)
    setCurrentFilters(newFilters)
    
    const hasFilters = params.q || params.make || params.model || params.county || 
                       params.priceRange || params.year || params.autoSearch
    
    if (hasFilters) {
      console.log('🚀 Auto-searching because filters detected')
      setTimeout(() => {
        fetchCars()
      }, 100)
    }
  }, [searchParams])

  useEffect(() => {
    if (cars.length > 0) {
      fetchCars()
    }
  }, [sortBy])

  const fetchCars = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (currentFilters.searchText) params.set('q', currentFilters.searchText)
      if (currentFilters.make) params.set('make', currentFilters.make)
      if (currentFilters.model) params.set('model', currentFilters.model)
      if (currentFilters.county) params.set('county', currentFilters.county)
      if (currentFilters.area) params.set('area', currentFilters.area)
      
      if (currentFilters.priceFrom || currentFilters.priceTo) {
        const minPrice = currentFilters.priceFrom || '0'
        const maxPrice = currentFilters.priceTo || '1000000'
        params.set('priceRange', `${minPrice}-${maxPrice}`)
      }
      
      if (currentFilters.yearFrom || currentFilters.yearTo) {
        const minYear = currentFilters.yearFrom || '1900'
        const maxYear = currentFilters.yearTo || '2025'
        params.set('year', `${minYear}-${maxYear}`)
      }
      
      if (currentFilters.mileageFrom) params.set('mileageFrom', currentFilters.mileageFrom)
      if (currentFilters.mileageTo) params.set('mileageTo', currentFilters.mileageTo)
      
      if (currentFilters.color) params.set('color', currentFilters.color)
      if (currentFilters.doors) params.set('doors', currentFilters.doors)
      if (currentFilters.seatCount) params.set('seats', currentFilters.seatCount)
      if (currentFilters.nctValid) params.set('nctValid', 'true')
      
      if (currentFilters.fuelType.length > 0) params.set('fuelType', currentFilters.fuelType.join(','))
      if (currentFilters.transmission.length > 0) params.set('transmission', currentFilters.transmission.join(','))
      if (currentFilters.bodyType.length > 0) params.set('bodyType', currentFilters.bodyType.join(','))
      if (currentFilters.sellerType.length > 0) params.set('sellerType', currentFilters.sellerType.join(','))
      
      params.set('sort', sortBy)
      
      console.log('🔍 Fetching cars with params:', params.toString())
      
      const response = await fetch(`/api/cars?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setCars(data.cars)
        console.log(`✅ Found ${data.cars.length} cars`)
      } else {
        console.error('❌ API error:', data.error)
        setCars([])
      }
    } catch (error) {
      console.error('❌ Fetch error:', error)
      setCars([])
    } finally {
      setLoading(false)
    }
  }

    const handleFiltersChange = (newFilters: FilterState) => {
    console.log('🔧 Filters changed:', newFilters)
    setCurrentFilters(newFilters)
    
    const params = new URLSearchParams()
    if (newFilters.searchText) params.set('q', newFilters.searchText)
    if (newFilters.make) params.set('make', newFilters.make)
    if (newFilters.model) params.set('model', newFilters.model)
    if (newFilters.priceFrom || newFilters.priceTo) {
      const minPrice = newFilters.priceFrom || '0'
      const maxPrice = newFilters.priceTo || '1000000'
      params.set('priceRange', `${minPrice}-${maxPrice}`)
    }
    if (newFilters.yearFrom || newFilters.yearTo) {
      const minYear = newFilters.yearFrom || '1900'
      const maxYear = newFilters.yearTo || '2025'
      params.set('year', `${minYear}-${maxYear}`)
    }
    if (newFilters.county) params.set('county', newFilters.county)
    if (newFilters.area) params.set('area', newFilters.area)
    if (newFilters.fuelType.length > 0) params.set('fuelType', newFilters.fuelType.join(','))
    if (newFilters.transmission.length > 0) params.set('transmission', newFilters.transmission.join(','))
    if (newFilters.bodyType.length > 0) params.set('bodyType', newFilters.bodyType.join(','))
    if (newFilters.sellerType.length > 0) params.set('sellerType', newFilters.sellerType.join(','))
    
    // Fixed: Use the correct App Router syntax
    router.push(`/cars?${params.toString()}`)
    fetchCars()
  }

  const handleSearch = () => {
    console.log('🔍 Search button clicked')
    fetchCars()
    setFiltersOpen(false)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (currentFilters.searchText) count++
    if (currentFilters.make) count++ // Ensure this triggers for make alone
    if (currentFilters.model) count++
    if (currentFilters.priceFrom || currentFilters.priceTo) count++
    if (currentFilters.yearFrom || currentFilters.yearTo) count++
    if (currentFilters.mileageFrom || currentFilters.mileageTo) count++
    if (currentFilters.county) count++
    if (currentFilters.area) count++
    count += currentFilters.fuelType.length
    count += currentFilters.transmission.length
    count += currentFilters.bodyType.length
    count += currentFilters.sellerType.length
    if (currentFilters.seatCount) count++
    if (currentFilters.doors) count++
    if (currentFilters.nctValid) count++
    return count
  }

  const getSearchDescription = () => {
    const terms = []
    if (currentFilters.searchText) terms.push(`"${currentFilters.searchText}"`)
    if (currentFilters.make) terms.push(currentFilters.make)
    if (currentFilters.county) terms.push(currentFilters.county)
    
    if (terms.length > 0) {
      return `Search results for ${terms.join(', ')}`
    }
    return 'All Cars'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="w-80 h-screen sticky top-0 overflow-y-auto">
            <CarFilters
              onFiltersChange={handleFiltersChange}
              onSearch={handleSearch}
              isOpen={true}
              onToggle={() => {}}
              className="h-full"
            />
          </div>
        </div>

        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setFiltersOpen(false)} />
            <div className="fixed left-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 transition-transform duration-300">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CarFilters
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
                isOpen={true}
                onToggle={() => setFiltersOpen(!filtersOpen)}
                className="h-full overflow-y-auto"
              />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="max-w-none px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-green-600 hover:text-green-700 mb-2 sm:mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">Back</span>
              </button>
            </div>

            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{getSearchDescription()}</h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {loading ? 'Loading...' : `${cars.length} car${cars.length !== 1 ? 's' : ''} found`}
                    {getActiveFilterCount() > 0 && (
                      <span className="ml-2 text-green-600">
                        ({getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied)
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  href="/"
                  className="flex items-center text-green-600 hover:text-green-700 transition-colors whitespace-nowrap"
                >
                  <Search className="w-4 h-4 mr-2" />
                  <span className="text-sm sm:text-base">New Search</span>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-3 sm:p-4 rounded-lg shadow space-y-3 sm:space-y-0">
                <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
                  <button 
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className="lg:hidden flex items-center text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="text-sm sm:text-base">
                      {filtersOpen ? 'Hide Filters' : 'Show Filters'}
                    </span>
                    {getActiveFilterCount() > 0 && (
                      <span className="ml-1 bg-green-600 text-white text-xs rounded-full px-2 py-1">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="year-new">Year: Newest</option>
                    <option value="mileage-low">Mileage: Lowest</option>
                    <option value="most-liked">Most Liked</option>
                  </select>
                </div>

                <div className="flex items-center justify-center sm:justify-end space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-green-600 text-white' 
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-green-600 text-white' 
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-600 mt-4 text-sm sm:text-base">Loading cars...</p>
              </div>
            ) : cars.length > 0 ? (
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'
                  : 'space-y-4 sm:space-y-6'
                }`}>
                {cars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    variant={viewMode}
                    className={viewMode === 'grid' ? 'h-full' : 'w-full'}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">Try adjusting your search criteria or browse all cars.</p>
                <Link
                  href="/cars"
                  className="inline-flex items-center rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
                >
                  Browse All Cars
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CarsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="cars" />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600"></div>
        </div>
      }>
        <CarsContent />
      </Suspense>
      <Footer />
    </div>
  )
}