// src/components/profile/SellerProfile.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Car, 
  TrendingUp, 
  MessageCircle, 
  Settings, 
  User, 
  ArrowLeft,
  Eye,
  Heart,
  Plus,
  Camera,
  X,
  Edit3,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface SellerProfileProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  };
}

interface SellerCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  viewsCount: number;
  likesCount: number;
  inquiriesCount: number;
  createdAt: string;
  images: { thumbnailUrl: string }[];
}

interface SellerAnalytics {
  totalCars: number;
  activeCars: number;
  soldCars: number;
  totalViews: number;
  totalInquiries: number;
  totalLikes: number;
  averagePrice: number;
  averageViewsPerCar: number;
  conversionRate: number;
  monthlyPerformance: {
    month: string;
    views: number;
    inquiries: number;
    listings: number;
  }[];
}

export default function SellerProfile({ user: initialUser }: SellerProfileProps) {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<'listings' | 'performance' | 'messages' | 'settings'>('listings');
  const [cars, setCars] = useState<SellerCar[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  useEffect(() => {
    fetchCars();
    fetchAnalytics();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await fetch('/api/profile/cars');
      if (response.ok) {
        const data = await response.json();
        setCars(data.cars || []);
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/profile/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleAvatarUpload = async (uploadedImages: any[]) => {
    if (uploadedImages.length > 0) {
      const avatarUrl = uploadedImages[0].url;
      
      try {
        const response = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl })
        });

        if (response.ok) {
          setUser({ ...user, avatar: avatarUrl });
          setShowImageUpload(false);
        }
      } catch (error) {
        console.error('Error updating avatar:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SOLD': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Back to Home */}
          <div className="mb-6">
            <a 
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </a>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              {/* Profile Photo */}
              <div className="relative">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-4 ring-blue-100">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
                <button
                  onClick={() => setShowImageUpload(true)}
                  className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Car Seller
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Car className="w-4 h-4" />
                    <span>{analytics?.activeCars || 0} active listings</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{analytics?.totalViews || 0} total views</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <a 
                href="/place-ad"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>List a Car</span>
              </a>
              <a 
                href="/profile/edit"
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </a>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Active</p>
                  <p className="text-2xl font-bold text-blue-900">{analytics?.activeCars || 0}</p>
                </div>
                <Car className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Views</p>
                  <p className="text-2xl font-bold text-green-900">{analytics?.totalViews || 0}</p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Inquiries</p>
                  <p className="text-2xl font-bold text-purple-900">{analytics?.totalInquiries || 0}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Avg Price</p>
                  <p className="text-2xl font-bold text-orange-900">€{analytics?.averagePrice?.toLocaleString() || '0'}</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'listings', label: 'My Listings', icon: Car, count: cars.length },
              { id: 'performance', label: 'Performance', icon: TrendingUp },
              { id: 'messages', label: 'Messages', icon: MessageCircle },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
                  activeTab === id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
                {count !== undefined && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Car Listings</h2>
              <a 
                href="/place-ad"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Car</span>
              </a>
            </div>

            {cars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <div key={car.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-200 relative">
                      {car.images.length > 0 ? (
                        <img 
                          src={car.images[0].thumbnailUrl} 
                          alt={car.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(car.status)}`}>
                          {car.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {car.year} {car.make} {car.model}
                      </h3>
                      <p className="text-xl font-bold text-blue-600 mb-3">
                        €{car.price.toLocaleString()}
                      </p>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{car.viewsCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{car.likesCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{car.inquiriesCount}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <a
                          href={`/cars/${car.id}/edit`}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-md text-sm font-medium text-center hover:bg-gray-200 transition-colors"
                        >
                          Edit
                        </a>
                        <a
                          href={`/cars/${car.id}`}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium text-center hover:bg-blue-700 transition-colors"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No cars listed yet</h3>
                <p className="text-gray-600 mb-6">Start selling by creating your first car listing!</p>
                <a 
                  href="/place-ad"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>List Your First Car</span>
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
            
            {analytics ? (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Average Views</h3>
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{Math.round(analytics.averageViewsPerCar || 0)}</p>
                    <p className="text-sm text-gray-500">per listing</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Conversion Rate</h3>
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">{(analytics.conversionRate || 0).toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">views to inquiries</p>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Cars Sold</h3>
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{analytics.soldCars || 0}</p>
                    <p className="text-sm text-gray-500">out of {analytics.totalCars}</p>
                  </div>
                </div>

                {/* Monthly Performance Chart */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Performance</h3>
                  <div className="space-y-4">
                    {analytics.monthlyPerformance?.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{month.month}</h4>
                          <p className="text-sm text-gray-500">{month.listings} listings</p>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-blue-600">{month.views}</p>
                            <p className="text-xs text-gray-500">Views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-purple-600">{month.inquiries}</p>
                            <p className="text-xs text-gray-500">Inquiries</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No data available</h3>
                <p className="text-gray-600">List some cars to see your performance analytics!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Messages</h3>
            <p className="text-gray-600 mb-6">
              Manage conversations with potential buyers
            </p>
            <a 
              href="/messages"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Open Messages</span>
            </a>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Settings</h3>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Personal Information
                </h4>
                <p className="text-gray-600 text-sm mb-3">
                  Update your name, email, phone number, and location.
                </p>
                <a 
                  href="/profile/edit" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Update Profile Picture</h3>
                <button
                  onClick={() => setShowImageUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <ImageUpload
                onImagesChange={handleAvatarUpload}
                maxImages={1}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}