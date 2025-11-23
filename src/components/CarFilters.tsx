'use client'

import React from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

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
  isOpen: boolean
  onToggle: () => void
  className?: string
  initialFilters?: Partial<FilterState>
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
  { value: '200000', label: '€200,000' },
  { value: '250000', label: '€250,000' },
  { value: '300000', label: '€300,000' },
  { value: '350000', label: '€350,000' }
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
  { value: '250000', label: '250,000 km' },
  { value: '300000', label: '300,000 km' },
  { value: '350000', label: '350,000 km' },
  { value: '400000', label: '400,000 km' },
  { value: '450000', label: '450,000 km' },
  { value: '500000', label: '500,000 km' },
  { value: '550000', label: '550,000 km' }
] as const

const BODY_TYPES = [
  { value: 'HATCHBACK', label: 'Hatchback', icon: '🚗' },
  { value: 'SALOON', label: 'Saloon', icon: '🚘' },
  { value: 'ESTATE', label: 'Estate', icon: '🚐' },
  { value: 'SUV', label: 'SUV', icon: '🚙' },
  { value: 'COUPE', label: 'Coupe', icon: '🏎️' },
  { value: 'CONVERTIBLE', label: 'Convertible', icon: '🏎️' },
  { value: 'MPV', label: 'MPV', icon: '🚌' },
  { value: 'VAN', label: 'Van', icon: '🚚' },
  { value: 'PICKUP', label: 'Pickup', icon: '🛻' },
  { value: 'OTHER', label: 'Other', icon: '🚗' }
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

const FUEL_TYPES = [
  { value: 'PETROL', label: 'Petrol' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'PETROL_HYBRID', label: 'Petrol Hybrid' },
  { value: 'DIESEL_HYBRID', label: 'Diesel Hybrid' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'PLUGIN_HYBRID', label: 'Plug-in Hybrid' },
  { value: 'PETROL_PLUGIN_HYBRID', label: 'Petrol Plug-in Hybrid' },
  { value: 'DIESEL_PLUGIN_HYBRID', label: 'Diesel Plug-in Hybrid' }
] as const

const TRANSMISSION_TYPES = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'SEMI_AUTOMATIC', label: 'Semi-Automatic' }
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

