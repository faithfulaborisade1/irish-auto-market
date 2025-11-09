'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Car, Eye, MessageCircle, Heart, MapPin, Calendar, Gauge, Fuel, Euro, Edit, Trash2, Plus, MoreVertical, Star, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatFuelType } from '@/utils/currency';

interface UserCar {
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
  featuredUntil: string | null;
  moderationStatus: string;
  createdAt: string;
  updatedAt: string;
  images: Array<{
    id: string;
    thumbnailUrl: string;
    mediumUrl: string;
    altText: string | null;
  }>;
}

export default function MyAdsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cars, setCars] = useState<UserCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all'); // all, active, sold, pending, expired
  const [sortBy, setSortBy] = useState('newest');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        } else {
          router.push('/login?redirect=/my-ads');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/my-ads');
      }
    };

    checkAuth();
  }, [router]);

  // Fetch user's cars
  useEffect(() => {
    const fetchUserCars = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch('/api/profile/cars');
        const data = await response.json();
        
        if (data.success) {
          setCars(data.cars);
        } else {
          setError(data.error || 'Failed to load your cars');
        }
      } catch (error) {
        console.error('Error fetching user cars:', error);
        setError('Failed to load your cars');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCars();
  }, [user]);

  // Delete car
  const handleDeleteCar = async (carId: string) => {
    try {
      const response = await fetch(`/api/cars/${carId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCars(prev => prev.filter(car => car.id !== carId));
        setShowDeleteModal(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete car');
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      setError('Failed to delete car');
    }
  };

  // Filter and sort cars
  const filteredAndSortedCars = cars
    .filter(car => {
      switch (filter) {
        case 'active':
          return car.status === 'ACTIVE';
        case 'sold':
          return car.status === 'SOLD';
        case 'pending':
          return car.status === 'PENDING' || car.moderationStatus === 'PENDING';
        case 'expired':
          return car.status === 'EXPIRED';
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'most_viewed':
          return b.viewsCount - a.viewsCount;
        case 'most_inquiries':
          return b.inquiriesCount - a.inquiriesCount;
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string, moderationStatus?: string) => {
    if (moderationStatus === 'PENDING') return 'text-yellow-600 bg-yellow-100';
    if (moderationStatus === 'REJECTED') return 'text-red-600 bg-red-100';
    
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'SOLD': return 'text-blue-600 bg-blue-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'EXPIRED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string, moderationStatus?: string) => {
    if (moderationStatus === 'PENDING') return 'Under Review';
    if (moderationStatus === 'REJECTED') return 'Rejected';
    
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'SOLD': return 'Sold';
      case 'PENDING': return 'Pending';
      case 'EXPIRED': return 'Expired';
      default: return status;
    }
  };

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

  const getCounts = () => {
    return {
      all: cars.length,
      active: cars.filter(c => c.status === 'ACTIVE').length,
      sold: cars.filter(c => c.status === 'SOLD').length,
      pending: cars.filter(c => c.status === 'PENDING' || c.moderationStatus === 'PENDING').length,
      expired: cars.filter(c => c.status === 'EXPIRED').length,
    };
  };

  const counts = getCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="my-ads" />
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
      <Header currentPage="my-ads" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Car className="mr-3 text-green-600" size={32} />
              My Ads
            </h1>
            <p className="text-gray-600">
              Manage your car listings and track their performance
            </p>
          </div>
          
          <Link
            href="/place-ad"
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="mr-2" size={20} />
            Add New Car
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex flex-wrap border-b">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'active', label: 'Active', count: counts.active },
              { key: 'sold', label: 'Sold', count: counts.sold },
              { key: 'pending', label: 'Pending', count: counts.pending },
              { key: 'expired', label: 'Expired', count: counts.expired },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  filter === tab.key
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Showing {filteredAndSortedCars.length} of {cars.length} cars
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_high">Price: High to Low</option>
                <option value="price_low">Price: Low to High</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="most_inquiries">Most Inquiries</option>
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
            <Car className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No cars listed yet' : `No ${filter} cars`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Start selling by creating your first car listing'
                : `You don't have any ${filter} cars at the moment`
              }
            </p>
            {filter === 'all' && (
              <Link
                href="/place-ad"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="mr-2" size={20} />
                List Your First Car
              </Link>
            )}
          </div>
        )}

        {/* Cars Grid */}
        {filteredAndSortedCars.length > 0 && (
          <div className="space-y-4">
            {filteredAndSortedCars.map((car) => (
              <div key={car.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  {/* Car Image */}
                  <div className="md:w-80 relative">
                    <Link href={`/cars/${car.id}`}>
                      <div className="aspect-[4/3] md:aspect-[4/3] bg-gray-200 rounded-t-lg md:rounded-l-lg md:rounded-tr-none overflow-hidden">
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
                      <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Featured
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${getStatusColor(car.status, car.moderationStatus)}`}>
                      {getStatusText(car.status, car.moderationStatus)}
                    </div>
                  </div>

                  {/* Car Details */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        {/* Price */}
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {formatPrice(car.price)}
                        </div>

                        {/* Title */}
                        <Link href={`/cars/${car.id}`}>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-green-600 transition-colors">
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
                            {car.fuelType && (
                              <div className="flex items-center">
                                <Fuel className="w-4 h-4 mr-1" />
                                {formatFuelType(car.fuelType)}
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

                        {/* Performance Stats */}
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="font-medium">{car.viewsCount}</span> views
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            <span className="font-medium">{car.inquiriesCount}</span> inquiries
                          </div>
                          <div className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            <span className="font-medium">{car.likesCount}</span> likes
                          </div>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <div className="relative ml-4">
                        <div className="flex flex-col space-y-2">
                          <Link
                            href={`/cars/${car.id}/edit`}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border"
                            title="Edit listing"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                          <button
                            onClick={() => setShowDeleteModal(car.id)}
                            className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200"
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center justify-between pt-4 border-t text-xs text-gray-500">
                      <span>Listed: {formatDate(car.createdAt)}</span>
                      <span>Updated: {formatDate(car.updatedAt)}</span>
                      {car.featuredUntil && new Date(car.featuredUntil) > new Date() && (
                        <span className="text-orange-600">
                          Featured until: {formatDate(car.featuredUntil)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <XCircle className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Car Listing</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this car listing? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCar(showDeleteModal)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}