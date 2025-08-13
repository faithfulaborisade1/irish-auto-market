// types/car.ts - Centralized car type definitions
export interface Car {
  id: string
  title: string
  make: string
  model: string
  year: number
  price: number
  mileage?: number | null  // ✅ Fixed: Allow null values from database
  fuelType?: string | null
  transmission?: string | null
  bodyType?: string | null
  color?: string | null
  description?: string | null
  location: any
  featured: boolean
  views: number
  inquiries: number
  likesCount: number
  isLiked: boolean
  slug?: string
  images: Array<{ id: string; url: string; alt: string }>
  seller: {
    name: string
    type: string
    phone: string
    verified: boolean
  }
  // Optional fields that might be present
  savedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface CarSearchFilters {
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
  fuelType: string[]
  transmission: string[]
  bodyType: string[]
  color: string
  doors: string
  seatCount: string
  nctValid: boolean
  sortBy: string
}

export interface CarSearchResponse {
  success: boolean
  cars: Car[]
  total: number
  filters_applied: Record<string, any>
  timestamp: string
}

// For components that need to display car data
export interface CarDisplayProps {
  car: Car
  variant?: 'grid' | 'list'
  className?: string
}