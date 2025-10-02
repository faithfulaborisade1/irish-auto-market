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
  Trash2,
  Settings,
  Palette,
  Euro,
  Calendar,
  Gauge,
  Fuel,
  MapPin
} from 'lucide-react';
import { getAllCarMakes, getModelsForMake } from '@/data/car-makes-models';
import { getAllCounties, getAreasForCounty } from '@/data/irish-locations';
import { SUPPORTED_CURRENCIES, getCurrencySymbol, formatPrice } from '@/utils/currency';
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
  currency: string;
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

const defaultCarForm: CarFormData = {
  make: '',
  model: '',
  year: '',
  price: '',
  currency: 'EUR',
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
  previousOwners: 1,
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
    { value: 'LPG', label: 'LPG' },
    { value: 'CNG', label: 'CNG' },
  ];

  const transmissions = [
    { value: 'MANUAL', label: 'Manual' },
    { value: 'AUTOMATIC', label: 'Automatic' },
    { value: 'SEMI_AUTOMATIC', label: 'Semi-Automatic' },
    { value: 'CVT', label: 'CVT' }
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
        // Convert string/empty values to proper types for submission
        year: carForm.year ? parseInt(carForm.year.toString()) : new Date().getFullYear(),
        price: carForm.price ? parseFloat(carForm.price.toString()) : 0,
        mileage: carForm.mileage ? parseInt(carForm.mileage.toString()) : null,
        engineSize: carForm.engineSize ? parseFloat(carForm.engineSize.toString()) : null,
        doors: carForm.doors ? parseInt(carForm.doors.toString()) : null,
        seats: carForm.seats ? parseInt(carForm.seats.toString()) : null,
        previousOwners: carForm.previousOwners ? parseInt(carForm.previousOwners.toString()) : 1,
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
      'title,make,model,year,price,currency,mileage,fuelType,transmission,engineSize,bodyType,doors,seats,color,county,area,description,condition,previousOwners,nctExpiry,serviceHistory,accidentHistory,features,image_urls',
      '"2020 BMW 320i M Sport",BMW,320i,2020,25000,EUR,45000,PETROL,AUTOMATIC,2.0,SALOON,4,5,Black,Dublin,"Dublin City","Excellent condition BMW 320i with full service history. Recently serviced with new tyres.",USED,1,2025-12-31,true,false,"Leather Seats|Parking Sensors|Bluetooth|Cruise Control","https://example.com/img1.jpg|https://example.com/img2.jpg|https://example.com/img3.jpg"',
      '"2019 Toyota Corolla Hybrid",Toyota,Corolla,2019,18000,EUR,32000,HYBRID,AUTOMATIC,1.8,HATCHBACK,5,5,White,Cork,"Cork City","Reliable hybrid with excellent fuel economy. Perfect for daily commute.",USED,2,2025-06-30,true,false,"Reversing Camera|Climate Control|Heated Seats","https://example.com/img4.jpg|https://example.com/img5.jpg"',
      '"2021 Volkswagen Golf GTI",Volkswagen,Golf,2021,32000,EUR,15000,PETROL,MANUAL,2.0,HATCHBACK,5,5,Red,Galway,Galway,"Stunning Golf GTI in pristine condition. Full VW service history.",CERTIFIED_PRE_OWNED,1,2026-03-15,true,false,"Sport Seats|Touchscreen|Apple CarPlay|LED Headlights","https://example.com/img6.jpg|https://example.com/img7.jpg|https://example.com/img8.jpg"'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'car-upload-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Proper CSV parser that handles quoted fields with commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Transform to expected format with smart defaults
      const make = row.make || '';
      const model = row.model || '';
      const year = parseInt(row.year) || new Date().getFullYear();

      // Smart defaults based on make/model/year
      let defaultBodyType = 'HATCHBACK';
      let defaultDoors = undefined;
      let defaultSeats = undefined;

      // Detect SUVs
      if (model.toLowerCase().includes('suv') || model.toLowerCase().includes('x3') ||
          model.toLowerCase().includes('x5') || model.toLowerCase().includes('qashqai') ||
          model.toLowerCase().includes('tucson') || model.toLowerCase().includes('sportage')) {
        defaultBodyType = 'SUV';
        defaultDoors = 5;
        defaultSeats = 5;
      }
      // Detect vans
      else if (model.toLowerCase().includes('van') || model.toLowerCase().includes('transit') ||
               model.toLowerCase().includes('sprinter') || make.toLowerCase().includes('mercedes-benz')) {
        defaultBodyType = 'VAN';
      }
      // Detect saloons
      else if (model.toLowerCase().includes('3 series') || model.toLowerCase().includes('a4') ||
               model.toLowerCase().includes('camry') || model.toLowerCase().includes('accord')) {
        defaultBodyType = 'SALOON';
        defaultDoors = 4;
        defaultSeats = 5;
      }

      // Smart transmission default - newer cars tend to be automatic
      let defaultTransmission = 'MANUAL';
      if (year >= 2020) {
        defaultTransmission = 'AUTOMATIC';
      }

      const car = {
        title: row.title || `${year} ${make} ${model}`,
        make: make,
        model: model,
        year: year,
        price: parseFloat(row.price) || 0,
        currency: row.currency || 'EUR',
        mileage: row.mileage ? parseInt(row.mileage) : undefined,
        fuelType: row.fuelType || 'PETROL',
        transmission: row.transmission || defaultTransmission,
        engineSize: row.engineSize ? parseFloat(row.engineSize) : undefined,
        bodyType: row.bodyType || defaultBodyType,
        doors: row.doors ? parseInt(row.doors) : defaultDoors,
        seats: row.seats ? parseInt(row.seats) : defaultSeats,
        color: row.color || '',
        county: row.county || '',
        area: row.area || '',
        description: row.description || `${year} ${make} ${model} in ${row.condition || 'good'} condition.`,
        condition: row.condition || 'USED',
        previousOwners: row.previousOwners ? parseInt(row.previousOwners) : 1,
        nctExpiry: row.nctExpiry || undefined,
        serviceHistory: row.serviceHistory === 'true' || row.serviceHistory === 'TRUE' || row.serviceHistory === '1',
        accidentHistory: row.accidentHistory === 'true' || row.accidentHistory === 'TRUE' || row.accidentHistory === '1',
        features: row.features ? row.features.split('|').map((f: string) => f.trim()) : [],
        // Store raw image URLs - backend will download and process them
        imageUrls: row.image_urls ? row.image_urls.split('|').map((url: string) => url.trim()).filter(Boolean) : []
      };

      if (car.make && car.model && car.year && car.price && car.title && car.imageUrls.length > 0) {
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

  const handleFeatureToggle = (feature: string) => {
    setCarForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
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

                {/* Price with Currency Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="flex gap-2">
                    {/* Currency Selector */}
                    <select
                      value={carForm.currency}
                      onChange={(e) => updateCarForm('currency', e.target.value)}
                      className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                        {getCurrencySymbol(carForm.currency)}
                      </span>
                      <input
                        type="number"
                        value={carForm.price}
                        onChange={(e) => updateCarForm('price', parseFloat(e.target.value) || '')}
                        className="w-full pl-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={carForm.currency === 'EUR' ? 'e.g. 25000' : 'e.g. 21000'}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  {carForm.price && (
                    <p className="text-sm text-gray-500 mt-1">
                      Price: {formatPrice(parseFloat(carForm.price.toString()), carForm.currency)}
                    </p>
                  )}
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
                  <div className="relative">
                    <Gauge className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="number"
                      value={carForm.mileage}
                      onChange={(e) => updateCarForm('mileage', parseInt(e.target.value) || '')}
                      className="w-full pl-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      placeholder="e.g. 45000"
                    />
                  </div>
                </div>

                {/* Engine Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Engine Size (L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={carForm.engineSize}
                    onChange={(e) => updateCarForm('engineSize', parseFloat(e.target.value) || '')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. 2.0"
                  />
                </div>

                {/* Doors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doors
                  </label>
                  <select
                    value={carForm.doors}
                    onChange={(e) => updateCarForm('doors', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    value={carForm.seats}
                    onChange={(e) => updateCarForm('seats', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Seats</option>
                    <option value="2">2 Seats</option>
                    <option value="4">4 Seats</option>
                    <option value="5">5 Seats</option>
                    <option value="7">7 Seats</option>
                    <option value="8">8+ Seats</option>
                  </select>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>

              {/* ✅ NEW: Body Type Section with Visual Selection */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="mr-2 text-blue-600" size={20} />
                  Body Type
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose the type of vehicle you're adding
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {BODY_TYPES.map(bodyType => (
                    <label key={bodyType.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="bodyType"
                        value={bodyType.value}
                        checked={carForm.bodyType === bodyType.value}
                        onChange={() => updateCarForm('bodyType', bodyType.value)}
                        className="sr-only"
                      />
                      <div className={`
                        border-2 rounded-lg p-4 text-center transition-all hover:shadow-md
                        ${carForm.bodyType === bodyType.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
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
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Palette className="mr-2 text-blue-600" size={20} />
                  Car Color
                </h3>
                <p className="text-gray-600 mb-4">
                  Select your car's color or leave blank if unsure
                </p>
                
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {COLOR_OPTIONS.map(colorOption => (
                    <label key={colorOption.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={colorOption.value}
                        checked={carForm.color === colorOption.value}
                        onChange={() => updateCarForm('color', colorOption.value)}
                        className="sr-only"
                      />
                      <div className={`
                        border-2 rounded-lg p-3 text-center transition-all hover:shadow-md
                        ${carForm.color === colorOption.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
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
                    onClick={() => updateCarForm('color', '')}
                    className={`
                      px-4 py-2 text-sm rounded-lg border transition-colors
                      ${!carForm.color
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    {!carForm.color ? '✓ No Color Selected' : 'Clear Color Selection'}
                  </button>
                </div>
              </div>

              {/* Additional Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Previous Owners */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous Owners
                    </label>
                    <select
                      value={carForm.previousOwners}
                      onChange={(e) => updateCarForm('previousOwners', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      value={carForm.nctExpiry}
                      onChange={(e) => updateCarForm('nctExpiry', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition
                    </label>
                    <select
                      value={carForm.condition}
                      onChange={(e) => updateCarForm('condition', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      checked={carForm.serviceHistory}
                      onChange={(e) => updateCarForm('serviceHistory', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="serviceHistory" className="ml-2 block text-sm text-gray-700">
                      Full Service History Available
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="accidentHistory"
                      checked={carForm.accidentHistory}
                      onChange={(e) => updateCarForm('accidentHistory', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="accidentHistory" className="ml-2 block text-sm text-gray-700">
                      Has Been in an Accident
                    </label>
                  </div>
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
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Be detailed and honest to attract serious buyers</span>
                  <span>{carForm.description.length}/2000</span>
                </div>
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
                <h2 className="text-lg font-semibold text-gray-900">CSV Template & Instructions</h2>
              </div>

              {/* Instructions */}
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  How to Use Bulk Upload with Image URLs
                </h3>
                <ul className="text-sm text-blue-800 space-y-2 ml-6 list-disc">
                  <li>Copy image URLs directly from DoneDeal, Cars.ie, or any car listing site</li>
                  <li>Separate multiple image URLs with a pipe symbol <code className="bg-blue-100 px-1 rounded">|</code></li>
                  <li>Example: <code className="bg-blue-100 px-1 rounded text-xs">https://site.com/img1.jpg|https://site.com/img2.jpg</code></li>
                  <li>Images will be automatically downloaded and uploaded to your account</li>
                  <li>You can add up to 10 images per car</li>
                  <li>No need to manually download images anymore! ⚡</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-gray-600">
                  Download a CSV template to get started with bulk uploads
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={downloadCSVTemplate}
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Full Template
                  </button>
                  <button
                    onClick={() => {
                      const csvContent = [
                        'title,make,model,year,price,county,description,image_urls',
                        '"2020 BMW 320i",BMW,320i,2020,25000,Dublin,"Great car in excellent condition","https://example.com/1.jpg|https://example.com/2.jpg"',
                        '"2019 Toyota Corolla",Toyota,Corolla,2019,18000,Cork,"Reliable hybrid with low mileage","https://example.com/3.jpg|https://example.com/4.jpg"'
                      ].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'simple-car-template.csv';
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Simple Template
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  💡 Use Simple Template for quick uploads (only essential fields). Smart defaults will fill in the rest!
                </p>
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
                          <td className="px-3 py-2 text-gray-600">
                            {car.currency === 'GBP' ? '£' : '€'}{car.price.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {car.area ? `${car.area}, ${car.county}` : car.county}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {car.imageUrls?.length || 0} image URLs
                          </td>
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
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

                {/* Upload Another Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setResults(null);
                      setCsvFile(null);
                      setCsvData([]);
                      setCsvPreview([]);
                      setShowPreview(false);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Another CSV
                  </button>
                </div>
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