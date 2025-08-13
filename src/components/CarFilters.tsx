'use client'

import React from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, ChevronDown, ChevronUp, Search, RotateCcw } from 'lucide-react'

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
  color: string
  engineSizeFrom: string
  engineSizeTo: string
  enginePowerFrom: string
  enginePowerTo: string
  batteryRange: string
  seatCount: string
  doors: string
  registrationCountry: string
  nctValid: boolean
  warrantyDuration: string
  totalOwners: string
  adType: string
}

interface CarFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  onSearch: () => void
  isOpen: boolean
  onToggle: () => void
  className?: string
}

const PRICE_OPTIONS = [
  { value: '1000', label: '€1,000' },
  { value: '2000', label: '€2,000' },
  { value: '5000', label: '€5,000' },
  { value: '7500', label: '€7,500' },
  { value: '10000', label: '€10,000' },
  { value: '15000', label: '€15,000' },
  { value: '20000', label: '€20,000' },
  { value: '25000', label: '€25,000' },
  { value: '30000', label: '€30,000' },
  { value: '40000', label: '€40,000' },
  { value: '50000', label: '€50,000' },
  { value: '75000', label: '€75,000' },
  { value: '100000', label: '€100,000' },
  { value: '150000', label: '€150,000' },
  { value: '200000', label: '€200,000' }
] as const

const YEAR_OPTIONS = Array.from({ length: 26 }, (_, i) => {
  const year = 2025 - i
  return { value: year.toString(), label: year.toString() }
})

const MILEAGE_OPTIONS = [
  { value: '5000', label: '5,000 km' },
  { value: '10000', label: '10,000 km' },
  { value: '20000', label: '20,000 km' },
  { value: '30000', label: '30,000 km' },
  { value: '50000', label: '50,000 km' },
  { value: '75000', label: '75,000 km' },
  { value: '100000', label: '100,000 km' },
  { value: '150000', label: '150,000 km' },
  { value: '200000', label: '200,000 km' },
  { value: '250000', label: '250,000 km' }
] as const

const BODY_TYPES = [
  { value: 'hatchback', label: 'Hatchback', icon: '🚗' },
  { value: 'saloon', label: 'Saloon', icon: '🚘' },
  { value: 'estate', label: 'Estate', icon: '🚐' },
  { value: 'suv', label: 'SUV', icon: '🚙' },
  { value: 'coupe', label: 'Coupe', icon: '🏎️' },
  { value: 'convertible', label: 'Convertible', icon: '🏎️' },
  { value: 'mpv', label: 'MPV', icon: '🚌' },
  { value: 'van', label: 'Van', icon: '🚚' },
  { value: 'pickup', label: 'Pickup', icon: '🛻' },
  { value: 'other', label: 'Other', icon: '🚗' }
] as const

const COLOR_OPTIONS = [
  { value: 'white', label: 'White', color: '#ffffff', border: '#e5e7eb' },
  { value: 'black', label: 'Black', color: '#000000', border: '#000000' },
  { value: 'silver', label: 'Silver', color: '#c0c0c0', border: '#9ca3af' },
  { value: 'grey', label: 'Grey', color: '#6b7280', border: '#6b7280' },
  { value: 'blue', label: 'Blue', color: '#3b82f6', border: '#3b82f6' },
  { value: 'red', label: 'Red', color: '#ef4444', border: '#ef4444' },
  { value: 'green', label: 'Green', color: '#10b981', border: '#10b981' },
  { value: 'yellow', label: 'Yellow', color: '#eab308', border: '#eab308' },
  { value: 'orange', label: 'Orange', color: '#f97316', border: '#f97316' },
  { value: 'brown', label: 'Brown', color: '#8b4513', border: '#8b4513' }
] as const

const ENGINE_SIZE_OPTIONS = [
  { value: '1.0', label: '1.0L' },
  { value: '1.2', label: '1.2L' },
  { value: '1.4', label: '1.4L' },
  { value: '1.6', label: '1.6L' },
  { value: '1.8', label: '1.8L' },
  { value: '2.0', label: '2.0L' },
  { value: '2.5', label: '2.5L' },
  { value: '3.0', label: '3.0L' },
  { value: '3.5', label: '3.5L' },
  { value: '4.0', label: '4.0L' },
  { value: '5.0', label: '5.0L+' }
] as const

