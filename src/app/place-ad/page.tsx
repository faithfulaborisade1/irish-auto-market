'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import Header from '@/components/Header';
import { Car, MapPin, Euro, Calendar, Gauge, Fuel, Settings, Eye, CheckCircle, Palette } from 'lucide-react';

// Import comprehensive car and location data
import { CAR_MAKES_MODELS, getAllCarMakes, getModelsForMake } from '@/data/car-makes-models';
import { IRISH_LOCATIONS, getAllCounties, getAreasForCounty } from '@/data/irish-locations';
import { SUPPORTED_CURRENCIES, getCurrencySymbol, formatPrice } from '@/utils/currency';

interface UploadedImage {
  id: string;
  url: string;
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  largeUrl: string;
  publicId: string;
  fileName: string;
  size: number;
}

// ✅ COMPLETE COLOR OPTIONS WITH VISUAL SELECTION
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
  { value: 'brown', label: 'Brown', color: '#8b4513', border: '#8b4513' },
  { value: 'purple', label: 'Purple', color: '#8b5cf6', border: '#8b5cf6' },
  { value: 'gold', label: 'Gold', color: '#d97706', border: '#d97706' }
];

// ✅ COMPLETE BODY TYPES (ALL 10 FROM DATABASE)
const BODY_TYPES = [
  { value: 'HATCHBACK', label: 'Hatchback', icon: '🚗', description: 'Compact with rear door' },
  { value: 'SALOON', label: 'Saloon/Sedan', icon: '🚘', description: 'Traditional 4-door car' },
  { value: 'ESTATE', label: 'Estate/Wagon', icon: '🚐', description: 'Extended rear cargo area' },
  { value: 'SUV', label: 'SUV', icon: '🚙', description: 'Sport Utility Vehicle' },
  { value: 'COUPE', label: 'Coupe', icon: '🏎️', description: 'Sporty 2-door' },
  { value: 'CONVERTIBLE', label: 'Convertible', icon: '🏎️', description: 'Removable/folding roof' },
  { value: 'MPV', label: 'MPV', icon: '🚌', description: 'Multi-Purpose Vehicle' },
  { value: 'VAN', label: 'Van', icon: '🚚', description: 'Commercial vehicle' },
  { value: 'PICKUP', label: 'Pickup Truck', icon: '🛻', description: 'Open cargo bed' },
  { value: 'OTHER', label: 'Other', icon: '🚗', description: 'Other vehicle type' }
];

