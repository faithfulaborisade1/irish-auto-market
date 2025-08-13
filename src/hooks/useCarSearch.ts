// hooks/useCarSearch.ts - Updated with correct types
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useDebounce } from './useDebounce'
import type { Car, CarSearchFilters, CarSearchResponse } from '@/types/car'

// Build search params optimized for your Prisma API
const buildSearchParams = (filters: CarSearchFilters): URLSearchParams => {
  const params = new URLSearchParams()
  
  // Basic text filters
  if (filters.searchText?.trim()) params.set('q', filters.searchText.trim())
  if (filters.make) params.set('make', filters.make)
  if (filters.model) params.set('model', filters.model)
  if (filters.county) params.set('county', filters.county)
  if (filters.area) params.set('area', filters.area)
  
  // Price range (matches your API format)
  if (filters.priceFrom || filters.priceTo) {
    const minPrice = filters.priceFrom || '0'
    const maxPrice = filters.priceTo || '1000000'
    params.set('priceRange', `${minPrice}-${maxPrice}`)
  }
  
  // Year range (matches your API format)
  if (filters.yearFrom || filters.yearTo) {
    const minYear = filters.yearFrom || '1900'
    const maxYear = filters.yearTo || '2025'
    params.set('year', `${minYear}-${maxYear}`)
  }
  
  // Mileage range
  if (filters.mileageFrom) params.set('mileageFrom', filters.mileageFrom)
  if (filters.mileageTo) params.set('mileageTo', filters.mileageTo)
  
  // Single value filters
  if (filters.color) params.set('color', filters.color)
  if (filters.doors) params.set('doors', filters.doors)
  if (filters.seatCount) params.set('seats', filters.seatCount)
  if (filters.nctValid) params.set('nctValid', 'true')
  
  // Array filters (comma-separated as your API expects)
  if (filters.fuelType.length > 0) params.set('fuelType', filters.fuelType.join(','))
  if (filters.transmission.length > 0) params.set('transmission', filters.transmission.join(','))
  if (filters.bodyType.length > 0) params.set('bodyType', filters.bodyType.join(','))
  if (filters.sellerType.length > 0) params.set('sellerType', filters.sellerType.join(','))
  
  // Sort
  params.set('sort', filters.sortBy)
  
  return params
}

// Primary car search hook
export const useCarSearch = (filters: CarSearchFilters) => {
  // Debounce search text input for better performance
  const debouncedSearchText = useDebounce(filters.searchText, 300)
  
  // Create debounced filters object
  const debouncedFilters = useMemo(() => ({
    ...filters,
    searchText: debouncedSearchText
  }), [filters, debouncedSearchText])
  
  // Create unique query key based on filters
  const queryKey = useMemo(() => {
    const params = buildSearchParams(debouncedFilters)
    return ['cars', 'search', params.toString()]
  }, [debouncedFilters])
  
  // Fetch function
  const fetchCars = useCallback(async (): Promise<CarSearchResponse> => {
    const params = buildSearchParams(debouncedFilters)
    const response = await fetch(`/api/cars?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // ✅ FIXED: Transform data to handle null values
    if (data.success && data.cars) {
      data.cars = data.cars.map((car: any) => ({
        ...car,
        // Convert null to undefined for better TypeScript compatibility
        mileage: car.mileage === null ? undefined : car.mileage,
        fuelType: car.fuelType === null ? undefined : car.fuelType,
        transmission: car.transmission === null ? undefined : car.transmission,
        bodyType: car.bodyType === null ? undefined : car.bodyType,
        color: car.color === null ? undefined : car.color,
        description: car.description === null ? undefined : car.description,
      }))
    }
    
    return data
  }, [debouncedFilters])
  
  // React Query with smart caching
  return useQuery({
    queryKey,
    queryFn: fetchCars,
    enabled: true, // Always enabled for instant search
    staleTime: 1000 * 60 * 2, // 2 minutes - good for car search
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on user input errors
      if (error?.message?.includes('400')) return false
      return failureCount < 2
    },
  })
}

// Optimistic filter counting hook
export const useFilterCounts = (baseFilters: Omit<CarSearchFilters, 'make'>) => {
  return useQuery({
    queryKey: ['filter-counts', baseFilters],
    queryFn: async () => {
      // This could call a dedicated endpoint for filter counts
      // For now, we'll use the main search endpoint
      const response = await fetch(`/api/cars/counts?${buildSearchParams(baseFilters as CarSearchFilters)}`)
      if (!response.ok) throw new Error('Failed to fetch filter counts')
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes for counts
    enabled: false, // Enable when needed for advanced filtering
  })
}

// Car details hook with optimistic updates from search cache
export const useCarDetails = (carId: string) => {
  const queryClient = useQueryClient()
  
  return useQuery({
    queryKey: ['cars', 'details', carId],
    queryFn: async () => {
      const response = await fetch(`/api/cars/${carId}`)
      if (!response.ok) throw new Error('Failed to fetch car details')
      return response.json()
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for car details
    initialData: () => {
      // Try to get car from search cache first (optimistic loading)
      const searchQueries = queryClient.getQueriesData({ queryKey: ['cars', 'search'] })
      for (const [, data] of searchQueries) {
        const searchData = data as CarSearchResponse | undefined
        if (searchData?.cars) {
          const car = searchData.cars.find(c => c.id === carId)
          if (car) return { success: true, car }
        }
      }
      return undefined
    },
  })
}

// Featured cars hook
export const useFeaturedCars = () => {
  return useQuery({
    queryKey: ['cars', 'featured'],
    queryFn: async () => {
      const response = await fetch('/api/cars?featured=true&sort=newest')
      if (!response.ok) throw new Error('Failed to fetch featured cars')
      return response.json()
    },
    staleTime: 1000 * 60 * 15, // 15 minutes for featured cars
  })
}

// Car suggestions hook (for autocomplete)
export const useCarSuggestions = (query: string) => {
  const debouncedQuery = useDebounce(query, 200)
  
  return useQuery({
    queryKey: ['cars', 'suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return { suggestions: [] }
      
      const response = await fetch(`/api/cars/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
      if (!response.ok) throw new Error('Failed to fetch suggestions')
      return response.json()
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes for suggestions
  })
}