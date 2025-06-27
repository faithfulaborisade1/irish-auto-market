'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import Header from '@/components/Header';
import { Car, MapPin, Euro, Calendar, Gauge, Fuel, Settings, Eye, CheckCircle } from 'lucide-react';

// Irish counties for location dropdown
const IRISH_COUNTIES = [
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry', 'Donegal',
  'Down', 'Dublin', 'Fermanagh', 'Galway', 'Kerry', 'Kildare', 'Kilkenny',
  'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath',
  'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Tyrone',
  'Waterford', 'Westmeath', 'Wexford', 'Wicklow'
];

// Car data from your existing system
const CAR_DATA = {
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8'],
  'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX'],
  'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'S-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class'],
  'Volkswagen': ['Polo', 'Golf', 'Jetta', 'Passat', 'Arteon', 'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'ID.3', 'ID.4'],
  'Toyota': ['Yaris', 'Corolla', 'Camry', 'Prius', 'C-HR', 'RAV4', 'Highlander', 'Land Cruiser'],
  'Ford': ['Fiesta', 'Focus', 'Mondeo', 'Mustang', 'EcoSport', 'Kuga', 'Edge', 'Explorer'],
  'Nissan': ['Micra', 'Note', 'Sentra', 'Altima', 'Juke', 'Qashqai', 'X-Trail', 'Pathfinder'],
  'Hyundai': ['i10', 'i20', 'i30', 'Elantra', 'Sonata', 'Kona', 'Tucson', 'Santa Fe'],
  'Kia': ['Picanto', 'Rio', 'Ceed', 'Forte', 'Optima', 'Stonic', 'Sportage', 'Sorento'],
  'Honda': ['Jazz', 'Civic', 'Accord', 'HR-V', 'CR-V', 'Pilot'],
  'Mazda': ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-9'],
  'Peugeot': ['108', '208', '308', '508', '2008', '3008', '5008'],
  'Renault': ['Clio', 'Megane', 'Scenic', 'Captur', 'Kadjar', 'Koleos'],
  'Opel': ['Corsa', 'Astra', 'Insignia', 'Crossland', 'Grandland'],
  'Skoda': ['Citigo', 'Fabia', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq'],
  'SEAT': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
  'Fiat': ['500', 'Panda', 'Tipo', '500X', '500L'],
  'Alfa Romeo': ['Giulietta', 'Giulia', 'Stelvio'],
  'Jeep': ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee'],
  'Land Rover': ['Discovery Sport', 'Discovery', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover'],
  'Volvo': ['XC40', 'XC60', 'XC90', 'V40', 'V60', 'V90', 'S60', 'S90'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
  'Porsche': ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  'Jaguar': ['XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'I-Pace'],
  'Mini': ['Hatch', 'Clubman', 'Countryman', 'Convertible'],
  'Lexus': ['CT', 'IS', 'ES', 'GS', 'LS', 'NX', 'RX', 'GX', 'LX'],
  'Infiniti': ['Q30', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX60', 'QX70']
};

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
    
    // Contact (auto-filled from user)
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

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

  const availableModels = formData.make ? CAR_DATA[formData.make as keyof typeof CAR_DATA] || [] : [];

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
                  {Object.keys(CAR_DATA).map(make => (
                    <option key={make} value={make}>{make}</option>
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
                  <option value="">Select Model</option>
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

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (€) *
                </label>
                <div className="relative">
                  <Euro className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full pl-12 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g. 25000"
                    required
                  />
                </div>
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
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="mr-2 text-green-600" size={20} />
              Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {IRISH_COUNTIES.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
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