// src/app/dealers/[id]/page.tsx - Fixed with compatible Car interface
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Star, MapPin, Phone, Globe, Car, Clock, Filter, Grid, List,
  ChevronLeft, Heart, MessageCircle, Share2, CheckCircle,
  User, ThumbsUp, Award, X
} from 'lucide-react';
import Link from 'next/link';
import { formatLocation } from '@/lib/utils';
import CarCard from '@/components/CarCard'; // ✅ Import your main CarCard component
import type { Car as CentralizedCar } from '@/types/car'; // ✅ Import centralized type

// ✅ FIXED: Make local Car interface compatible with centralized Car type
interface Car extends CentralizedCar {
  // Additional fields specific to dealer cars
  status: 'ACTIVE' | 'SOLD' | 'PENDING';
  imageUrl?: string; // Legacy field for backward compatibility
  likes?: number;    // Legacy field for backward compatibility
}

interface Dealer {
  id: string;
  businessName: string;
  description: string;
  aboutUs?: string;
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
  businessHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  cars: Car[];
}

export default function DealerDetailPage() {
  const params = useParams();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'about' | 'all' | 'active' | 'sold' | 'reviews'>('about');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedMake, setSelectedMake] = useState('All Makes');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    comment: '',
    reviewerName: '',
    reviewerEmail: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const [hasInitialized, setHasInitialized] = useState(false); // ✅ Track if we've loaded data

  // ✅ Proper React pattern with useEffect
  useEffect(() => {
    // Only run if we have an ID and haven't initialized yet
    if (!params.id || hasInitialized) return;

    const fetchDealer = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/dealers/${params.id}`);
        if (response.ok) {
          const dealerData = await response.json();
          
          // ✅ SIMPLIFIED: API now provides proper format, minimal transformation needed
          const transformedCars: Car[] = dealerData.cars.map((car: any) => ({
            ...car,
            // Ensure all cars have required fields for CarCard compatibility
            isLiked: car.isLiked || false, // Will be updated by FavoriteButton component
            isFavorited: car.isFavorited || false,
            favoritesCount: car.favoritesCount || 0,
            slug: car.slug || car.id, // Fallback to ID if no slug
          }));

          setDealer({ ...dealerData, cars: transformedCars });
          setFilteredCars(transformedCars);
        } else if (response.status === 404) {
          setDealer(null);
        } else {
          console.error('Failed to fetch dealer');
        }
      } catch (error) {
        console.error('Error fetching dealer:', error);
      } finally {
        setLoading(false);
        setHasInitialized(true); // ✅ Mark as done regardless of success/failure
      }
    };

    fetchDealer();
  }, [params.id]); // ✅ Only depends on params.id, not hasInitialized

  // Fetch reviews when reviews tab is selected
  useEffect(() => {
    if (activeTab === 'reviews' && dealer && reviews.length === 0) {
      fetchReviews();
    }
  }, [activeTab, dealer]);

  const fetchReviews = async () => {
    if (!dealer) return;

    try {
      const response = await fetch(`/api/dealers/${dealer.id}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setReviewStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dealer || reviewForm.rating === 0 || !reviewForm.comment.trim() || !reviewForm.reviewerName.trim()) {
      alert('Please fill in all required fields and select a rating.');
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await fetch(`/api/dealers/${dealer.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewForm)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Review submitted successfully! It will be visible after approval.');
        setShowReviewForm(false);
        setReviewForm({
          rating: 0,
          title: '',
          comment: '',
          reviewerName: '',
          reviewerEmail: ''
        });
        // Refresh reviews to get updated count
        fetchReviews();
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!dealer) return;

    let filtered = dealer.cars;

    // Status filter
    if (activeTab === 'active') {
      filtered = filtered.filter(car => car.status === 'ACTIVE');
    } else if (activeTab === 'sold') {
      filtered = filtered.filter(car => car.status === 'SOLD');
    }

    // Make filter
    if (selectedMake !== 'All Makes') {
      filtered = filtered.filter(car => car.make === selectedMake);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'year_desc':
          return b.year - a.year;
        case 'mileage_asc':
          return (a.mileage || 0) - (b.mileage || 0);
        case 'most_viewed':
          return (b.views || 0) - (a.views || 0);
        default: // newest
          return new Date(b.createdAt || b.updatedAt || '').getTime() - new Date(a.createdAt || a.updatedAt || '').getTime();
      }
    });

    setFilteredCars(filtered);
  }, [dealer, activeTab, selectedMake, sortBy]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-IE').format(mileage);
  };

  const getCurrentDayStatus = () => {
    if (!dealer || !dealer.businessHours) return 'Closed';
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[new Date().getDay()] as keyof typeof dealer.businessHours;
    
    const hours = dealer.businessHours[currentDay];
    if (!hours || hours.open === 'Closed') return 'Closed';
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTime = parseInt(hours.open.split(':')[0]) * 60 + parseInt(hours.open.split(':')[1]);
    const closeTime = parseInt(hours.close.split(':')[0]) * 60 + parseInt(hours.close.split(':')[1]);
    
    if (currentTime >= openTime && currentTime <= closeTime) {
      return `Open until ${hours.close}`;
    } else if (currentTime < openTime) {
      return `Opens at ${hours.open}`;
    } else {
      return 'Closed';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dealer information...</p>
        </div>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dealer not found</h2>
          <p className="text-gray-600 mb-4">The dealer you're looking for doesn't exist.</p>
          <Link href="/find-dealer" className="text-green-600 hover:underline">
            Back to Find Dealers
          </Link>
        </div>
      </div>
    );
  }

  const activeCars = dealer.cars.filter(car => car.status === 'ACTIVE').length;
  const soldCars = dealer.cars.filter(car => car.status === 'SOLD').length;
  const makes = ['All Makes', ...Array.from(new Set(dealer.cars.map(car => car.make)))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/find-dealer" className="flex items-center text-green-600 hover:text-green-700">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Find Dealers
          </Link>
        </div>
      </div>

      {/* Dealer Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Mobile Layout - Stack vertically */}
          <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Logo and Title Section */}
            <div className="flex items-start space-x-4 sm:flex-col sm:space-x-0 sm:space-y-4">
              {dealer.logoUrl ? (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                  <img src={dealer.logoUrl} alt={`${dealer.businessName} logo`} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-lg sm:text-2xl tracking-wide">
                    {dealer.businessName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Title and verified badge - mobile */}
              <div className="flex-1 sm:hidden">
                <div className="flex flex-col space-y-2">
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">{dealer.businessName}</h1>
                  {dealer.verified && (
                    <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs self-start">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Title and verified badge - desktop */}
              <div className="hidden sm:flex sm:items-center sm:space-x-3 sm:mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{dealer.businessName}</h1>
                {dealer.verified && (
                  <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified Dealer
                  </div>
                )}
              </div>

              {/* Stats - Mobile: Stack, Desktop: Horizontal */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current text-yellow-400 mr-1" />
                  <span className="font-medium">{dealer.rating}</span>
                  <span className="ml-1">({dealer.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center">
                  <Car className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span>{dealer.carCount} cars in stock</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span>{getCurrentDayStatus()}</span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 leading-relaxed">{dealer.description}</p>

              {dealer.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                  {dealer.specialties.map((specialty, index) => (
                    <span key={index} className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 text-xs sm:text-sm rounded-full">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}

              {/* Contact Info - Stack on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{formatLocation(dealer.location)}</span>
                </div>
                {dealer.phoneNumber && (
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-gray-400 flex-shrink-0" />
                    <span>{dealer.phoneNumber}</span>
                  </div>
                )}
                {dealer.websiteUrl && (
                  <div className="flex items-center text-xs sm:text-sm">
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-gray-400 flex-shrink-0" />
                    <a href={dealer.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline truncate">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Mobile: Full width, Desktop: Side */}
            <div className="flex space-x-2 sm:space-x-3 sm:flex-col sm:w-auto">
              {dealer.phoneNumber && (
                <a
                  href={`tel:${dealer.phoneNumber}`}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center text-sm sm:text-base"
                >
                  <Phone className="w-4 h-4 mr-1 sm:mr-2 inline" />
                  <span className="hidden sm:inline">Call Dealer</span>
                  <span className="sm:hidden">Call</span>
                </a>
              )}
              <button className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                <Share2 className="w-4 h-4" />
                <span className="ml-1 sm:hidden text-sm">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex space-x-4 sm:space-x-8 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('about')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'about'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Cars ({dealer.cars.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'active'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available ({activeCars})
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'sold'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sold ({soldCars})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reviews ({dealer.reviewCount})
            </button>
          </div>

          {/* Filters - Only show for car tabs */}
          {activeTab !== 'about' && activeTab !== 'reviews' && (
            <div className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
                >
                  {makes.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="year_desc">Year: Newest First</option>
                  <option value="mileage_asc">Mileage: Low to High</option>
                  <option value="most_viewed">Most Viewed</option>
                </select>
              </div>

              {/* Results Count and View Toggle */}
              <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                <span className="text-xs sm:text-sm text-gray-600">
                  {filteredCars.length} car{filteredCars.length !== 1 ? 's' : ''}
                </span>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <List className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'about' ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">About {dealer.businessName}</h2>

              <div className="prose prose-gray max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  {dealer.aboutUs || dealer.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-24">Joined:</span>
                        <span className="text-gray-900">{new Date(dealer.joinedDate).toLocaleDateString('en-IE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-24">Location:</span>
                        <span className="text-gray-900">{formatLocation(dealer.location)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-24">Cars:</span>
                        <span className="text-gray-900">{dealer.carCount} in stock</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-24">Response:</span>
                        <span className="text-gray-900">{dealer.responseTime}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Hours</h3>
                    <div className="space-y-2">
                      {Object.entries(dealer.businessHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="font-medium text-gray-600 capitalize">{day}:</span>
                          <span className="text-gray-900">
                            {hours.open === 'Closed' ? 'Closed' : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {dealer.specialties.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {dealer.specialties.map((specialty, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-current text-yellow-400 mr-1" />
                          <span className="font-medium">{dealer.rating}</span>
                          <span className="ml-1">({dealer.reviewCount} reviews)</span>
                        </div>
                        {dealer.verified && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Verified Dealer</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      {dealer.phoneNumber && (
                        <a
                          href={`tel:${dealer.phoneNumber}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Call Dealer
                        </a>
                      )}
                      {dealer.websiteUrl && (
                        <a
                          href={dealer.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'reviews' ? (
          <div className="max-w-4xl mx-auto">
            {/* Review Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.floor(dealer.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-lg font-semibold text-gray-900">
                        {dealer.rating > 0 ? dealer.rating : 'No reviews'}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      ({dealer.reviewCount} review{dealer.reviewCount !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowReviewForm(true)}
                  className="mt-4 md:mt-0 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Write a Review
                </button>
              </div>

              {/* Rating Breakdown */}
              {reviewStats && reviewStats.ratingBreakdown && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
                    <div className="space-y-2">
                      {reviewStats.ratingBreakdown.reverse().map((rating: any) => (
                        <div key={rating.rating} className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-600 w-8">
                            {rating.rating}★
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{ width: `${rating.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12">
                            {rating.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {reviewStats.averageRating || 0}
                    </div>
                    <div className="flex justify-center items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= Math.floor(reviewStats.averageRating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">
                      Based on {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        {review.reviewer.avatar ? (
                          <img
                            src={review.reviewer.avatar}
                            alt={review.reviewer.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-lg">
                            {review.reviewer.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {review.reviewer.name}
                              {review.isVerifiedPurchase && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  <Award className="w-3 h-3 mr-1" />
                                  Verified Purchase
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {review.title && (
                          <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                        )}

                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-600 mb-4">
                    Be the first to review {dealer.businessName}
                  </p>
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Write the First Review
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters</p>
            <button
              onClick={() => {
                setSelectedMake('All Makes');
                setActiveTab('all');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}>
            {filteredCars.map((car) => (
              // ✅ Use your main CarCard component - now fully compatible!
              <CarCard 
                key={car.id} 
                car={car} 
                variant={viewMode === 'list' ? 'list' : 'grid'}
                showPerformance={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Review {dealer?.businessName}
                </h3>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewForm.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 hover:text-yellow-400'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                  {reviewForm.rating > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {reviewForm.rating} star{reviewForm.rating !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Great service and selection"
                    maxLength={100}
                  />
                </div>

                {/* Review Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review *
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={4}
                    placeholder="Share your experience with this dealer..."
                    minLength={10}
                    maxLength={1000}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reviewForm.comment.length}/1000 characters (minimum 10)
                  </p>
                </div>

                {/* Reviewer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={reviewForm.reviewerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="How should we display your name?"
                    required
                    maxLength={50}
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={reviewForm.reviewerEmail}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - won't be displayed publicly
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submittingReview}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview || reviewForm.rating === 0 || !reviewForm.comment.trim() || !reviewForm.reviewerName.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Reviews are moderated and will appear after approval. Please be respectful and honest.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}