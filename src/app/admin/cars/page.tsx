'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  X,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Fuel,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Image,
  Activity,
  WifiOff,
  Server,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MoreVertical
} from 'lucide-react';

interface CarUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  dealerProfile?: {
    businessName: string;
    verified: boolean;
  };
}

interface CarImage {
  id: string;
  originalUrl: string;
  thumbnailUrl: string;
  altText?: string;
  orderIndex: number;
}

interface AdminCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  engineSize?: number;
  bodyType?: string;
  doors?: number;
  seats?: number;
  color?: string;
  condition: string;
  description?: string;
  nctExpiry?: string;
  location?: any;
  slug: string;
  status: 'ACTIVE' | 'SOLD' | 'PENDING' | 'EXPIRED' | 'DRAFT';
  featured: boolean;
  featuredUntil?: string;
  viewsCount: number;
  inquiriesCount: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' | 'FLAGGED';
  moderatedBy?: string;
  moderatedAt?: string;
  rejectionReason?: string;
  
  // Relations
  user: CarUser;
  images: CarImage[];
  
  // Computed fields
  mainImage?: string;
}

interface CarFilters {
  search: string;
  status: string;
  moderationStatus: string;
  condition: string;
  fuelType: string;
  make: string;
  userType: string;
  featured: string;
  priceMin: string;
  priceMax: string;
}

interface EditFormData {
  title: string;
  make: string;
  model: string;
  year: number | string;
  price: number | string;
  currency: string;
  mileage: number | string;
  fuelType: string;
  transmission: string;
  engineSize: number | string;
  bodyType: string;
  doors: number | string;
  seats: number | string;
  color: string;
  condition: string;
  description: string;
  status: string;
  nctExpiry: string;
  locationCounty: string;
  locationCity: string;
  locationEircode: string;
}

// Color options used in the system
const COLOR_OPTIONS = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'silver', label: 'Silver' },
  { value: 'grey', label: 'Grey' },
  { value: 'blue', label: 'Blue' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'brown', label: 'Brown' },
  { value: 'purple', label: 'Purple' },
  { value: 'gold', label: 'Gold' }
];

