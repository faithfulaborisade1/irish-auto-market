'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Car, Users, Star, MapPin, Search, CheckCircle, Clock, FileText, MapPin as LocationIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FavoriteButton from '@/components/FavoriteButton'
import PromotionalRibbon from '@/components/PromotionalRibbon'
import LoanittFinanceButton from '@/components/LoanittFinanceButton'
import { CAR_MAKES_MODELS, getAllCarMakes, getModelsForMake } from '@/data/car-makes-models'
import { IRISH_LOCATIONS } from '@/data/irish-locations'

// Price ranges for dropdown
const PRICE_RANGES = [
  { value: '1000', label: '€1,000' },
  { value: '2000', label: '€2,000' },
  { value: '3000', label: '€3,000' },
  { value: '4000', label: '€4,000' },
  { value: '5000', label: '€5,000' },
  { value: '7500', label: '€7,500' },
  { value: '10000', label: '€10,000' },
  { value: '12500', label: '€12,500' },
  { value: '15000', label: '€15,000' },
  { value: '17500', label: '€17,500' },
  { value: '20000', label: '€20,000' },
  { value: '25000', label: '€25,000' },
  { value: '30000', label: '€30,000' },
  { value: '35000', label: '€35,000' },
  { value: '40000', label: '€40,000' },
  { value: '45000', label: '€45,000' },
  { value: '50000', label: '€50,000' },
  { value: '60000', label: '€60,000' },
  { value: '70000', label: '€70,000' },
  { value: '80000', label: '€80,000' },
  { value: '90000', label: '€90,000' },
  { value: '100000', label: '€100,000' },
  { value: '125000', label: '€125,000' },
  { value: '150000', label: '€150,000' },
  { value: '200000', label: '€200,000' },
  { value: '250000', label: '€250,000' }
]

// Year ranges for dropdown
const YEAR_OPTIONS: { value: string; label: string }[] = []
for (let year = 2025; year >= 2000; year--) {
  YEAR_OPTIONS.push({ value: year.toString(), label: year.toString() })
}

export default function HomePage() {
  const router = useRouter()
  const [cars, setCars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [carCount, setCarCount] = useState<number | null>(null)
  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    make: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
    county: '',
    area: ''
  })

  // Available models based on selected make
  const availableModels = searchFilters.make ? getModelsForMake(searchFilters.make) : []
  
  // Available areas based on selected county
  const availableAreas = searchFilters.county ? IRISH_LOCATIONS[searchFilters.county as keyof typeof IRISH_LOCATIONS] || [] : []

  // Fetch cars and count on client side only
 // Replace the existing useEffect in your HomePage component with this:

