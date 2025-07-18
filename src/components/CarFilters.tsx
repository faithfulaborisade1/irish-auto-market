'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, ChevronDown, ChevronUp, Search, RotateCcw } from 'lucide-react'
import { CAR_MAKES_MODELS, getAllCarMakes, getModelsForMake } from '@/data/car-makes-models'
import { IRISH_LOCATIONS } from '@/data/irish-locations'

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
  
  // Location
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

interface CarFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  onSearch: () => void
  isOpen: boolean
  onToggle: () => void
  className?: string
}

// ✅ FIXED: Move constants outside component to prevent re-creation
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
  { value: '100000', label: '€100,000' }
]

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
  { value: '200000', label: '200,000 km' }
]

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
}

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
    battery: false,
    features: false,
    verifications: false
  })

  // ✅ FIXED: Use useMemo to prevent recalculation on every render
  const availableModels = useMemo(() => {
    return filters.make ? getModelsForMake(filters.make) : []
  }, [filters.make])

  const availableAreas = useMemo(() => {
    return filters.county ? IRISH_LOCATIONS[filters.county as keyof typeof IRISH_LOCATIONS] || [] : []
  }, [filters.county])

  // ✅ FIXED: Use useCallback for stable function references
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleArrayFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
      return { ...prev, [key]: newArray }
    })
  }, [])

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  const resetAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
  }, [])

  // ✅ FIXED: Reset model when make changes (with proper dependencies)
  useEffect(() => {
    if (filters.make && !availableModels.includes(filters.model)) {
      updateFilter('model', '')
    }
  }, [filters.make, filters.model, availableModels, updateFilter])

  // ✅ FIXED: Reset area when county changes (with proper dependencies)
  useEffect(() => {
    if (filters.county && !availableAreas.includes(filters.area)) {
      updateFilter('area', '')
    }
  }, [filters.county, filters.area, availableAreas, updateFilter])

  // ✅ FIXED: Notify parent of filter changes with useCallback
  const notifyFiltersChange = useCallback(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  useEffect(() => {
    notifyFiltersChange()
  }, [notifyFiltersChange])

  // ✅ FIXED: Stable component definitions
  const FilterSection = useCallback(({ title, isExpanded, onToggle, children }: {
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
  ), [])

  const Checkbox = useCallback(({ label, checked, onChange }: {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
  }) => (
    <label className="flex items-center space-x-2 py-1 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  ), [])

  const Select = useCallback(({ value, onChange, options, placeholder }: {
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder: string
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
    >
      <option value="">{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ), [])

  // Mobile overlay
  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Mobile overlay */}
      <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onToggle} />
      
      {/* Filter sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-80 lg:w-full bg-white shadow-xl lg:shadow-none
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out
        overflow-y-auto
        ${className}
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={resetAllFilters}
                className="text-sm text-primary hover:text-primary/80 flex items-center space-x-1"
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

        {/* Filter content */}
        <div className="px-4">
          {/* Search */}
          <div className="py-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search for specific car..."
              value={filters.searchText}
              onChange={(e) => updateFilter('searchText', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Seller Type */}
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

          {/* Make / Model */}
          <FilterSection
            title="Make / Model"
            isExpanded={expandedSections.makeModel}
            onToggle={() => toggleSection('makeModel')}
          >
            <div className="space-y-3">
              <Select
                value={filters.make}
                onChange={(value) => updateFilter('make', value)}
                options={getAllCarMakes().map(make => ({ 
                  value: make, 
                  label: `${make} (${getModelsForMake(make).length})` 
                }))}
                placeholder="All Makes"
              />
              <Select
                value={filters.model}
                onChange={(value) => updateFilter('model', value)}
                options={availableModels.map(model => ({ value: model, label: model }))}
                placeholder={filters.make ? "All Models" : "Select Make First"}
              />
              {filters.make && (
                <p className="text-xs text-gray-500">
                  {availableModels.length} models available for {filters.make}
                </p>
              )}
            </div>
          </FilterSection>

          {/* Year */}
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

          {/* Price */}
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

          {/* Location */}
          <FilterSection
            title="Location"
            isExpanded={expandedSections.location}
            onToggle={() => toggleSection('location')}
          >
            <div className="space-y-3">
              <Select
                value={filters.county}
                onChange={(value) => updateFilter('county', value)}
                options={Object.keys(IRISH_LOCATIONS).sort().map(county => ({ 
                  value: county, 
                  label: `${county} (${IRISH_LOCATIONS[county as keyof typeof IRISH_LOCATIONS]?.length || 0})` 
                }))}
                placeholder="All Counties"
              />
              <Select
                value={filters.area}
                onChange={(value) => updateFilter('area', value)}
                options={availableAreas.map(area => ({ value: area, label: area }))}
                placeholder={filters.county ? "All Areas" : "Select County First"}
              />
              {filters.county && (
                <p className="text-xs text-gray-500">
                  {availableAreas.length} areas available in {filters.county}
                </p>
              )}
            </div>
          </FilterSection>

          {/* Fuel type */}
          <FilterSection
            title="Fuel type"
            isExpanded={expandedSections.fuel}
            onToggle={() => toggleSection('fuel')}
          >
            <div className="space-y-2">
              {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(fuel => (
                <Checkbox
                  key={fuel}
                  label={fuel}
                  checked={filters.fuelType.includes(fuel.toLowerCase())}
                  onChange={() => toggleArrayFilter('fuelType', fuel.toLowerCase())}
                />
              ))}
            </div>
          </FilterSection>

          {/* Transmission */}
          <FilterSection
            title="Transmission"
            isExpanded={expandedSections.transmission}
            onToggle={() => toggleSection('transmission')}
          >
            <div className="space-y-2">
              {['Manual', 'Automatic'].map(trans => (
                <Checkbox
                  key={trans}
                  label={trans}
                  checked={filters.transmission.includes(trans.toLowerCase())}
                  onChange={() => toggleArrayFilter('transmission', trans.toLowerCase())}
                />
              ))}
            </div>
          </FilterSection>

          {/* Body type */}
          <FilterSection
            title="Body type"
            isExpanded={expandedSections.body}
            onToggle={() => toggleSection('body')}
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'suv', label: 'SUV', icon: '🚙' },
                { value: 'hatchback', label: 'Hatchback', icon: '🚗' },
                { value: 'saloon', label: 'Saloon', icon: '🚘' },
                { value: 'estate', label: 'Estate', icon: '🚐' },
                { value: 'coupe', label: 'Coupe', icon: '🏎️' },
                { value: 'convertible', label: 'Convertible', icon: '🏎️' }
              ].map(bodyType => (
                <label key={bodyType.value} className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.bodyType.includes(bodyType.value)}
                    onChange={() => toggleArrayFilter('bodyType', bodyType.value)}
                    className="sr-only"
                  />
                  <div className={`
                    border-2 rounded-lg p-3 text-center transition-colors
                    ${filters.bodyType.includes(bodyType.value)
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}>
                    <div className="text-2xl mb-1">{bodyType.icon}</div>
                    <div className="text-xs font-medium">{bodyType.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Additional sections abbreviated for space... */}
          
        </div>

        {/* Search button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onSearch}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search Cars</span>
          </button>
        </div>
      </div>
    </>
  )
}