export default function CarFilters({ 
  onFiltersChange, 
  isOpen, 
  onToggle, 
  className,
  initialFilters = {}
}: CarFiltersProps) {
  // Initialize filters with initial values
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...INITIAL_FILTERS,
    ...initialFilters
  }))
  
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

  // 🚀 PERFORMANCE: Debounce search text for better UX
  const debouncedSearchText = useDebounce(filters.searchText, 300)

  // 🚀 OPTIMIZATION: Create debounced filters object
  const debouncedFilters = useMemo(() => ({
    ...filters,
    searchText: debouncedSearchText
  }), [filters, debouncedSearchText])

  // 🚀 SMART CACHING: Load data only when needed
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load data in parallel for better performance
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

  // 🚀 MEMOIZED: Available models based on selected make
  const availableModels = useMemo(() => {
    if (!carData || !filters.make) return []
    return carData.getModelsForMake(filters.make) || []
  }, [carData, filters.make])

  // 🚀 MEMOIZED: Available areas based on selected county
  const availableAreas = useMemo(() => {
    if (!locationData || !filters.county) return []
    return locationData[filters.county] || []
  }, [locationData, filters.county])

  // 🚀 MEMOIZED: All car makes
  const allCarMakes = useMemo(() => {
    if (!carData) return []
    return carData.getAllCarMakes() || []
  }, [carData])

  // 🚀 OPTIMIZED: Trigger filter changes only when debounced filters change
  useEffect(() => {
    onFiltersChange(debouncedFilters)
  }, [debouncedFilters, onFiltersChange])

  // 🚀 IMMEDIATE: Update filter function with optimistic updates
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    console.log(`🔧 Filter changed: ${key} = ${value}`)
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  // 🚀 ARRAY FILTERS: Optimized array toggle function
  const toggleArrayFilter = useCallback((key: keyof FilterState, value: string) => {
    console.log(`🔧 Array filter toggled: ${key} toggle ${value}`)
    setFilters(prev => {
      const currentArray = prev[key] as string[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
      
      return {
        ...prev,
        [key]: newArray
      }
    })
  }, [])

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  const resetAllFilters = useCallback(() => {
    console.log('🔄 Resetting all filters')
    setFilters(INITIAL_FILTERS)
  }, [])

  // Smart dependency management
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
          {/* 🚀 DEBOUNCED: Search input with performance optimization */}
          <div className="py-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search for specific car..."
              value={filters.searchText}
              onChange={(e) => updateFilter('searchText', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            {filters.searchText !== debouncedSearchText && (
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                Searching...
              </div>
            )}
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
                options={allCarMakes.map((make: string) => ({ 
                  value: make, 
                  label: `${make} (${carData.getModelsForMake(make).length})` 
                }))}
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
            title="Mileage"
            isExpanded={expandedSections.mileage}
            onToggle={() => toggleSection('mileage')}
          >
            <div className="space-y-3">
              <Select
                value={filters.mileageFrom}
                onChange={(value) => updateFilter('mileageFrom', value)}
                options={MILEAGE_OPTIONS}
                placeholder="From"
              />
              <Select
                value={filters.mileageTo}
                onChange={(value) => updateFilter('mileageTo', value)}
                options={MILEAGE_OPTIONS}
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
                options={Object.keys(locationData).sort().map((county: string) => ({ 
                  value: county, 
                  label: `${county} (${locationData[county]?.length || 0})` 
                }))}
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

          <FilterSection
            title="Fuel Type"
            isExpanded={expandedSections.fuel}
            onToggle={() => toggleSection('fuel')}
          >
            <div className="space-y-2">
              {FUEL_TYPES.map(fuel => (
                <Checkbox
                  key={fuel.value}
                  label={fuel.label}
                  checked={filters.fuelType.includes(fuel.value)}
                  onChange={() => toggleArrayFilter('fuelType', fuel.value)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Transmission"
            isExpanded={expandedSections.transmission}
            onToggle={() => toggleSection('transmission')}
          >
            <div className="space-y-2">
              {TRANSMISSION_TYPES.map(trans => (
                <Checkbox
                  key={trans.value}
                  label={trans.label}
                  checked={filters.transmission.includes(trans.value)}
                  onChange={() => toggleArrayFilter('transmission', trans.value)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Body Type"
            isExpanded={expandedSections.body}
            onToggle={() => toggleSection('body')}
          >
            <div className="grid grid-cols-2 gap-2">
              {BODY_TYPES.map(body => (
                <label
                  key={body.value}
                  className={`
                    flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all
                    ${filters.bodyType.includes(body.value)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={filters.bodyType.includes(body.value)}
                    onChange={() => toggleArrayFilter('bodyType', body.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-1">{body.icon}</span>
                  <span className="text-xs text-center">{body.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Color"
            isExpanded={expandedSections.color}
            onToggle={() => toggleSection('color')}
          >
            <div className="grid grid-cols-5 gap-2">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color.value}
                  onClick={() => updateFilter('color', filters.color === color.value ? '' : color.value)}
                  className={`
                    w-12 h-12 rounded-full border-2 relative
                    ${filters.color === color.value 
                      ? 'ring-2 ring-green-500 ring-offset-2' 
                      : 'hover:ring-2 hover:ring-gray-300'
                    }
                  `}
                  style={{ 
                    backgroundColor: color.color,
                    borderColor: color.border
                  }}
                  title={color.label}
                >
                  {filters.color === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${color.value === 'white' || color.value === 'yellow' ? 'bg-gray-800' : 'bg-white'}`} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Features"
            isExpanded={expandedSections.features}
            onToggle={() => toggleSection('features')}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={filters.seatCount}
                  onChange={(value) => updateFilter('seatCount', value)}
                  options={SEAT_OPTIONS}
                  placeholder="Seats"
                />
                <Select
                  value={filters.doors}
                  onChange={(value) => updateFilter('doors', value)}
                  options={DOOR_OPTIONS}
                  placeholder="Doors"
                />
              </div>
              
              <Checkbox
                label="Valid NCT"
                checked={filters.nctValid}
                onChange={(checked) => updateFilter('nctValid', checked)}
              />
            </div>
          </FilterSection>
        </div>

        {/* 🚀 REMOVED: No search button needed - auto-search active */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="text-center text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-search active</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}