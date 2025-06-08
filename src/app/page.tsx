'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Car, Users, Star, MapPin, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LikeButton from '@/components/LikeButton'

export default function HomePage() {
  const router = useRouter()
  const [cars, setCars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    make: '',
    priceRange: '',
    year: '',
    county: ''
  })

  // Fetch cars on client side only
  useEffect(() => {
    async function fetchCars() {
      try {
        const response = await fetch('/api/cars')
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
  }, [])

  const featuredCars = cars.filter((car: any) => car.featured)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    if (searchFilters.searchText) params.set('q', searchFilters.searchText)
    if (searchFilters.make) params.set('make', searchFilters.make)
    if (searchFilters.priceRange) params.set('priceRange', searchFilters.priceRange)
    if (searchFilters.year) params.set('year', searchFilters.year)
    if (searchFilters.county) params.set('county', searchFilters.county)
    
    router.push(`/cars?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Shared Header */}
      <Header currentPage="home" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-gray-700 py-20">
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
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  What car are you looking for?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for BMW 3 Series, Golf GTI, Tesla Model 3..."
                    value={searchFilters.searchText}
                    onChange={(e) => setSearchFilters({...searchFilters, searchText: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 p-4 pr-12 text-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-4 text-sm font-medium text-gray-700">Refine your search</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Make</label>
                    <select 
                      value={searchFilters.make}
                      onChange={(e) => setSearchFilters({...searchFilters, make: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Any Make</option>
                      <option value="BMW">BMW</option>
                      <option value="Tesla">Tesla</option>
                      <option value="Volkswagen">Volkswagen</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Price Range</label>
                    <select 
                      value={searchFilters.priceRange}
                      onChange={(e) => setSearchFilters({...searchFilters, priceRange: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Any Price</option>
                      <option value="0-30000">Under €30,000</option>
                      <option value="30000-50000">€30,000 - €50,000</option>
                      <option value="50000-999999">Over €50,000</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Year</label>
                    <select 
                      value={searchFilters.year}
                      onChange={(e) => setSearchFilters({...searchFilters, year: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Any Year</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                      <option value="2019">2019</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">County</label>
                    <select 
                      value={searchFilters.county}
                      onChange={(e) => setSearchFilters({...searchFilters, county: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">All Ireland</option>
                      <option value="Dublin">Dublin</option>
                      <option value="Cork">Cork</option>
                      <option value="Galway">Galway</option>
                    </select>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="mt-6 flex w-full items-center justify-center rounded-lg bg-primary px-6 py-4 text-lg font-bold text-white hover:bg-primary/90 transition-colors"
              >
                <Search className="mr-2 h-5 w-5" />
                SEARCH CARS
              </button>
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
              <div className="mb-2 text-3xl font-bold">{cars.length}+</div>
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
                    <Image
                      src={car.images[0]?.url || '/placeholder-car.jpg'}
                      alt={car.images[0]?.alt || car.title}
                      fill
                      className="object-cover"
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
                      <LikeButton 
                        carId={car.id}
                        initialLikesCount={car.likesCount || 0}
                        initialIsLiked={car.isLiked || false}
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
                        <LikeButton 
                          carId={car.id}
                          initialLikesCount={car.likesCount || 0}
                          initialIsLiked={car.isLiked || false}
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