const SEAT_OPTIONS = [
  { value: '2', label: '2 seats' },
  { value: '4', label: '4 seats' },
  { value: '5', label: '5 seats' },
  { value: '7', label: '7 seats' },
  { value: '8', label: '8+ seats' }
] as const

const DOOR_OPTIONS = [
  { value: '2', label: '2 doors' },
  { value: '3', label: '3 doors' },
  { value: '4', label: '4 doors' },
  { value: '5', label: '5 doors' }
] as const

const OWNER_OPTIONS = [
  { value: '1', label: '1 owner' },
  { value: '2', label: '2 owners' },
  { value: '3', label: '3 owners' },
  { value: '4', label: '4+ owners' }
] as const

const INITIAL_FILTERS: FilterState = {
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
  color: '',
  engineSizeFrom: '',
  engineSizeTo: '',
  enginePowerFrom: '',
  enginePowerTo: '',
  batteryRange: '',
  seatCount: '',
  doors: '',
  registrationCountry: '',
  nctValid: false,
  warrantyDuration: '',
  totalOwners: '',
  adType: 'for-sale'
}

const FilterSection = React.memo(({ title, isExpanded, onToggle, children }: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) => (
  <div className="border-b border-gray-200 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-gray-50"
    >
      <span className="font-medium text-gray-900">{title}</span>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </button>
    {isExpanded && (
      <div className="pb-4 px-1">
        {children}
      </div>
    )}
  </div>
))

FilterSection.displayName = 'FilterSection'