useEffect(() => {
  async function fetchData() {
    try {
      // Fetch count first (fast query, updates search button immediately)
      const countResponse = await fetch('/api/cars/count')
      const countData = await countResponse.json()
      if (countData.success) {
        setCarCount(countData.count)
      }
      
      // Then fetch cars for display
      const carsResponse = await fetch('/api/cars')
      const carsData = await carsResponse.json()
      if (carsData.success) {
        setCars(carsData.cars)
        // Only use cars length as fallback if count API failed
        if (!countData.success || countData.count === 0) {
          console.log('Using cars array length as fallback count:', carsData.cars.length)
          setCarCount(carsData.cars.length)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [])

  // Reset model when make changes
  useEffect(() => {
    if (searchFilters.make) {
      setSearchFilters(prev => ({ ...prev, model: '' }))
    }
  }, [searchFilters.make])

  // Reset area when county changes
  useEffect(() => {
    if (searchFilters.county) {
      setSearchFilters(prev => ({ ...prev, area: '' }))
    }
  }, [searchFilters.county])

  const featuredCars = cars.filter((car: any) => car.featured)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    
    // Basic filters
    if (searchFilters.searchText) params.set('q', searchFilters.searchText)
    if (searchFilters.make) params.set('make', searchFilters.make)
    if (searchFilters.model) params.set('model', searchFilters.model)
    if (searchFilters.county) params.set('county', searchFilters.county)
    if (searchFilters.area) params.set('area', searchFilters.area)
    
    // Send price as range string instead of separate min/max
    if (searchFilters.minPrice || searchFilters.maxPrice) {
      const minPrice = searchFilters.minPrice || '0'
      const maxPrice = searchFilters.maxPrice || '1000000'
      params.set('priceRange', `${minPrice}-${maxPrice}`)
    }
    
    // Send year as range string instead of separate min/max
    if (searchFilters.minYear || searchFilters.maxYear) {
      const minYear = searchFilters.minYear || '1900'
      const maxYear = searchFilters.maxYear || '2025'
      params.set('year', `${minYear}-${maxYear}`)
    }

    // Add auto-search parameter so cars page knows to search immediately
    params.set('autoSearch', 'true')
    
    console.log('🔍 Homepage search params:', params.toString())
    
    router.push(`/cars?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Shared Header */}
      <Header currentPage="home" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-gray-700 py-20 pt-16 md:pt-20">
        {/* Promotional Ribbon */}
        <PromotionalRibbon />
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=500&fit=crop"
            alt="Cars background"
            fill
            className="object-cover opacity-30"
          />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl">
              Find Your Perfect Car
            </h1>
            <p className="mb-8 text-xl text-gray-200">
              Ireland's premier marketplace for quality used cars
            </p>

            <form onSubmit={handleSearch} className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  What car are you looking for?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder=" "
                    value={searchFilters.searchText}
                    onChange={(e) => setSearchFilters({...searchFilters, searchText: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 p-3 pr-10 text-base focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-3 text-sm font-medium text-gray-700">Refine your search</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {/* Make Dropdown */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Make</label>
                    <select 
                      value={searchFilters.make}
                      onChange={(e) => setSearchFilters({...searchFilters, make: e.target.value})}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">Any Make</option>
                      {getAllCarMakes().map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>

                  {/* Model Dropdown */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Model</label>
                    <select 
                      value={searchFilters.model}
                      onChange={(e) => setSearchFilters({...searchFilters, model: e.target.value})}
                      disabled={!searchFilters.make}
                      className={`w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 ${
                        !searchFilters.make ? 'bg-gray-50 cursor-not-allowed text-gray-400' : ''
                      }`}
                    >
                      <option value="">
                        {searchFilters.make ? 'Any Model' : 'Select Make First'}
                      </option>
                      {availableModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  {/* County Dropdown */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">County</label>
                    <select 
                      value={searchFilters.county}
                      onChange={(e) => setSearchFilters({...searchFilters, county: e.target.value})}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">Any County</option>
                      {Object.keys(IRISH_LOCATIONS).sort().map(county => (
                        <option key={county} value={county}>{county}</option>
                      ))}
                    </select>
                  </div>

                  {/* Area Dropdown */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Area</label>
                    <select 
                      value={searchFilters.area}
                      onChange={(e) => setSearchFilters({...searchFilters, area: e.target.value})}
                      disabled={!searchFilters.county}
                      className={`w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 ${
                        !searchFilters.county ? 'bg-gray-50 cursor-not-allowed text-gray-400' : ''
                      }`}
                    >
                      <option value="">
                        {searchFilters.county ? 'Any Area' : 'Select County First'}
                      </option>
                      {availableAreas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  {/* Min Price */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Min Price</label>
                    <select 
                      value={searchFilters.minPrice}
                      onChange={(e) => setSearchFilters({...searchFilters, minPrice: e.target.value})}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">No Min</option>
                      {PRICE_RANGES.map(price => (
                        <option key={price.value} value={price.value}>{price.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Max Price */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Max Price</label>
                    <select 
                      value={searchFilters.maxPrice}
                      onChange={(e) => setSearchFilters({...searchFilters, maxPrice: e.target.value})}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">No Max</option>
                      {PRICE_RANGES.map(price => (
                        <option key={price.value} value={price.value}>{price.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Min Year */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Min Year</label>
                    <select 
                      value={searchFilters.minYear}
                      onChange={(e) => setSearchFilters({...searchFilters, minYear: e.target.value})}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">No Min</option>
                      {YEAR_OPTIONS.map(year => (
                        <option key={year.value} value={year.value}>{year.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Max Year */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Max Year</label>
                    <select 
                      value={searchFilters.maxYear}
                      onChange={(e) => setSearchFilters({...searchFilters, maxYear: e.target.value})}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">No Max</option>
                      {YEAR_OPTIONS.map(year => (
                        <option key={year.value} value={year.value}>{year.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-bold text-white hover:bg-primary/90 transition-colors"
              >
                <Search className="mr-2 h-4 w-4" />
                SEARCH {carCount?.toLocaleString() || '0'} CARS
              </button>

              {/* Finance Button */}
              <div className="mt-3">
                <LoanittFinanceButton
                  variant="secondary"
                  size="lg"
                  fullWidth
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 text-center text-white md:grid-cols-4">
            <div>
              <Car className="mx-auto mb-4 h-12 w-12" />
              <div className="mb-2 text-3xl font-bold">{carCount || 0}+</div>
              <div className="text-lg">Cars Available</div>
            </div>
            <div>
              <Users className="mx-auto mb-4 h-12 w-12" />
              <div className="mb-2 text-3xl font-bold">150+</div>
              <div className="text-lg">Trusted Dealers</div>
            </div>
            <div>
              <Star className="mx-auto mb-4 h-12 w-12" />
              <div className="mb-2 text-3xl font-bold">4.8</div>
              <div className="text-lg">Average Rating</div>
            </div>
            <div>
              <MapPin className="mx-auto mb-4 h-12 w-12" />
              <div className="mb-2 text-3xl font-bold">32</div>
              <div className="text-lg">Counties Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚗 UPDATED: Home Car Inspection Service Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-orange-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              🚗 Professional Home Car Inspection
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Buying a car? Get peace of mind with our certified mobile inspection service. 
              Our qualified mechanics come to you and provide a comprehensive 50-point inspection report.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Service Details */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-white rounded-xl shadow-md">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">50-Point Check</h3>
                  <p className="text-sm text-gray-600">Comprehensive inspection of engine, brakes, suspension, and more</p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl shadow-md">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LocationIcon className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">At Your Location</h3>
                  <p className="text-sm text-gray-600">We come to your home, workplace, or the seller's location</p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl shadow-md">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Same Day Service</h3>
                  <p className="text-sm text-gray-600">Book today, inspect today. Fast and convenient scheduling</p>
                </div>

                <div className="text-center p-6 bg-white rounded-xl shadow-md">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Detailed Report</h3>
                  <p className="text-sm text-gray-600">Written report with photos and estimated repair costs</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200">
                <div className="text-center">
                  <span className="text-3xl font-bold text-green-600">€99</span>
                  <span className="text-gray-600 ml-2">per inspection</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Full 50-point mechanical inspection
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Detailed written report with photos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Estimated repair costs for any issues
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Available across Ireland
                  </li>
                </ul>
              </div>
            </div>

            {/* Right side - Call to Action */}
            <div className="text-center lg:text-left">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Don't Buy Blind - Get Inspected!
                </h3>
                <p className="text-gray-600 mb-6">
                  Found a car you're interested in? Our certified mechanics will inspect it before you buy, 
                  giving you the confidence to negotiate or walk away if needed.
                </p>
                
                <div className="space-y-4">
                  {/* FIXED: Link to correct booking page */}
                  <Link 
                    href="/book-inspection"
                    className="w-full bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center"
                  >
                    📋 Book Inspection Online
                  </Link>
                  
                  {/* Alternative contact methods */}
                  <div className="grid grid-cols-2 gap-3">
                    <a 
                      href="tel:+353871708603"
                      className="bg-orange-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center"
                    >
                      📞 Call Now
                    </a>
                    
                    <a 
                      href="https://wa.me/353871708603?text=Hi, I'd like to book a car inspection"
                      className="bg-green-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Qualified Mechanics
                    </span>
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Fully Insured
                    </span>
                  </div>

                  {/* FIXED: Updated phone number */}
                  <p className="text-xs text-gray-500">
                    Call us at <span className="font-bold text-green-600">087 170 8603</span> or 
                    book online for next available slot
                  </p>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 mb-4">Trusted by Irish car buyers</p>
                <div className="flex justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">500+</div>
                    <div className="text-xs text-gray-500">Inspections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">4.9★</div>
                    <div className="text-xs text-gray-500">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">98%</div>
                    <div className="text-xs text-gray-500">Satisfied</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      {featuredCars.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">Featured Cars</h2>
              <p className="text-gray-600">Hand-picked premium vehicles from trusted dealers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCars.map((car: any) => (
                <div key={car.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative h-48">
                    <img
                      src={car.images[0]?.url || '/placeholder-car.jpg'}
                      alt={car.images[0]?.alt || car.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                        Featured
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      <span className="bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        €{car.price.toLocaleString()}
                      </span>
                      <FavoriteButton 
                        carId={car.id}
                        initialFavoritesCount={car.likesCount || 0}
                        initialIsFavorited={car.isLiked || false}
                        size="sm"
                        showCount={false}
                        className="bg-white bg-opacity-90 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{car.title}</h3>
                    
                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{car.location.city}, {car.location.county}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-500">Year:</span>
                        <span className="font-medium ml-1">{car.year}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Mileage:</span>
                        <span className="font-medium ml-1">{car.mileage?.toLocaleString()} km</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Fuel:</span>
                        <span className="font-medium ml-1 capitalize">{car.fuelType?.toLowerCase()}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Transmission:</span>
                        <span className="font-medium ml-1 capitalize">{car.transmission?.toLowerCase()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          {car.seller.verified ? '✓ Verified' : ''} {car.seller.type}
                        </span>
                        <FavoriteButton 
                          carId={car.id}
                          initialFavoritesCount={car.likesCount || 0}
                          initialIsFavorited={car.isLiked || false}
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
          </div>
        </section>
      )}

      {/* Shared Footer */}
      <Footer />
    </div>
  )
}