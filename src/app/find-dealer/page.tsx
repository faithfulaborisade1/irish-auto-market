// src/app/find-dealer/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Phone, Globe, Car, Star, ChevronRight, Filter, Grid, List, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { formatLocation } from '@/lib/utils';
import { IRISH_COUNTIES } from '@/data/counties';

interface Dealer {
  id: string;
  businessName: string;
  description: string;
  logoUrl?: string;
  websiteUrl?: string;
  phoneNumber: string;
  location: {
    county: string;
    city: string;
    address: string;
  };
  rating: number;
  reviewCount: number;
  carCount: number;
  specialties: string[];
  verified: boolean;
  subscription: string;
  joinedDate: string;
  responseTime: string;
}

const counties = ['All Counties', ...IRISH_COUNTIES];

export default function FindDealerPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Separate state for input
  const [selectedCounty, setSelectedCounty] = useState('All Counties');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Enhanced filter states
  const [selectedSubscription, setSelectedSubscription] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minCars, setMinCars] = useState(0);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Debounced search function
  const debouncedSearch = useCallback((term: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      setSearchTerm(term);
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    }, 500);
    
    setSearchTimeout(timeout);
  }, [searchTimeout]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Handle search button click
  const handleSearchSubmit = () => {
    setSearchTerm(searchInput);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Fetch dealers when filters change
  useEffect(() => {
    const fetchDealers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          sortBy: sortBy
        });

        // Add search parameter if exists
        if (searchTerm && searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }

        // Add county filter if not "All Counties"
        if (selectedCounty !== 'All Counties') {
          params.append('county', selectedCounty);
        }

        // Add enhanced filters
        if (selectedSubscription !== 'all') {
          params.append('subscription', selectedSubscription);
        }

        if (verifiedOnly) {
          params.append('verified', 'true');
        }

        if (minRating > 0) {
          params.append('minRating', minRating.toString());
        }

        if (minCars > 0) {
          params.append('minCars', minCars.toString());
        }

        if (selectedSpecialties.length > 0) {
          params.append('specialties', selectedSpecialties.join(','));
        }

        console.log('Fetching dealers with params:', params.toString());

        const response = await fetch(`/api/dealers?${params}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Dealers response:', data);
          setDealers(data.dealers || []);
          setPagination(data.pagination || {
            page: 1,
            limit: 12,
            total: 0,
            pages: 0
          });
        } else {
          console.error('Failed to fetch dealers, status:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          setDealers([]);
        }
      } catch (error) {
        console.error('Error fetching dealers:', error);
        setDealers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDealers();
  }, [searchTerm, selectedCounty, selectedSubscription, verifiedOnly, minRating, minCars, selectedSpecialties, sortBy, pagination.page]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getSubscriptionBadge = (subscription: string) => {
    const badges = {
      BASIC: { text: 'Basic', class: 'bg-gray-100 text-gray-800' },
      PREMIUM: { text: 'Premium', class: 'bg-blue-100 text-blue-800' },
      ENTERPRISE: { text: 'Enterprise', class: 'bg-green-100 text-green-800' }
    };
    return badges[subscription as keyof typeof badges] || badges.BASIC;
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedCounty('All Counties');
    setSelectedSubscription('all');
    setVerifiedOnly(false);
    setMinRating(0);
    setMinCars(0);
    setSelectedSpecialties([]);
    setSortBy('newest');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Helper function to check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm || selectedCounty !== 'All Counties' || selectedSubscription !== 'all' ||
           verifiedOnly || minRating > 0 || minCars > 0 || selectedSpecialties.length > 0 || sortBy !== 'newest';
  };

  // Toggle specialty filter
  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  // Common specialties list
  const commonSpecialties = [
    'Luxury Cars', 'Electric Vehicles', 'Family Cars', 'Sports Cars',
    'Commercial Vehicles', 'Classic Cars', 'Hybrid Vehicles', 'Convertibles'
  ];

  const DealerCard = ({ dealer }: { dealer: Dealer }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {dealer.logoUrl ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                <img
                  src={dealer.logoUrl}
                  alt={`${dealer.businessName} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white font-bold text-lg tracking-wide">
                  {dealer.businessName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-xl font-semibold text-gray-900">{dealer.businessName}</h3>
                {dealer.verified && (
                  <div className="flex items-center text-green-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-xs ml-1">Verified</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-current text-yellow-400 mr-1" />
                  <span className="font-medium">{dealer.rating}</span>
                  <span className="ml-1">({dealer.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center">
                  <Car className="w-4 h-4 mr-1" />
                  <span>{dealer.carCount} cars</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSubscriptionBadge(dealer.subscription).class}`}>
            {getSubscriptionBadge(dealer.subscription).text}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-600 mb-4 line-clamp-2">{dealer.description}</p>

        {/* Location & Contact */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span>{formatLocation(dealer.location)}</span>
          </div>
          {dealer.phoneNumber && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              <span>{dealer.phoneNumber}</span>
            </div>
          )}
          {dealer.websiteUrl && (
            <div className="flex items-center text-sm text-gray-600">
              <Globe className="w-4 h-4 mr-2 text-gray-400" />
              <a href={dealer.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                Visit Website
              </a>
            </div>
          )}
        </div>

        {/* Specialties */}
        {dealer.specialties && dealer.specialties.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Specializes in:</p>
            <div className="flex flex-wrap gap-2">
              {dealer.specialties.map((specialty, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Link
            href={`/dealers/${dealer.id}`}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <span>View All Cars</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
          {dealer.phoneNumber && (
            <a
              href={`tel:${dealer.phoneNumber}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header currentPage="dealers" />

      {/* Back to Home Arrow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link 
          href="/" 
          className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gray-900 text-white py-16 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Find Dealerships in Ireland</h1>
            <p className="text-xl text-gray-100 mb-8">Connect with trusted car dealers across Ireland</p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-2">
              <div className="flex items-center">
                <Search className="w-5 h-5 text-gray-400 ml-3" />
                <input
                  type="text"
                  placeholder="Search by dealer name, location, or car brand..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none"
                />
                <button 
                  onClick={handleSearchSubmit}
                  className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 lg:hidden"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters() && (
                  <span className="bg-green-600 text-white text-xs rounded-full w-2 h-2"></span>
                )}
              </button>

              {/* Desktop Filters - First Row */}
              <div className="hidden lg:flex items-center space-x-4">
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  {counties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>

                <select
                  value={selectedSubscription}
                  onChange={(e) => setSelectedSubscription(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="all">All Subscriptions</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Verified Only</span>
                </label>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="cars">Most Cars</option>
                  <option value="name">A-Z</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="hidden lg:block px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {pagination.total} dealer{pagination.total !== 1 ? 's' : ''} found
              </span>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters - Desktop Second Row */}
          <div className="hidden lg:block mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              {/* Minimum Rating */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Min Rating:</span>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value={0}>Any</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>

              {/* Minimum Cars */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Min Cars:</span>
                <select
                  value={minCars}
                  onChange={(e) => setMinCars(parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value={0}>Any</option>
                  <option value={5}>5+ Cars</option>
                  <option value={10}>10+ Cars</option>
                  <option value={25}>25+ Cars</option>
                  <option value={50}>50+ Cars</option>
                </select>
              </div>

              {/* Specialties */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Specialties:</span>
                <div className="flex flex-wrap gap-2">
                  {commonSpecialties.slice(0, 4).map((specialty) => (
                    <button
                      key={specialty}
                      onClick={() => toggleSpecialty(specialty)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        selectedSpecialties.includes(specialty)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                  {selectedSpecialties.length > 0 && (
                    <button
                      onClick={() => setSelectedSpecialties([])}
                      className="px-2 py-1 text-xs text-green-600 hover:text-green-700 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="mt-4 space-y-4 lg:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {counties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>

                <select
                  value={selectedSubscription}
                  onChange={(e) => setSelectedSubscription(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Subscriptions</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="cars">Most Cars</option>
                  <option value="name">A-Z</option>
                </select>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Verified Only</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Min Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={0}>Any</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Min Cars</label>
                  <select
                    value={minCars}
                    onChange={(e) => setMinCars(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value={0}>Any</option>
                    <option value={5}>5+ Cars</option>
                    <option value={10}>10+ Cars</option>
                    <option value={25}>25+ Cars</option>
                    <option value={50}>50+ Cars</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Specialties</label>
                <div className="flex flex-wrap gap-2">
                  {commonSpecialties.map((specialty) => (
                    <button
                      key={specialty}
                      onClick={() => toggleSpecialty(specialty)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        selectedSpecialties.includes(specialty)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dealers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : dealers.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No dealers found</h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters()
                ? 'Try adjusting your search criteria or filters'
                : 'No dealers are currently available'
              }
            </p>
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {dealers.map((dealer) => (
                <DealerCard key={dealer.id} dealer={dealer} />
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {[...Array(Math.min(5, pagination.pages))].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`px-3 py-2 border rounded-lg ${
                        pagination.page === pageNum
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}