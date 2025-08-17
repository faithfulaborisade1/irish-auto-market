'use client'

import Link from 'next/link'
import { Search, Grid, List, ArrowLeft, Filter, X, Loader2 } from 'lucide-react'
import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CarFilters from '@/components/CarFilters'
import CarCard from '@/components/CarCard'
import { useCarSearch } from '@/hooks/useCarSearch'
import type { Car, CarSearchFilters } from '@/types/car'

function CarsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  
  // 🚀 FIXED: Memoize initial filters to prevent re-initialization
  const initialFilters = useMemo(() => {
    const params = Object.fromEntries(searchParams.entries())
    
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
    
    return {
      searchText: params.q || '',
      make: params.make || '',
      model: params.model || '',
      priceFrom,
      priceTo,
      yearFrom,
      yearTo,
      county: params.county || '',
      area: params.area || '',
      mileageFrom: params.mileageFrom || '',
      mileageTo: params.mileageTo || '',
      color: params.color || '',
      doors: params.doors || '',
      seatCount: params.seats || '',
      nctValid: params.nctValid === 'true',
      fuelType: params.fuelType ? params.fuelType.split(',') : [],
      transmission: params.transmission ? params.transmission.split(',') : [],
      bodyType: params.bodyType ? params.bodyType.split(',') : [],
      sellerType: params.sellerType ? params.sellerType.split(',') : [],
      sortBy
    }
  }, [searchParams, sortBy])

  // 🚀 FIXED: Use stable filter state
  const [filters, setFilters] = useState<CarSearchFilters>(initialFilters)

  // 🚀 FIXED: Only update filters when URL actually changes
  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  // 🚀 REACT QUERY: Use optimized car search hook
  const { 
    data: searchResponse, 
    isLoading, 
    isError, 
    error,
    isFetching,
    isStale 
  } = useCarSearch(filters)

  const cars: Car[] = searchResponse?.cars || []

  // 🚀 OPTIMIZATION: Memoize URL update function to prevent recreations
  const updateURL = useCallback((newFilters: CarSearchFilters) => {
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
    if (newFilters.mileageFrom) params.set('mileageFrom', newFilters.mileageFrom)
    if (newFilters.mileageTo) params.set('mileageTo', newFilters.mileageTo)
    if (newFilters.color) params.set('color', newFilters.color)
    if (newFilters.doors) params.set('doors', newFilters.doors)
    if (newFilters.seatCount) params.set('seats', newFilters.seatCount)
    if (newFilters.nctValid) params.set('nctValid', 'true')
    if (newFilters.fuelType.length > 0) params.set('fuelType', newFilters.fuelType.join(','))
    if (newFilters.transmission.length > 0) params.set('transmission', newFilters.transmission.join(','))
    if (newFilters.bodyType.length > 0) params.set('bodyType', newFilters.bodyType.join(','))
    if (newFilters.sellerType.length > 0) params.set('sellerType', newFilters.sellerType.join(','))
    
    const newURL = `/cars?${params.toString()}`
    router.push(newURL, { scroll: false })
  }, [router])

  // 🚀 FIXED: Stable filter change handler without URL update during render
  const handleFiltersChange = useCallback((newFilters: Partial<CarSearchFilters>) => {
    console.log('🔧 Filters changed:', newFilters)
    
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters }
      return updatedFilters
    })
  }, [])

  // 🚀 FIXED: Update URL in effect, not during render
  useEffect(() => {
    // Skip URL update on initial mount
    const isInitialMount = JSON.stringify(filters) === JSON.stringify(initialFilters)
    if (!isInitialMount) {
      updateURL(filters)
    }
  }, [filters, updateURL, initialFilters])

  // 🚀 FIXED: Stable sort change handler
  const handleSortChange = useCallback((newSort: string) => {
    setSortBy(newSort)
    setFilters(prev => ({ ...prev, sortBy: newSort }))
  }, [])

  // 🚀 OPTIMIZED: Memoize computed values
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.searchText) count++
    if (filters.make) count++
    if (filters.model) count++
    if (filters.priceFrom || filters.priceTo) count++
    if (filters.yearFrom || filters.yearTo) count++
    if (filters.mileageFrom || filters.mileageTo) count++
    if (filters.county) count++
    if (filters.area) count++
    if (filters.color) count++
    if (filters.doors) count++
    if (filters.seatCount) count++
    if (filters.nctValid) count++
    count += filters.fuelType.length
    count += filters.transmission.length
    count += filters.bodyType.length
    count += filters.sellerType.length
    return count
  }, [filters])

  const searchDescription = useMemo(() => {
    const terms = []
    if (filters.searchText) terms.push(`"${filters.searchText}"`)
    if (filters.make) terms.push(filters.make)
    if (filters.model) terms.push(filters.model)
    if (filters.county) terms.push(filters.county)
    
    if (terms.length > 0) {
      return `Search results for ${terms.join(', ')}`
    }
    return 'All Cars'
  }, [filters.searchText, filters.make, filters.model, filters.county])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="w-80 h-screen sticky top-0 overflow-y-auto">
            <CarFilters
              onFiltersChange={handleFiltersChange}
              isOpen={true}
              onToggle={() => {}}
              className="h-full"
              initialFilters={filters}
            />
          </div>
        </div>

        {/* Mobile Filters Overlay */}
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
                isOpen={true}
                onToggle={() => setFiltersOpen(!filtersOpen)}
                className="h-full overflow-y-auto"
                initialFilters={filters}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="max-w-none px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Back Button */}
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-green-600 hover:text-green-700 mb-2 sm:mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">Back</span>
              </button>
            </div>

            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {searchDescription}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm sm:text-base text-gray-600 mt-1">
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <>
                        <span>{cars.length} car{cars.length !== 1 ? 's' : ''} found</span>
                        {isFetching && !isLoading && (
                          <div className="flex items-center text-green-600">
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            <span className="text-xs">Updating...</span>
                          </div>
                        )}
                      </>
                    )}
                    {activeFilterCount > 0 && (
                      <span className="text-green-600">
                        ({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied)
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href="/"
                  className="flex items-center text-green-600 hover:text-green-700 transition-colors whitespace-nowrap"
                >
                  <Search className="w-4 h-4 mr-2" />
                  <span className="text-sm sm:text-base">New Search</span>
                </Link>
              </div>

              {/* Controls Bar */}
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
                    {activeFilterCount > 0 && (
                      <span className="ml-1 bg-green-600 text-white text-xs rounded-full px-2 py-1">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
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

                {/* View Mode Toggle */}
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

            {/* Results */}
            {isError ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <X className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
                  <p className="text-gray-600 text-sm sm:text-base px-4">
                    {error?.message || 'Failed to search cars. Please try again.'}
                  </p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="animate-spin h-10 w-10 sm:h-12 sm:w-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 text-sm sm:text-base">Finding the perfect cars for you...</p>
              </div>
            ) : cars.length > 0 ? (
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'
                  : 'space-y-4 sm:space-y-6'
                }`}>
                {cars.map((car: Car) => (
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
                <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
                  Try adjusting your search criteria or browse all cars.
                </p>
                <Link
                  href="/cars"
                  className="inline-flex items-center rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
                >
                  Browse All Cars
                </Link>
              </div>
            )}

            {/* 🚀 PERFORMANCE INDICATOR */}
            {searchResponse && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {isFetching ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      <span>Updating results...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Search completed in {isStale ? 'cache' : 'real-time'}</span>
                    </>
                  )}
                </div>
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
          <div className="text-center">
            <Loader2 className="animate-spin h-10 w-10 sm:h-12 sm:w-12 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading search interface...</p>
          </div>
        </div>
      }>
        <CarsContent />
      </Suspense>
      <Footer />
    </div>
  )
}