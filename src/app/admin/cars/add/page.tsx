'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Upload, 
  FileText, 
  Users, 
  Check, 
  X,
  AlertCircle,
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  User,
  Building2,
  FileUp,
  Save,
  Trash2
} from 'lucide-react';
import { getAllCarMakes, getModelsForMake } from '@/data/car-makes-models';
import { getAllCounties, getAreasForCounty } from '@/data/irish-locations';
import ImageUpload from '@/components/ImageUpload';

interface Dealer {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  verified: boolean;
  businessName?: string;
  activeCarsCount: number;
}

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

interface CarFormData {
  make: string;
  model: string;
  year: number | '';
  price: number | '';
  title: string;
  description: string;
  county: string;
  area: string;
  mileage: number | '';
  fuelType: string;
  transmission: string;
  engineSize: number | '';
  bodyType: string;
  doors: number | '';
  seats: number | '';
  color: string;
  condition: string;
  previousOwners: number | '';
  nctExpiry: string;
  serviceHistory: boolean;
  accidentHistory: boolean;
  features: string[];
}

const defaultCarForm: CarFormData = {
  make: '',
  model: '',
  year: '',
  price: '',
  title: '',
  description: '',
  county: '',
  area: '',
  mileage: '',
  fuelType: 'PETROL',
  transmission: 'MANUAL',
  engineSize: '',
  bodyType: 'HATCHBACK',
  doors: '',
  seats: '',
  color: '',
  condition: 'USED',
  previousOwners: '',
  nctExpiry: '',
  serviceHistory: false,
  accidentHistory: false,
  features: []
};

