// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, Car, Heart, MessageCircle, Eye, TrendingUp, Settings, Edit3, MapPin, Phone, Mail, Calendar, Badge, Star, ArrowLeft } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'USER' | 'DEALER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  location?: any;
  createdAt: string;
  _count?: {
    cars: number;
    favorites: number;
    sentInquiries: number;
    receivedInquiries: number;
  };
  dealerProfile?: {
    businessName: string;
    description?: string;
    website?: string;
    verified: boolean;
  };
}

interface RecentCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  views: number;
  inquiries: number;
  createdAt: string;
  images: { thumbnailUrl: string }[];
}

interface Analytics {
  totalViews: number;
  totalInquiries: number;
  totalLikes: number;
  averagePrice: number;
  popularMake: string;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  monthlyData: { [key: string]: { listings: number; views: number; inquiries: number } };
  performanceMetrics: {
    averageViewsPerListing: number;
    averageInquiriesPerListing: number;
    conversionRate: number;
    activeListings: number;
    soldListings: number;
    likesPerListing: number;
  };
  summary: {
    totalCars: number;
    activeCars: number;
    totalViews: number;
    totalInquiries: number;
    totalLikes: number;
    averagePrice: number;
    popularMake: string;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [recentCars, setRecentCars] = useState<RecentCar[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cars' | 'favorites' | 'messages' | 'settings'>('overview');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUser(profileData.user);
        }

        // Fetch recent cars (for sellers/dealers)
        const carsResponse = await fetch('/api/profile/cars');
        if (carsResponse.ok) {
          const carsData = await carsResponse.json();
          setRecentCars(carsData.cars || []);
        }

        // Fetch analytics
        const analyticsResponse = await fetch('/api/profile/analytics');
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData.analytics);
        }

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
          <a href="/login" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            Login
          </a>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'DEALER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN': return 'Administrator';
      case 'DEALER': return 'Dealer';
      default: return 'User';
    }
  };

  const isDealerOrSeller = user.role === 'DEALER' || (user._count?.cars || 0) > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Back to Home Arrow */}
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
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-green-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center ring-4 ring-green-100">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
                <button className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border hover:bg-gray-50">
                  <Edit3 className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                    {formatRole(user.role)}
                  </span>
                  {user.dealerProfile?.verified && (
                    <Badge className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                
                {user.dealerProfile ? (
                  <p className="text-lg text-gray-600 mb-2">{user.dealerProfile.businessName}</p>
                ) : null}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <a 
              href="/profile/edit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Setting</span>
            </a>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'cars', label: isDealerOrSeller ? 'My Listings' : 'Saved Cars', icon: Car },
              { id: 'favorites', label: 'Favorites', icon: Heart },
              { id: 'messages', label: 'Messages', icon: MessageCircle },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
                  activeTab === id 
                    ? 'border-green-600 text-green-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Cars</p>
                    <p className="text-2xl font-bold text-gray-900">{user._count?.cars || 0}</p>
                  </div>
                  <Car className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Favorites</p>
                    <p className="text-2xl font-bold text-gray-900">{user._count?.favorites || 0}</p>
                  </div>
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.totalViews || 0}</p>
                  </div>
                  <Eye className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Inquiries</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.totalInquiries || 0}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Recent Cars */}
            {recentCars.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Listings</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentCars.slice(0, 6).map((car) => (
                      <div key={car.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-gray-200 relative">
                          {car.images.length > 0 ? (
                            <img 
                              src={car.images[0].thumbnailUrl} 
                              alt={`${car.make} ${car.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {car.year} {car.make} {car.model}
                          </h4>
                          <p className="text-xl font-bold text-green-600 mb-2">
                            €{car.price.toLocaleString()}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{car.views}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{car.inquiries}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics.recentActivity.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cars' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isDealerOrSeller ? 'My Car Listings' : 'Saved Cars'}
            </h3>
            <p className="text-gray-600">Car management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Cars</h3>
            <p className="text-gray-600">Favorites management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages</h3>
            <p className="text-gray-600">
              Manage your messages directly from the <a href="/messages" className="text-green-600 hover:underline">Messages page</a>.
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h3>
            <p className="text-gray-600">
              Update your profile information on the <a href="/profile/edit" className="text-green-600 hover:underline">Edit Profile page</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}