export default function AdminCarsManagement() {
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<AdminCar | null>(null);
  const [showCarDetailsModal, setShowCarDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCars, setTotalCars] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Filters
  const [filters, setFilters] = useState<CarFilters>({
    search: '',
    status: 'all',
    moderationStatus: 'all',
    condition: 'all',
    fuelType: 'all',
    make: 'all',
    userType: 'all',
    featured: 'all',
    priceMin: '',
    priceMax: ''
  });
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    fetchCars();
    fetchCurrentUser();
  }, [currentPage, itemsPerPage, filters]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/admin/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const user = await response.json();
        setCurrentUserRole(user.role);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.moderationStatus !== 'all' && { moderationStatus: filters.moderationStatus }),
        ...(filters.condition !== 'all' && { condition: filters.condition }),
        ...(filters.fuelType !== 'all' && { fuelType: filters.fuelType }),
        ...(filters.make !== 'all' && { make: filters.make }),
        ...(filters.userType !== 'all' && { userType: filters.userType }),
        ...(filters.featured !== 'all' && { featured: filters.featured }),
        ...(filters.priceMin && { priceMin: filters.priceMin }),
        ...(filters.priceMax && { priceMax: filters.priceMax })
      });

      const response = await fetch(`/api/admin/cars?${params}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCars(data.cars || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCars(data.pagination?.total || 0);
        setRetryCount(0);
      } else {
        let errorMessage = 'Failed to load cars';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Authentication failed. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. Insufficient permissions.';
            break;
          case 404:
            errorMessage = 'Car management API not found.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again or contact support.';
            break;
          default:
            errorMessage = `Failed to load cars (Status: ${response.status}). Please try again.`;
        }
        
        setError(errorMessage);
        setCars([]);
        setTotalCars(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Error fetching cars:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Network connection error. Please check your internet connection and try again.');
      } else {
        setError('Failed to load cars. Please refresh the page or contact support.');
      }
      
      setCars([]);
      setTotalCars(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCarAction = async (carId: string, action: string, data?: any) => {
    try {
      setActionLoading(`${action}-${carId}`);
      setError(null);

      let endpoint = '';
      let method = 'PUT';
      let body = {};

      switch (action) {
        case 'toggle_status':
          endpoint = `/api/admin/cars/${carId}`;
          body = { status: data.newStatus };
          break;
        case 'toggle_featured':
          endpoint = `/api/admin/cars/${carId}`;
          body = { featured: data.featured, featuredUntil: data.featuredUntil };
          break;
        case 'moderate':
          endpoint = `/api/admin/cars/${carId}/moderate`;
          method = 'POST';
          body = {
            moderationStatus: data.moderationStatus,
            rejectionReason: data.rejectionReason
          };
          break;
        case 'edit_car':
          endpoint = `/api/admin/cars/${carId}`;
          body = data;
          break;
        case 'delete_car':
          endpoint = `/api/admin/cars/${carId}`;
          method = 'DELETE';
          break;
        default:
          console.warn('Unknown action:', action);
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined
      });

      if (response.ok) {
        fetchCars(); // Refresh the list
        if (action === 'delete_car') {
          alert('Car deleted successfully');
        } else if (action === 'moderate') {
          alert(`Car ${data.moderationStatus.toLowerCase()} successfully`);
        } else if (action === 'edit_car') {
          alert('Car updated successfully');
          setShowEditModal(false);
          setEditFormData(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Failed to ${action.replace('_', ' ')}`);
      }
    } catch (error: any) {
      setError(`Network error performing ${action.replace('_', ' ')}`);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (car: AdminCar) => {
    // Parse location data if it exists
    const location = car.location as any;

    setEditFormData({
      title: car.title,
      make: car.make,
      model: car.model,
      year: car.year.toString(),
      price: car.price.toString(),
      currency: car.currency || 'EUR',
      mileage: car.mileage?.toString() || '',
      fuelType: car.fuelType || '',
      transmission: car.transmission || '',
      engineSize: car.engineSize?.toString() || '',
      bodyType: car.bodyType || '',
      doors: car.doors?.toString() || '',
      seats: car.seats?.toString() || '',
      color: car.color || '',
      condition: car.condition,
      description: car.description || '',
      status: car.status,
      nctExpiry: car.nctExpiry ? (car.nctExpiry.includes('T') ? car.nctExpiry.split('T')[0] : car.nctExpiry.split(' ')[0]) : '',
      locationCounty: location?.county || '',
      locationCity: location?.city || location?.town || '',
      locationEircode: location?.eircode || location?.postalCode || ''
    });
    setSelectedCar(car);
    setShowEditModal(true);
  };

  const updateFormField = (field: keyof EditFormData, value: string) => {
    setEditFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleEditSubmit = () => {
    if (!selectedCar || !editFormData) return;

    // Build location object
    const location = editFormData.locationCounty ? {
      county: editFormData.locationCounty,
      city: editFormData.locationCity || undefined,
      town: editFormData.locationCity || undefined,
      eircode: editFormData.locationEircode || undefined,
      postalCode: editFormData.locationEircode || undefined
    } : null;

    // Convert numeric fields
    const updateData: any = {
      title: editFormData.title,
      make: editFormData.make,
      model: editFormData.model,
      year: parseInt(editFormData.year.toString()),
      price: parseFloat(editFormData.price.toString()),
      currency: editFormData.currency,
      condition: editFormData.condition,
      description: editFormData.description,
      status: editFormData.status,
      nctExpiry: editFormData.nctExpiry || null,
      location: location,
      mileage: editFormData.mileage ? parseInt(editFormData.mileage.toString()) : null,
      engineSize: editFormData.engineSize ? parseFloat(editFormData.engineSize.toString()) : null,
      doors: editFormData.doors ? parseInt(editFormData.doors.toString()) : null,
      seats: editFormData.seats ? parseInt(editFormData.seats.toString()) : null,
      fuelType: editFormData.fuelType || null,
      transmission: editFormData.transmission || null,
      bodyType: editFormData.bodyType || null,
      color: editFormData.color || null
    };

    handleCarAction(selectedCar.id, 'edit_car', updateData);
  };

  const fetchCarDetails = async (carId: string) => {
    try {
      const response = await fetch(`/api/admin/cars/${carId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCar(data.car);
      } else {
        const car = cars.find(c => c.id === carId);
        if (car) {
          setSelectedCar(car);
        } else {
          setError('Failed to load car details');
        }
      }
    } catch (error) {
      console.error('Error fetching car details:', error);
      const car = cars.find(c => c.id === carId);
      if (car) {
        setSelectedCar(car);
      } else {
        setError('Failed to load car details');
      }
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchCars();
  };

  const toggleRowExpansion = (carId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(carId)) {
      newExpanded.delete(carId);
    } else {
      newExpanded.add(carId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SOLD': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModerationStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'FLAGGED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeIcon = (user: CarUser) => {
    if (user.role === 'DEALER') {
      return <span className="text-blue-600 font-medium">D</span>;
    }
    return <span className="text-gray-600 font-medium">U</span>;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      moderationStatus: 'all',
      condition: 'all',
      fuelType: 'all',
      make: 'all',
      userType: 'all',
      featured: 'all',
      priceMin: '',
      priceMax: ''
    });
    setCurrentPage(1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cars...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">Attempt {retryCount + 1}</p>
          )}
        </div>
      </div>
    );
  }

  // Error state with no cars
  if (error && cars.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 p-8 rounded-lg mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              {error.includes('Network') ? (
                <WifiOff className="w-8 h-8 text-red-600" />
              ) : (
                <Server className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Cars</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            
            <button
              onClick={handleRetry}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Car className="w-6 h-6 text-blue-600" />
                Car Management
                {totalCars > 0 && (
                  <span className="text-lg text-gray-500 font-normal">({totalCars.toLocaleString()})</span>
                )}
              </h1>
              <p className="text-gray-600 text-sm">Manage all car listings and moderate content</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/admin/cars/add"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Cars for Dealers
              </a>
              
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh car list"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cars..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SOLD">Sold</option>
                <option value="PENDING">Pending</option>
                <option value="EXPIRED">Expired</option>
                <option value="DRAFT">Draft</option>
              </select>

              {/* Moderation Status */}
              <select
                value={filters.moderationStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, moderationStatus: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Moderation</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="FLAGGED">Flagged</option>
              </select>

              {/* User Type */}
              <select
                value={filters.userType}
                onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="USER">Private Sellers</option>
                <option value="DEALER">Dealers</option>
              </select>

              {/* Featured Filter */}
              <select
                value={filters.featured}
                onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Listings</option>
                <option value="true">Featured Only</option>
                <option value="false">Non-Featured</option>
              </select>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
              {/* Condition */}
              <select
                value={filters.condition}
                onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Conditions</option>
                <option value="NEW">New</option>
                <option value="USED">Used</option>
                <option value="CERTIFIED_PRE_OWNED">Certified</option>
              </select>

              {/* Make */}
              <select
                value={filters.make}
                onChange={(e) => setFilters(prev => ({ ...prev, make: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Makes</option>
                <option value="Toyota">Toyota</option>
                <option value="Ford">Ford</option>
                <option value="BMW">BMW</option>
                <option value="Mercedes">Mercedes</option>
                <option value="Audi">Audi</option>
                <option value="Volkswagen">Volkswagen</option>
                <option value="Hyundai">Hyundai</option>
                <option value="Kia">Kia</option>
              </select>

              {/* Fuel Type */}
              <select
                value={filters.fuelType}
                onChange={(e) => setFilters(prev => ({ ...prev, fuelType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Fuel Types</option>
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
                <option value="PLUGIN_HYBRID">Plug-in Hybrid</option>
              </select>

              {/* Price Range */}
              <input
                type="number"
                placeholder="Min Price"
                value={filters.priceMin}
                onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <input
                type="number"
                placeholder="Max Price"
                value={filters.priceMax}
                onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Clear Filters */}
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              <Filter className="w-4 h-4 inline mr-2" />
              Showing {cars.length} of {totalCars} cars
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Message */}
        {error && cars.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
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

        {/* Cars Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price & Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moderation
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cars.map((car) => (
                  <React.Fragment key={car.id}>
                    <tr className="hover:bg-gray-50">
                      {/* Vehicle Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {car.mainImage ? (
                              <img 
                                src={car.mainImage} 
                                alt={car.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {car.year} {car.make} {car.model}
                              </h3>
                              {car.featured && (
                                <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                              )}
                              <button
                                onClick={() => toggleRowExpansion(car.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {expandedRows.has(car.id) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{car.title}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                              {car.mileage && (
                                <span>{car.mileage.toLocaleString()} km</span>
                              )}
                              {car.fuelType && (
                                <span className="flex items-center">
                                  <Fuel className="w-3 h-3 mr-1" />
                                  {car.fuelType}
                                </span>
                              )}
                              {car.transmission && (
                                <span>{car.transmission}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Seller */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {getUserTypeIcon(car.user)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {car.user.role === 'DEALER' && car.user.dealerProfile?.businessName 
                                ? car.user.dealerProfile.businessName
                                : `${car.user.firstName} ${car.user.lastName}`
                              }
                            </div>
                            <div className="text-sm text-gray-500">{car.user.email}</div>
                            {car.user.role === 'DEALER' && car.user.dealerProfile?.verified && (
                              <div className="text-xs text-green-600 flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified Dealer
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price & Stats */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          €{car.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {car.viewsCount} views
                          </div>
                          <div className="flex items-center">
                            <Activity className="w-3 h-3 mr-1" />
                            {car.inquiriesCount} inquiries
                          </div>
                          <div className="flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            {car.likesCount} likes
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(car.status)}`}>
                            {car.status}
                          </span>
                          <div className="text-xs text-gray-500">
                            Created {new Date(car.createdAt).toLocaleDateString()}
                          </div>
                          {car.location && (
                            <div className="text-xs text-gray-400 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {car.location.county || 'Unknown'}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Moderation */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModerationStatusColor(car.moderationStatus)}`}>
                            {car.moderationStatus.replace('_', ' ')}
                          </span>
                          {car.moderatedAt && (
                            <div className="text-xs text-gray-500">
                              {new Date(car.moderatedAt).toLocaleDateString()}
                            </div>
                          )}
                          {car.rejectionReason && (
                            <div className="text-xs text-red-600 truncate max-w-32" title={car.rejectionReason}>
                              {car.rejectionReason}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Details */}
                          <button
                            onClick={() => {
                              fetchCarDetails(car.id);
                              setShowCarDetailsModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Car */}
                          <button
                            onClick={() => openEditModal(car)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Edit Car"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* View Public Page */}
                          <a
                            href={`/cars/${car.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                            title="View Public Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Moderation Actions */}
                          {car.moderationStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleCarAction(car.id, 'moderate', { moderationStatus: 'APPROVED' })}
                                disabled={actionLoading === `moderate-${car.id}`}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                                title="Approve Car"
                              >
                                {actionLoading === `moderate-${car.id}` ? (
                                  <div className="w-4 h-4 animate-spin border-2 border-green-600 border-t-transparent rounded-full"></div>
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason (optional):');
                                  if (reason !== null) {
                                    handleCarAction(car.id, 'moderate', { 
                                      moderationStatus: 'REJECTED',
                                      rejectionReason: reason || 'No reason provided'
                                    });
                                  }
                                }}
                                disabled={actionLoading === `moderate-${car.id}`}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                title="Reject Car"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Toggle Featured */}
                          <button
                            onClick={() => {
                              const featuredUntil = car.featured ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                              handleCarAction(car.id, 'toggle_featured', { 
                                featured: !car.featured, 
                                featuredUntil 
                              });
                            }}
                            disabled={actionLoading === `toggle_featured-${car.id}`}
                            className={`p-2 rounded-md transition-colors disabled:opacity-50 ${
                              car.featured 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={car.featured ? 'Remove Featured' : 'Make Featured'}
                          >
                            {actionLoading === `toggle_featured-${car.id}` ? (
                              <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
                            ) : (
                              <Star className="w-4 h-4" fill={car.featured ? 'currentColor' : 'none'} />
                            )}
                          </button>

                          {/* Delete Car */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${car.title}"? This action cannot be undone.`)) {
                                handleCarAction(car.id, 'delete_car');
                              }
                            }}
                            disabled={actionLoading === `delete_car-${car.id}`}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="Delete Car"
                          >
                            {actionLoading === `delete_car-${car.id}` ? (
                              <div className="w-4 h-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {expandedRows.has(car.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Technical Details */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Technical Details</h4>
                              <div className="space-y-1 text-xs text-gray-600">
                                {car.engineSize && <div>Engine: {car.engineSize}L</div>}
                                {car.doors && <div>Doors: {car.doors}</div>}
                                {car.seats && <div>Seats: {car.seats}</div>}
                                {car.color && <div>Color: {car.color}</div>}
                                {car.bodyType && <div>Body Type: {car.bodyType}</div>}
                              </div>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                              <p className="text-xs text-gray-600 line-clamp-3">
                                {car.description || 'No description provided'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Images */}
                          {car.images && car.images.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Images ({car.images.length})</h4>
                              <div className="flex gap-2 overflow-x-auto">
                                {car.images.slice(0, 6).map((image, index) => (
                                  <div key={image.id} className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                    <img 
                                      src={image.thumbnailUrl || image.originalUrl} 
                                      alt={`Car image ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                                {car.images.length > 6 && (
                                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                                    +{car.images.length - 6}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {cars.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No cars found matching your criteria</p>
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your search term or filters
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-6 rounded-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCars)}</span> of{' '}
                  <span className="font-medium">{totalCars}</span> results
                </p>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Car Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Car: {editFormData.year} {editFormData.make} {editFormData.model}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditFormData(null);
                    setSelectedCar(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => updateFormField('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Make */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Make
                    </label>
                    <input
                      type="text"
                      value={editFormData.make}
                      onChange={(e) => updateFormField('make', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={editFormData.model}
                      onChange={(e) => updateFormField('model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max="2030"
                      value={editFormData.year}
                      onChange={(e) => updateFormField('year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editFormData.price}
                      onChange={(e) => updateFormField('price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={editFormData.currency}
                      onChange={(e) => updateFormField('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  {/* Mileage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mileage (km)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editFormData.mileage}
                      onChange={(e) => updateFormField('mileage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuel Type
                    </label>
                    <select
                      value={editFormData.fuelType}
                      onChange={(e) => updateFormField('fuelType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Fuel Type</option>
                      <option value="PETROL">Petrol</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="ELECTRIC">Electric</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="PLUGIN_HYBRID">Plug-in Hybrid</option>
                    </select>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transmission
                    </label>
                    <select
                      value={editFormData.transmission}
                      onChange={(e) => updateFormField('transmission', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Transmission</option>
                      <option value="MANUAL">Manual</option>
                      <option value="AUTOMATIC">Automatic</option>
                      <option value="SEMI_AUTOMATIC">Semi-Automatic</option>
                    </select>
                  </div>

                  {/* Engine Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Engine Size (L)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editFormData.engineSize}
                      onChange={(e) => updateFormField('engineSize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Body Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body Type
                    </label>
                    <select
                      value={editFormData.bodyType}
                      onChange={(e) => updateFormField('bodyType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Body Type</option>
                      <option value="HATCHBACK">Hatchback</option>
                      <option value="SALOON">Saloon</option>
                      <option value="ESTATE">Estate</option>
                      <option value="SUV">SUV</option>
                      <option value="COUPE">Coupe</option>
                      <option value="CONVERTIBLE">Convertible</option>
                      <option value="VAN">Van</option>
                      <option value="PICKUP">Pickup</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Doors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Doors
                    </label>
                    <select
                      value={editFormData.doors}
                      onChange={(e) => updateFormField('doors', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Doors</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </div>

                  {/* Seats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seats
                    </label>
                    <select
                      value={editFormData.seats}
                      onChange={(e) => updateFormField('seats', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Seats</option>
                      <option value="2">2</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <select
                      value={editFormData.color}
                      onChange={(e) => updateFormField('color', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Color</option>
                      {COLOR_OPTIONS.map(color => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition
                    </label>
                    <select
                      value={editFormData.condition}
                      onChange={(e) => updateFormField('condition', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="NEW">New</option>
                      <option value="USED">Used</option>
                      <option value="CERTIFIED_PRE_OWNED">Certified Pre-Owned</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => updateFormField('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SOLD">Sold</option>
                      <option value="PENDING">Pending</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>

                  {/* NCT Expiry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NCT Expiry
                    </label>
                    <input
                      type="date"
                      value={editFormData.nctExpiry}
                      onChange={(e) => updateFormField('nctExpiry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Location Fields */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Location Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* County */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        County
                      </label>
                      <input
                        type="text"
                        value={editFormData.locationCounty}
                        onChange={(e) => updateFormField('locationCounty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Dublin"
                      />
                    </div>

                    {/* City/Town */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City/Town
                      </label>
                      <input
                        type="text"
                        value={editFormData.locationCity}
                        onChange={(e) => updateFormField('locationCity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Ballsbridge"
                      />
                    </div>

                    {/* Eircode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Eircode
                      </label>
                      <input
                        type="text"
                        value={editFormData.locationEircode}
                        onChange={(e) => updateFormField('locationEircode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., D04 E5W8"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={editFormData.description}
                    onChange={(e) => updateFormField('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter car description..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditFormData(null);
                      setSelectedCar(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === `edit_car-${selectedCar?.id}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {actionLoading === `edit_car-${selectedCar?.id}` ? (
                      <>
                        <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4" />
                        Update Car
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Car Details Modal */}
      {showCarDetailsModal && selectedCar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {selectedCar.mainImage ? (
                      <img 
                        src={selectedCar.mainImage} 
                        alt={selectedCar.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedCar.year} {selectedCar.make} {selectedCar.model}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedCar.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCarDetailsModal(false);
                    setSelectedCar(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Car Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-medium">€{selectedCar.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Year:</span>
                      <span className="font-medium">{selectedCar.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Make/Model:</span>
                      <span className="font-medium">{selectedCar.make} {selectedCar.model}</span>
                    </div>
                    {selectedCar.mileage && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mileage:</span>
                        <span className="font-medium">{selectedCar.mileage.toLocaleString()} km</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Condition:</span>
                      <span className="font-medium">{selectedCar.condition}</span>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Technical Details</h4>
                  <div className="space-y-2 text-sm">
                    {selectedCar.fuelType && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fuel Type:</span>
                        <span className="font-medium">{selectedCar.fuelType}</span>
                      </div>
                    )}
                    {selectedCar.transmission && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Transmission:</span>
                        <span className="font-medium">{selectedCar.transmission}</span>
                      </div>
                    )}
                    {selectedCar.engineSize && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Engine Size:</span>
                        <span className="font-medium">{selectedCar.engineSize}L</span>
                      </div>
                    )}
                    {selectedCar.bodyType && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Body Type:</span>
                        <span className="font-medium">{selectedCar.bodyType}</span>
                      </div>
                    )}
                    {selectedCar.color && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Color:</span>
                        <span className="font-medium">{selectedCar.color}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedCar.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedCar.description}
                  </p>
                </div>
              )}

              {/* Images */}
              {selectedCar.images && selectedCar.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Images ({selectedCar.images.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedCar.images.map((image, index) => (
                      <div key={image.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        <img 
                          src={image.originalUrl} 
                          alt={`Car image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{selectedCar.viewsCount}</p>
                    <p className="text-xs text-blue-800">Views</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{selectedCar.inquiriesCount}</p>
                    <p className="text-xs text-green-800">Inquiries</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-600">{selectedCar.likesCount}</p>
                    <p className="text-xs text-yellow-800">Likes</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/cars/${selectedCar.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Public Page
                  </a>
                  
                  {selectedCar.moderationStatus === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleCarAction(selectedCar.id, 'moderate', { moderationStatus: 'APPROVED' })}
                        className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm font-medium transition-colors"
                      >
                        Approve Car
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason (optional):');
                          if (reason !== null) {
                            handleCarAction(selectedCar.id, 'moderate', { 
                              moderationStatus: 'REJECTED',
                              rejectionReason: reason || 'No reason provided'
                            });
                          }
                        }}
                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition-colors"
                      >
                        Reject Car
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => {
                      const featuredUntil = selectedCar.featured ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                      handleCarAction(selectedCar.id, 'toggle_featured', { 
                        featured: !selectedCar.featured, 
                        featuredUntil 
                      });
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedCar.featured
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedCar.featured ? 'Remove Featured' : 'Make Featured'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}