export default function AdminAddCarsPage() {
  const [mode, setMode] = useState<'individual' | 'bulk'>('individual');
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dealersLoading, setDealersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Individual car form
  const [carForm, setCarForm] = useState<CarFormData>(defaultCarForm);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  
  // Bulk upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // Results
  const [results, setResults] = useState<any>(null);

  // Available options from data files
  const counties = getAllCounties();
  const makes = getAllCarMakes();
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  const fuelTypes = [
    { value: 'PETROL', label: 'Petrol' },
    { value: 'DIESEL', label: 'Diesel' },
    { value: 'ELECTRIC', label: 'Electric' },
    { value: 'HYBRID', label: 'Hybrid' },
    { value: 'PLUGIN_HYBRID', label: 'Plug-in Hybrid' },
  ];

  const transmissions = [
    { value: 'MANUAL', label: 'Manual' },
    { value: 'AUTOMATIC', label: 'Automatic' },
    { value: 'SEMI_AUTOMATIC', label: 'Semi-Automatic' },
    { value: 'CVT', label: 'CVT' }
  ];

  const bodyTypes = [
    { value: 'HATCHBACK', label: 'Hatchback' },
    { value: 'SALOON', label: 'Saloon' },
    { value: 'ESTATE', label: 'Estate' },
    { value: 'SUV', label: 'SUV' },
    { value: 'COUPE', label: 'Coupe' },
    { value: 'CONVERTIBLE', label: 'Convertible' },
    { value: 'MPV', label: 'MPV' },
  ];

  useEffect(() => {
    fetchDealers();
  }, []);

  // Update available models when make changes
  useEffect(() => {
    if (carForm.make) {
      const models = getModelsForMake(carForm.make);
      setAvailableModels(models);
      // Reset model if it's not available for the new make
      if (carForm.model && !models.includes(carForm.model)) {
        updateCarForm('model', '');
      }
    } else {
      setAvailableModels([]);
      updateCarForm('model', '');
    }
  }, [carForm.make]);

  // Update available areas when county changes
  useEffect(() => {
    if (carForm.county) {
      const areas = getAreasForCounty(carForm.county);
      setAvailableAreas(areas);
      // Reset area if it's not available for the new county
      if (carForm.area && !areas.includes(carForm.area)) {
        updateCarForm('area', '');
      }
    } else {
      setAvailableAreas([]);
      updateCarForm('area', '');
    }
  }, [carForm.county]);

  const fetchDealers = async () => {
    try {
      setDealersLoading(true);
      const response = await fetch('/api/admin/dealers', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDealers(data.dealers || []);
      } else {
        setError('Failed to load dealers');
      }
    } catch (error) {
      console.error('Error fetching dealers:', error);
      setError('Failed to load dealers');
    } finally {
      setDealersLoading(false);
    }
  };

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealer) {
      setError('Please select a dealer');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Convert uploaded images to the format expected by the API
      const images = uploadedImages.map(img => ({
        originalUrl: img.originalUrl,
        thumbnailUrl: img.thumbnailUrl,
        mediumUrl: img.mediumUrl,
        largeUrl: img.largeUrl,
        size: img.size
      }));

      const formData = {
        dealerId: selectedDealer,
        ...carForm,
        images
      };

      const response = await fetch('/api/admin/cars/create-for-dealer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Car "${data.car.title}" created successfully for ${data.dealer.name}!`);
        setCarForm(defaultCarForm);
        setUploadedImages([]);
        setSelectedDealer('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create car');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedDealer) {
      setError('Please select a dealer');
      return;
    }

    if (!csvData.length) {
      setError('Please upload and preview CSV data first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const bulkData = {
        dealerId: selectedDealer,
        cars: csvData
      };

      const response = await fetch('/api/admin/cars/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bulkData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message);
        setResults(data);
        setCsvData([]);
        setCsvPreview([]);
        setCsvFile(null);
        setShowPreview(false);
      } else {
        setError(data.error || 'Failed to upload cars');
        if (data.details) {
          setError(data.error + ': ' + data.details.slice(0, 3).join(', '));
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = [
      'title,make,model,year,price,mileage,fuelType,transmission,color,county,area,description,image_urls',
      '"2020 BMW 320i",BMW,320i,2020,25000,45000,PETROL,AUTOMATIC,Black,Dublin,"Dublin City","Great condition car in excellent state","https://image1.jpg,https://image2.jpg"',
      '"2019 Toyota Corolla",Toyota,Corolla,2019,18000,32000,HYBRID,AUTOMATIC,White,Cork,"Cork City","Reliable hybrid with low mileage","https://image1.jpg,https://image2.jpg"'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'car-upload-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length < headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Transform to expected format
      const car = {
        title: row.title || '',
        make: row.make || '',
        model: row.model || '',
        year: parseInt(row.year) || new Date().getFullYear(),
        price: parseFloat(row.price) || 0,
        mileage: row.mileage ? parseInt(row.mileage) : undefined,
        fuelType: row.fuelType || 'PETROL',
        transmission: row.transmission || 'MANUAL',
        color: row.color || '',
        county: row.county || '',
        area: row.area || '',
        description: row.description || '',
        condition: 'USED',
        serviceHistory: false,
        accidentHistory: false,
        features: [],
        images: row.image_urls ? row.image_urls.split(',').map((url: string) => ({
          originalUrl: url.trim(),
          thumbnailUrl: url.trim(),
          mediumUrl: url.trim(),
          largeUrl: url.trim()
        })) : []
      };

      if (car.make && car.model && car.year && car.price && car.title) {
        data.push(car);
      }
    }

    return data;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setCsvData(parsed);
      setCsvPreview(parsed.slice(0, 5)); // Show first 5 for preview
      setShowPreview(true);
      setError(null);
    };
    reader.readAsText(file);
  };

  const updateCarForm = (field: keyof CarFormData, value: any) => {
    setCarForm(prev => ({ ...prev, [field]: value }));
  };

  const selectedDealerData = dealers.find(d => d.id === selectedDealer);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Car className="w-6 h-6 text-blue-600" />
                  Add Cars for Dealers
                </h1>
                <p className="text-gray-600 text-sm">Create car listings on behalf of dealers</p>
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('individual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'individual' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Individual
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'bulk' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Bulk Upload
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dealer Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Select Dealer</h2>
          </div>
          
          {dealersLoading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading dealers...
            </div>
          ) : (
            <div className="space-y-4">
              <select
                value={selectedDealer}
                onChange={(e) => setSelectedDealer(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a dealer...</option>
                {dealers.map(dealer => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name} ({dealer.email}) - {dealer.activeCarsCount} active cars
                    {dealer.verified && ' ✓'}
                  </option>
                ))}
              </select>

              {selectedDealerData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {selectedDealerData.verified ? (
                        <Building2 className="w-5 h-5 text-blue-600" />
                      ) : (
                        <User className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-blue-900">{selectedDealerData.name}</h3>
                        {selectedDealerData.verified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-blue-700">{selectedDealerData.email}</p>
                      <p className="text-sm text-blue-600 mt-1">
                        {selectedDealerData.activeCarsCount} active car listings
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mode-specific content */}
        {mode === 'individual' && selectedDealer && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Plus className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Add Individual Car</h2>
            </div>

            <form onSubmit={handleIndividualSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Car Title *
                  </label>
                  <input
                    type="text"
                    value={carForm.title}
                    onChange={(e) => updateCarForm('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 2020 BMW 320i M Sport"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (€) *
                  </label>
                  <input
                    type="number"
                    value={carForm.price}
                    onChange={(e) => updateCarForm('price', parseFloat(e.target.value) || '')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="25000"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make *
                  </label>
                  <select
                    value={carForm.make}
                    onChange={(e) => updateCarForm('make', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Make</option>
                    {makes.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <select
                    value={carForm.model}
                    onChange={(e) => updateCarForm('model', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!carForm.make}
                  >
                    <option value="">
                      {carForm.make ? 'Select Model' : 'Select Make First'}
                    </option>
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                  {availableModels.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {availableModels.length} models available for {carForm.make}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    value={carForm.year}
                    onChange={(e) => updateCarForm('year', parseInt(e.target.value) || '')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mileage (km)
                  </label>
                  <input
                    type="number"
                    value={carForm.mileage}
                    onChange={(e) => updateCarForm('mileage', parseInt(e.target.value) || '')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    placeholder="45000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    County *
                  </label>
                  <select
                    value={carForm.county}
                    onChange={(e) => updateCarForm('county', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select County</option>
                    {counties.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area/Town
                  </label>
                  <select
                    value={carForm.area}
                    onChange={(e) => updateCarForm('area', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!carForm.county}
                  >
                    <option value="">
                      {carForm.county ? 'Select Area (Optional)' : 'Select County First'}
                    </option>
                    {availableAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  {availableAreas.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {availableAreas.length} areas available in {carForm.county}
                    </p>
                  )}
                </div>
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Type
                  </label>
                  <select
                    value={carForm.fuelType}
                    onChange={(e) => updateCarForm('fuelType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {fuelTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission
                  </label>
                  <select
                    value={carForm.transmission}
                    onChange={(e) => updateCarForm('transmission', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {transmissions.map(trans => (
                      <option key={trans.value} value={trans.value}>{trans.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body Type
                  </label>
                  <select
                    value={carForm.bodyType}
                    onChange={(e) => updateCarForm('bodyType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {bodyTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={carForm.description}
                  onChange={(e) => updateCarForm('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed description of the car's condition, features, and any relevant information..."
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Car Images *
                </label>
                <ImageUpload
                  maxImages={10}
                  existingImages={uploadedImages}
                  onImagesChange={setUploadedImages}
                  className="border border-gray-300 rounded-lg p-4"
                />
                {uploadedImages.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">At least one image is required</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCarForm(defaultCarForm);
                    setUploadedImages([]);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedDealer || uploadedImages.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Car...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Car
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {mode === 'bulk' && selectedDealer && (
          <div className="space-y-6">
            {/* CSV Template Download */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">CSV Template</h2>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Download the CSV template to see the required format for bulk uploads
                </p>
                <button
                  onClick={downloadCSVTemplate}
                  className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Upload CSV File</h2>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {csvFile ? csvFile.name : 'Choose CSV file to upload'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {csvFile ? 'Click to choose a different file' : 'CSV files up to 5MB'}
                    </p>
                  </div>
                </label>
              </div>

              {csvFile && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">{csvFile.name}</p>
                        <p className="text-sm text-blue-700">
                          {csvData.length} cars parsed successfully
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      {showPreview ? 'Hide' : 'Preview'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* CSV Preview */}
            {showPreview && csvPreview.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Preview Data</h2>
                  <span className="text-sm text-gray-600">
                    (Showing first 5 of {csvData.length} cars)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-900">Title</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-900">Make/Model</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-900">Year</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-900">Price</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-900">Location</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-900">Images</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {csvPreview.map((car, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">{car.title}</td>
                          <td className="px-3 py-2 text-gray-600">{car.make} {car.model}</td>
                          <td className="px-3 py-2 text-gray-600">{car.year}</td>
                          <td className="px-3 py-2 text-gray-600">€{car.price.toLocaleString()}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {car.area ? `${car.area}, ${car.county}` : car.county}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{car.images.length} images</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleBulkUpload}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading Cars...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload {csvData.length} Cars
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Upload Results</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
                    <div className="text-sm text-green-800">Successful</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                    <div className="text-sm text-red-800">Failed</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.summary.total}</div>
                    <div className="text-sm text-blue-800">Total</div>
                  </div>
                </div>

                {results.errors && results.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      {results.errors.slice(0, 10).map((error: string, index: number) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {results.errors.length > 10 && (
                        <li className="text-red-600">... and {results.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No dealer selected state */}
        {!selectedDealer && !dealersLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Dealer First</h3>
            <p className="text-gray-600">
              Please select a dealer from the dropdown above to start adding cars for them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}