'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Heart, Eye, MessageCircle, MapPin, Calendar, Gauge, Fuel, Euro, Trash2, Search, Filter } from 'lucide-react';
import { formatFuelType } from '@/utils/currency';

interface SavedCar {
  id: string;
  carId: string;
  createdAt: string;
  car: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    mileage: number | null;
    fuelType: string | null;
    transmission: string | null;
    bodyType: string | null;
    color: string | null;
    location: any;
    viewsCount: number;
    inquiriesCount: number;
    likesCount: number;
    status: string;
    featured: boolean;
    createdAt: string;
    images: Array<{
      id: string;
      thumbnailUrl: string;
      mediumUrl: string;
      altText: string | null;
    }>;
    user: {
      firstName: string;
      lastName: string;
      role: string;
      dealerProfile?: {
        businessName: string;
        verified: boolean;
      } | null;
    };
  };
}

export default function SavedCarsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [savedCars, setSavedCars] = useState<SavedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price_low, price_high

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        } else {
          router.push('/login?redirect=/saved-cars');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/saved-cars');
      }
    };

    checkAuth();
  }, [router]);

  // Fetch saved cars
  useEffect(() => {
    const fetchSavedCars = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch('/api/profile/saved-cars');
        const data = await response.json();
        
        if (data.success) {
          setSavedCars(data.savedCars);
        } else {
          setError(data.error || 'Failed to load saved cars');
        }
      } catch (error) {
        console.error('Error fetching saved cars:', error);
        setError('Failed to load saved cars');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedCars();
  }, [user]);

  // Remove from saved cars
  const handleRemoveSaved = async (carId: string) => {
    try {
      const response = await fetch(`/api/cars/${carId}/like`, {
        method: 'POST', // This will toggle the like (remove it)
      });

      if (response.ok) {
        // Remove from local state
        setSavedCars(prev => prev.filter(saved => saved.carId !== carId));
      }
    } catch (error) {
      console.error('Error removing saved car:', error);
    }
  };

  // Filter and sort cars
  const filteredAndSortedCars = savedCars
    .filter(saved => {
      if (!searchQuery) return true;
      const car = saved.car;
      const searchTerm = searchQuery.toLowerCase();
      return (
        car.title.toLowerCase().includes(searchTerm) ||
        car.make.toLowerCase().includes(searchTerm) ||
        car.model.toLowerCase().includes(searchTerm) ||
        car.color?.toLowerCase().includes(searchTerm)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_low':
          return a.car.price - b.car.price;
        case 'price_high':
          return b.car.price - a.car.price;
        default:
          return 0;
      }
    });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="saved-cars" />
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
      <Header currentPage="saved-cars" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Heart className="mr-3 text-red-500 fill-current" size={32} />
            Saved Cars
          </h1>
          <p className="text-gray-600">
            Cars you've liked and saved for later. {savedCars.length} {savedCars.length === 1 ? 'car' : 'cars'} saved.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search your saved cars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="newest">Recently Saved</option>
                <option value="oldest">First Saved</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {filteredAndSortedCars.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Heart className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No cars match your search' : 'No saved cars yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start browsing cars and click the heart icon to save your favorites here'
              }
            </p>
            <Link
              href="/cars"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Cars
            </Link>
          </div>
        )}

        {/* Cars Grid */}
        {filteredAndSortedCars.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCars.map((saved) => {
              const car = saved.car;
              const sellerName = car.user.dealerProfile?.businessName || 
                               `${car.user.firstName} ${car.user.lastName}`;
              const isDealer = car.user.role === 'DEALER';

              return (
                <div key={saved.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  {/* Car Image */}
                  <div className="relative">
                    <Link href={`/cars/${car.id}`}>
                      <div className="aspect-[4/3] bg-gray-200 rounded-t-lg overflow-hidden">
                        {car.images && car.images.length > 0 ? (
                          <img
                            src={car.images[0].mediumUrl}
                            alt={car.images[0].altText || car.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Eye size={48} />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Featured Badge */}
                    {car.featured && (
                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Featured
                      </div>
                    )}

                    {/* Remove from Saved */}
                    <button
                      onClick={() => handleRemoveSaved(car.id)}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-sm transition-colors"
                      title="Remove from saved"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </button>

                    {/* Saved Date */}
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      Saved {formatDate(saved.createdAt)}
                    </div>
                  </div>

                  {/* Car Details */}
                  <div className="p-4">
                    {/* Price */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(car.price)}
                      </div>
                      {car.status === 'SOLD' && (
                        <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                          SOLD
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <Link href={`/cars/${car.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-green-600 transition-colors line-clamp-2">
                        {car.title}
                      </h3>
                    </Link>

                    {/* Car Details */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {car.year}
                        </div>
                        {car.mileage && (
                          <div className="flex items-center">
                            <Gauge className="w-4 h-4 mr-1" />
                            {car.mileage.toLocaleString()} km
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {car.fuelType && (
                          <div className="flex items-center">
                            <Fuel className="w-4 h-4 mr-1" />
                            {formatFuelType(car.fuelType)}
                          </div>
                        )}
                        {car.transmission && (
                          <div className="flex items-center">
                            <span className="w-4 h-4 mr-1">⚙️</span>
                            {car.transmission === 'MANUAL' ? 'Manual' : 'Auto'}
                          </div>
                        )}
                      </div>

                      {car.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {typeof car.location === 'string' ? car.location : 
                           car.location.display || 'Location not specified'}
                        </div>
                      )}
                    </div>

                    {/* Seller Info */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${isDealer ? 'bg-blue-500' : 'bg-gray-400'}`} />
                          <span className="text-sm text-gray-600">
                            {isDealer ? 'Dealer' : 'Private'}: {sellerName}
                          </span>
                        </div>
                        {car.user.dealerProfile?.verified && (
                          <div className="text-blue-500" title="Verified Dealer">
                            ✓
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {car.viewsCount}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          {car.inquiriesCount}
                        </span>
                        <span className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          {car.likesCount}
                        </span>
                      </div>
                      <span>Listed {formatDate(car.createdAt)}</span>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4">
                      <Link
                        href={`/cars/${car.id}`}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center block"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}