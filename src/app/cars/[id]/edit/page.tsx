'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X, Upload, Trash2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface EditCarPageProps {
  params: {
    id: string
  }
}

interface CarFormData {
  title: string
  make: string
  model: string
  year: number
  price: number
  mileage: number | null
  fuelType: string
  transmission: string
  engineSize: number | null
  bodyType: string
  doors: number | null
  seats: number | null
  color: string
  condition: string
  previousOwners: number | null
  nctExpiry: string
  serviceHistory: boolean
  accidentHistory: boolean
  description: string
  features: string[]
  location: {
    county: string
    area: string
    display_location: string
  }
}

export default function EditCarPage({ params }: EditCarPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [car, setCar] = useState<any>(null)
  const [formData, setFormData] = useState<CarFormData>({
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    mileage: null,
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    engineSize: null,
    bodyType: 'HATCHBACK',
    doors: null,
    seats: null,
    color: '',
    condition: 'USED',
    previousOwners: null,
    nctExpiry: '',
    serviceHistory: false,
    accidentHistory: false,
    description: '',
    features: [],
    location: {
      county: '',
      area: '',
      display_location: ''
    }
  })

  // Check authentication and load car data
  useEffect(() => {
    const checkAuthAndLoadCar = async () => {
      try {
        // Check authentication
        const authResponse = await fetch('/api/auth/me')
        const authData = await authResponse.json()
        
        if (!authData.success) {
          router.push('/login?redirect=/cars/' + params.id + '/edit')
          return
        }
        
        setUser(authData.user)

        // Load car data
        const carResponse = await fetch(`/api/cars/${params.id}`)
        const carData = await carResponse.json()
        
        if (!carData.success) {
          setError('Car not found')
          return
        }

        // Check if user owns this car
        if (carData.car.userId !== authData.user.id && authData.user.role !== 'ADMIN' && authData.user.role !== 'SUPER_ADMIN') {
          setError('You can only edit your own cars')
          return
        }

        setCar(carData.car)
        
        // Populate form with existing data
        setFormData({
          title: carData.car.title || '',
          make: carData.car.make || '',
          model: carData.car.model || '',
          year: carData.car.year || new Date().getFullYear(),
          price: carData.car.price || 0,
          mileage: carData.car.mileage,
          fuelType: carData.car.fuelType || 'PETROL',
          transmission: carData.car.transmission || 'MANUAL',
          engineSize: carData.car.engineSize,
          bodyType: carData.car.bodyType || 'HATCHBACK',
          doors: carData.car.doors,
          seats: carData.car.seats,
          color: carData.car.color || '',
          condition: carData.car.condition || 'USED',
          previousOwners: carData.car.previousOwners,
          nctExpiry: carData.car.nctExpiry ? carData.car.nctExpiry.split('T')[0] : '',
          serviceHistory: carData.car.serviceHistory || false,
          accidentHistory: carData.car.accidentHistory || false,
          description: carData.car.description || '',
          features: carData.car.features || [],
          location: carData.car.location || { county: '', area: '', display_location: '' }
        })

      } catch (error) {
        console.error('Error loading car:', error)
        setError('Failed to load car data')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadCar()
  }, [params.id, router])

  const handleInputChange = (field: keyof CarFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLocationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (saving) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/cars/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        router.push('/my-ads')
      } else {
        setError(data.error || 'Failed to update car')
      }
    } catch (error) {
      console.error('Error updating car:', error)
      setError('Failed to update car')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <Link href="/my-ads" className="mt-4 inline-block text-green-600 hover:underline">
              Back to My Ads
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/my-ads" className="text-green-600 hover:text-green-700 flex items-center mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to My Ads
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Car Listing</h1>
            <p className="text-gray-600 mt-1">Update your car information</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
          
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 2020 BMW 3 Series 320d M Sport"
                />
              </div>

              {/* Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Make *
                </label>
                <input
                  type="text"
                  required
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., BMW"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 3 Series"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <input
                  type="number"
                  required
                  min="1980"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (€) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

            </div>
          </div>

          {/* Technical Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Technical Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Mileage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mileage (km)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.mileage || ''}
                  onChange={(e) => handleInputChange('mileage', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Type
                </label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => handleInputChange('fuelType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="PETROL">Petrol</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="ELECTRIC">Electric</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="PETROL_HYBRID">Petrol Hybrid</option>
                  <option value="DIESEL_HYBRID">Diesel Hybrid</option>
                  <option value="PLUGIN_HYBRID">Plugin Hybrid</option>
                  <option value="PETROL_PLUGIN_HYBRID">Petrol Plug-in Hybrid</option>
                  <option value="DIESEL_PLUGIN_HYBRID">Diesel Plug-in Hybrid</option>
                </select>
              </div>

              {/* Transmission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transmission
                </label>
                <select
                  value={formData.transmission}
                  onChange={(e) => handleInputChange('transmission', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="SEMI_AUTOMATIC">Semi-Automatic</option>
                </select>
              </div>

              {/* Engine Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Engine Size (L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.engineSize || ''}
                  onChange={(e) => handleInputChange('engineSize', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 2.0"
                />
              </div>

              {/* Body Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Type
                </label>
                <select
                  value={formData.bodyType}
                  onChange={(e) => handleInputChange('bodyType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="HATCHBACK">Hatchback</option>
                  <option value="SALOON">Saloon</option>
                  <option value="ESTATE">Estate</option>
                  <option value="SUV">SUV</option>
                  <option value="COUPE">Coupe</option>
                  <option value="CONVERTIBLE">Convertible</option>
                  <option value="MPV">MPV</option>
                  <option value="VAN">Van</option>
                  <option value="PICKUP">Pickup</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Black"
                />
              </div>

              {/* Doors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doors
                </label>
                <select
                  value={formData.doors || ''}
                  onChange={(e) => handleInputChange('doors', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select doors</option>
                  <option value="2">2 doors</option>
                  <option value="3">3 doors</option>
                  <option value="4">4 doors</option>
                  <option value="5">5 doors</option>
                </select>
              </div>

              {/* Seats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seats
                </label>
                <select
                  value={formData.seats || ''}
                  onChange={(e) => handleInputChange('seats', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select seats</option>
                  <option value="2">2 seats</option>
                  <option value="3">3 seats</option>
                  <option value="4">4 seats</option>
                  <option value="5">5 seats</option>
                  <option value="7">7 seats</option>
                  <option value="8">8+ seats</option>
                </select>
              </div>

            </div>
          </div>

          {/* Location */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County
                </label>
                <input
                  type="text"
                  value={formData.location.county}
                  onChange={(e) => handleLocationChange('county', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Dublin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area/Town
                </label>
                <input
                  type="text"
                  value={formData.location.area}
                  onChange={(e) => handleLocationChange('area', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Ballsbridge"
                />
              </div>

            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe your car's condition, features, service history, etc."
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/my-ads"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
                saving
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>

      </div>
      
      <Footer />
    </div>
  )
}