const Checkbox = React.memo(({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <label className="flex items-center space-x-2 py-1 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0"
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
))

Checkbox.displayName = 'Checkbox'

const Select = React.memo(({ value, onChange, options, placeholder }: {
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
  placeholder: string
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
  >
    <option value="">{placeholder}</option>
    {options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
))

Select.displayName = 'Select'

export default function CarFilters({ onFiltersChange, onSearch, isOpen, onToggle, className }: CarFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    seller: true,
    makeModel: true,
    year: true,
    price: true,
    mileage: true,
    location: true,
    fuel: true,
    transmission: true,
    body: true,
    color: false,
    engine: false,
    features: false,
    verifications: false
  })

  const [carData, setCarData] = useState<any>(null)
  const [locationData, setLocationData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [carModules, locationModules] = await Promise.all([
          import('@/data/car-makes-models'),
          import('@/data/irish-locations')
        ])
        setCarData(carModules)
        setLocationData(locationModules.IRISH_LOCATIONS)
      } catch (error) {
        console.error('Failed to load filter data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (isOpen && !carData && !locationData) {
      loadData()
    }
  }, [isOpen, carData, locationData])

  const availableModels = useMemo(() => {
    if (!carData || !filters.make) return []
    return carData.getModelsForMake(filters.make) || []
  }, [carData, filters.make])

  const availableAreas = useMemo(() => {
    if (!locationData || !filters.county) return []
    return locationData[filters.county] || []
  }, [locationData, filters.county])

  const allCarMakes = useMemo(() => {
    if (!carData) return []
    return carData.getAllCarMakes() || []
  }, [carData])

  const [updateTimer, setUpdateTimer] = useState<NodeJS.Timeout | null>(null)

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    
    if (updateTimer) {
      clearTimeout(updateTimer)
    }
    
    const timer = setTimeout(() => {
      setFilters(current => {
        onFiltersChange(current)
        return current
      })
    }, 300)
    
    setUpdateTimer(timer)
  }, [onFiltersChange, updateTimer])

  const toggleArrayFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
      const newFilters = { ...prev, [key]: newArray }
      
      setTimeout(() => onFiltersChange(newFilters), 0)
      
      return newFilters
    })
  }, [onFiltersChange])

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  const resetAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
    onFiltersChange(INITIAL_FILTERS)
  }, [onFiltersChange])

  useEffect(() => {
    return () => {
      if (updateTimer) {
        clearTimeout(updateTimer)
      }
    }
  }, [updateTimer])

  useEffect(() => {
    if (filters.make && !availableModels.includes(filters.model)) {
      updateFilter('model', '')
    }
  }, [filters.make, filters.model, availableModels, updateFilter])

  useEffect(() => {
    if (filters.county && !availableAreas.includes(filters.area)) {
      updateFilter('area', '')
    }
  }, [filters.county, filters.area, availableAreas, updateFilter])

  if (!isOpen) {
    return null
  }

  if (isLoading || !carData || !locationData) {
    return (
      <>
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onToggle} />
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-80 lg:w-full bg-white shadow-xl lg:shadow-none
          transform translate-x-0 lg:translate-x-0
          overflow-y-auto
          ${className}
        `}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={onToggle}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="px-4 py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Loading filters...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onToggle} />
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-80 lg:w-full bg-white shadow-xl lg:shadow-none
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out
        overflow-y-auto
        ${className}
      `}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={resetAllFilters}
                className="text-sm text-green-600 hover:text-green-700 flex items-center space-x-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All</span>
              </button>
              <button
                onClick={onToggle}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4">
          <div className="py-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search for specific car..."
              value={filters.searchText}
              onChange={(e) => updateFilter('searchText', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <FilterSection
            title="Seller type"
            isExpanded={expandedSections.seller}
            onToggle={() => toggleSection('seller')}
          >
            <div className="space-y-2">
              <Checkbox
                label="Dealership"
                checked={filters.sellerType.includes('dealership')}
                onChange={() => toggleArrayFilter('sellerType', 'dealership')}
              />
              <Checkbox
                label="Private seller"
                checked={filters.sellerType.includes('private')}
                onChange={() => toggleArrayFilter('sellerType', 'private')}
              />
            </div>
          </FilterSection>

          <FilterSection
            title="Make / Model"
            isExpanded={expandedSections.makeModel}
            onToggle={() => toggleSection('makeModel')}
          >
            <div className="space-y-3">
              <Select
                value={filters.make}
                onChange={(value) => updateFilter('make', value)}
                options={allCarMakes.map((make: string) => ({ value: make, label: `${make} (${carData.getModelsForMake(make).length})` }))}
                placeholder="All Makes"
              />
              <Select
                value={filters.model}
                onChange={(value) => updateFilter('model', value)}
                options={availableModels.map((model: string) => ({ value: model, label: model }))}
                placeholder={filters.make ? "All Models" : "Select Make First"}
              />
              {filters.make && (
                <p className="text-xs text-gray-500">
                  {availableModels.length} models available for {filters.make}
                </p>
              )}
            </div>
          </FilterSection>

          <FilterSection
            title="Year"
            isExpanded={expandedSections.year}
            onToggle={() => toggleSection('year')}
          >
            <div className="space-y-3">
              <Select
                value={filters.yearFrom}
                onChange={(value) => updateFilter('yearFrom', value)}
                options={YEAR_OPTIONS}
                placeholder="From"
              />
              <Select
                value={filters.yearTo}
                onChange={(value) => updateFilter('yearTo', value)}
                options={YEAR_OPTIONS}
                placeholder="To"
              />
            </div>
          </FilterSection>

          <FilterSection
            title="Price"
            isExpanded={expandedSections.price}
            onToggle={() => toggleSection('price')}
          >
            <div className="space-y-3">
              <Select
                value={filters.priceFrom}
                onChange={(value) => updateFilter('priceFrom', value)}
                options={PRICE_OPTIONS}
                placeholder="From"
              />
              <Select
                value={filters.priceTo}
                onChange={(value) => updateFilter('priceTo', value)}
                options={PRICE_OPTIONS}
                placeholder="To"
              />
            </div>
          </FilterSection>

          <FilterSection
            title="Location"
            isExpanded={expandedSections.location}
            onToggle={() => toggleSection('location')}
          >
            <div className="space-y-3">
              <Select
                value={filters.county}
                onChange={(value) => updateFilter('county', value)}
                options={Object.keys(locationData).sort().map((county: string) => ({ value: county, label: `${county} (${locationData[county]?.length || 0})` }))}
                placeholder="All Counties"
              />
              <Select
                value={filters.area}
                onChange={(value) => updateFilter('area', value)}
                options={availableAreas.map((area: string) => ({ value: area, label: area }))}
                placeholder={filters.county ? "All Areas" : "Select County First"}
              />
            </div>
          </FilterSection>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onSearch}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search Cars</span>
          </button>
        </div>
      </div>
    </>
  )
}