export default function PlaceAdPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    currency: 'EUR',
    
    // Car Details
    mileage: '',
    fuelType: '',
    transmission: '',
    engineSize: '',
    bodyType: '',
    doors: '',
    seats: '',
    color: '',
    
    // Condition & History
    condition: 'USED',
    previousOwners: '1',
    nctExpiry: '',
    serviceHistory: false,
    accidentHistory: false,
    
    // Listing Details
    title: '',
    description: '',
    features: [] as string[],
    county: '',
    area: '', // Added area selection
    
    // Contact (auto-filled from user)
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  // Get data for dropdowns
  const availableMakes = getAllCarMakes();
  const availableModels = formData.make ? getModelsForMake(formData.make) : [];
  const availableCounties = getAllCounties();
  const availableAreas = formData.county ? getAreasForCounty(formData.county) : [];

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setFormData(prev => ({
            ...prev,
            contactName: `${data.user.firstName} ${data.user.lastName}`,
            contactEmail: data.user.email,
            contactPhone: data.user.phone || '',
          }));
        } else {
          // Redirect to login
          router.push('/login?redirect=/place-ad');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/place-ad');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Auto-generate title when make/model/year change
  useEffect(() => {
    if (formData.make && formData.model && formData.year) {
      const autoTitle = `${formData.year} ${formData.make} ${formData.model}`;
      setFormData(prev => ({ ...prev, title: autoTitle }));
    }
  }, [formData.make, formData.model, formData.year]);

  // Reset model when make changes
  useEffect(() => {
    if (formData.make) {
      setFormData(prev => ({ ...prev, model: '' }));
    }
  }, [formData.make]);

  // Reset area when county changes
  useEffect(() => {
    if (formData.county) {
      setFormData(prev => ({ ...prev, area: '' }));
    }
  }, [formData.county]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.make || !formData.model || !formData.year || !formData.price) {
        throw new Error('Please fill in all required fields');
      }

      if (images.length === 0) {
        throw new Error('Please upload at least one photo');
      }

      // Submit car listing
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          year: parseInt(formData.year.toString()),
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          engineSize: formData.engineSize ? parseFloat(formData.engineSize) : null,
          doors: formData.doors ? parseInt(formData.doors) : null,
          seats: formData.seats ? parseInt(formData.seats) : null,
          previousOwners: parseInt(formData.previousOwners),
          images: images,
          // Combine county and area for location display
          location: formData.area ? `${formData.area}, ${formData.county}` : formData.county,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing');
      }

      const result = await response.json();
      
      // Redirect to success page or car detail page
      router.push(`/cars/${result.car.id}?success=true`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="place-ad" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="place-ad" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Car className="mr-3 text-green-600" size={32} />
            Sell Your Car
          </h1>
          <p className="text-gray-600">
            Create a professional listing to reach thousands of potential buyers across Ireland
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Car Photos */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="mr-2 text-green-600" size={20} />
              Car Photos
            </h2>
            <p className="text-gray-600 mb-6">
              Upload high-quality photos to attract more buyers. First photo will be your main image.
            </p>
            <ImageUpload
              maxImages={10}
              existingImages={images}
              onImagesChange={setImages}
              showCamera={true}
              gridCols={3}
            />
          </div>

          {/* Basic Car Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Car className="mr-2 text-green-600" size={20} />
              Car Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Make *
                </label>
                <select
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select Make</option>
                  {availableMakes.map(make => (
                    <option key={make} value={make}>
                      {make} ({getModelsForMake(make).length} models)
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model *
                </label>
                <select
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={!formData.make}
                  required
                >
                  <option value="">
                    {formData.make ? 'Select Model' : 'Choose Make First'}
                  </option>
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  {Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Price with Currency Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <div className="flex gap-2">
                  {/* Currency Selector */}
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  >
                    {Object.entries(SUPPORTED_CURRENCIES).map(([code, currency]) => (
                      <option key={code} value={code}>
                        {currency.flag} {currency.symbol}
                      </option>
                    ))}
                  </select>
                  
                  {/* Price Input */}
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-3 text-gray-400 font-medium">
                      {getCurrencySymbol(formData.currency)}
                    </span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="w-full pl-12 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={formData.currency === 'EUR' ? 'e.g. 25000' : 'e.g. 21000'}
                      required
                    />
                  </div>
                </div>
                {formData.price && (
                  <p className="text-sm text-gray-500 mt-1">
                    Price: {formatPrice(parseFloat(formData.price), formData.currency)}
                  </p>
                )}
              </div>

              {/* Mileage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mileage (km)
                </label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleInputChange('mileage', e.target.value)}
                    className="w-full pl-12 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g. 45000"
                  />
                </div>
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Type
                </label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => handleInputChange('fuelType', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Fuel Type</option>
                  <option value="PETROL">Petrol</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="ELECTRIC">Electric</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="PLUGIN_HYBRID">Plug-in Hybrid</option>
                  <option value="LPG">LPG</option>
                  <option value="CNG">CNG</option>
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Transmission</option>
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="SEMI_AUTOMATIC">Semi-Automatic</option>
                  <option value="CVT">CVT</option>
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
                  value={formData.engineSize}
                  onChange={(e) => handleInputChange('engineSize', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g. 2.0"
                />
              </div>

              {/* Doors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doors
                </label>
                <select
                  value={formData.doors}
                  onChange={(e) => handleInputChange('doors', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Doors</option>
                  <option value="2">2 Doors</option>
                  <option value="3">3 Doors</option>
                  <option value="4">4 Doors</option>
                  <option value="5">5 Doors</option>
                </select>
              </div>

              {/* Seats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seats
                </label>
                <select
                  value={formData.seats}
                  onChange={(e) => handleInputChange('seats', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Seats</option>
                  <option value="2">2 Seats</option>
                  <option value="4">4 Seats</option>
                  <option value="5">5 Seats</option>
                  <option value="7">7 Seats</option>
                  <option value="8">8+ Seats</option>
                </select>
              </div>
            </div>
          </div>

          {/* ✅ NEW: Body Type Section with Visual Selection */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="mr-2 text-green-600" size={20} />
              Body Type
            </h2>
            <p className="text-gray-600 mb-6">
              Choose the type of vehicle you're selling
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {BODY_TYPES.map(bodyType => (
                <label key={bodyType.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="bodyType"
                    value={bodyType.value}
                    checked={formData.bodyType === bodyType.value}
                    onChange={() => handleInputChange('bodyType', bodyType.value)}
                    className="sr-only"
                  />
                  <div className={`
                    border-2 rounded-lg p-4 text-center transition-all hover:shadow-md
                    ${formData.bodyType === bodyType.value
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}>
                    <div className="text-3xl mb-2">{bodyType.icon}</div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {bodyType.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {bodyType.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ✅ NEW: Color Selection Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Palette className="mr-2 text-green-600" size={20} />
              Car Color
            </h2>
            <p className="text-gray-600 mb-6">
              Select your car's color or leave blank if unsure
            </p>
            
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {COLOR_OPTIONS.map(colorOption => (
                <label key={colorOption.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={colorOption.value}
                    checked={formData.color === colorOption.value}
                    onChange={() => handleInputChange('color', colorOption.value)}
                    className="sr-only"
                  />
                  <div className={`
                    border-2 rounded-lg p-3 text-center transition-all hover:shadow-md
                    ${formData.color === colorOption.value
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}>
                    <div 
                      className="w-8 h-8 rounded-full border mx-auto mb-2"
                      style={{ 
                        backgroundColor: colorOption.color,
                        borderColor: colorOption.border
                      }}
                    />
                    <div className="text-xs font-medium text-gray-900">
                      {colorOption.label}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            {/* Clear Color Option */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleInputChange('color', '')}
                className={`
                  px-4 py-2 text-sm rounded-lg border transition-colors
                  ${!formData.color
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                {!formData.color ? '✓ No Color Selected' : 'Clear Color Selection'}
              </button>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="mr-2 text-green-600" size={20} />
              Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* County */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County *
                </label>
                <select
                  value={formData.county}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select County</option>
                  {availableCounties.map(county => (
                    <option key={county} value={county}>
                      {county} ({getAreasForCounty(county).length} areas)
                    </option>
                  ))}
                </select>
              </div>

              {/* Area/Town */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area/Town
                </label>
                <select
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={!formData.county}
                >
                  <option value="">
                    {formData.county ? 'Select Area (Optional)' : 'Choose County First'}
                  </option>
                  {availableAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.area && formData.county && 
                    `Location will show as: ${formData.area}, ${formData.county}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Additional Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Previous Owners */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Owners
                </label>
                <select
                  value={formData.previousOwners}
                  onChange={(e) => handleInputChange('previousOwners', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="1">1 Owner</option>
                  <option value="2">2 Owners</option>
                  <option value="3">3 Owners</option>
                  <option value="4">4+ Owners</option>
                </select>
              </div>

              {/* NCT Expiry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NCT Expiry
                </label>
                <input
                  type="date"
                  value={formData.nctExpiry}
                  onChange={(e) => handleInputChange('nctExpiry', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                  <option value="CERTIFIED_PRE_OWNED">Certified Pre-Owned</option>
                </select>
              </div>
            </div>

            {/* Service History & Accident History */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="serviceHistory"
                  checked={formData.serviceHistory}
                  onChange={(e) => handleInputChange('serviceHistory', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="serviceHistory" className="ml-2 block text-sm text-gray-700">
                  Full Service History Available
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="accidentHistory"
                  checked={formData.accidentHistory}
                  onChange={(e) => handleInputChange('accidentHistory', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="accidentHistory" className="ml-2 block text-sm text-gray-700">
                  Has Been in an Accident
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Description *
            </h2>
            
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe your car in detail. Include any special features, recent maintenance, reason for selling, etc."
              required
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Be detailed and honest to attract serious buyers</span>
              <span>{formData.description.length}/2000</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting || images.length === 0}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Publishing Listing...
                </>
              ) : (
                'Publish Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}