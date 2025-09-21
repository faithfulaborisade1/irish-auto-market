// src/components/profile/DealerProfile.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  MessageCircle, 
  Settings, 
  User, 
  ArrowLeft,
  Car,
  Eye,
  DollarSign,
  Plus,
  Camera,
  X,
  Edit3,
  Users,
  BarChart3,
  Calendar,
  Award,
  Target,
  Zap,
  Clock
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface DealerProfileProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  };
}

interface DealerCar {
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

interface DealerAnalytics {
  totalCars: number;
  activeCars: number;
  soldCars: number;
  totalViews: number;
  totalInquiries: number;
  totalLeads: number;
  conversionRate: number;
  averagePrice: number;
  totalRevenue: number;
  monthlyRevenue: number;
  topPerformingMake: string;
  averageDaysToSell: number;
  profileVisits: number;
  monthlyPerformance: {
    month: string;
    revenue: number;
    carsSold: number;
    newInquiries: number;
    profileViews: number;
  }[];
  leadSources: {
    source: string;
    count: number;
    percentage: number;
  }[];
}

interface DealerProfile {
  businessName: string;
  verified: boolean;
  subscriptionType: string;
  description?: string;
  website?: string;
  logo?: string;
}

export default function DealerProfile({ user: initialUser }: DealerProfileProps) {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'analytics' | 'leads' | 'settings'>('dashboard');
  const [cars, setCars] = useState<DealerCar[]>([]);
  const [analytics, setAnalytics] = useState<DealerAnalytics | null>(null);
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  useEffect(() => {
    fetchDealerData();
    fetchCars();
    fetchAnalytics();
  }, []);

  const fetchDealerData = async () => {
    try {
      const response = await fetch('/api/profile/dealer');
      if (response.ok) {
        const data = await response.json();
        setDealerProfile(data.dealerProfile);
      }
    } catch (error) {
      console.error('Error fetching dealer data:', error);
    }
  };

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
      const response = await fetch('/api/profile/dealer/analytics');
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

  const getSubscriptionBadge = (type: string) => {
    switch (type) {
      case 'PREMIUM': return 'bg-purple-100 text-purple-800';
      case 'PROFESSIONAL': return 'bg-blue-100 text-blue-800';
      case 'BASIC': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {/* Back to Home */}
          <div className="mb-4 sm:mb-6">
            <a
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </a>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Profile Photo */}
              <div className="relative self-center sm:self-auto">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={dealerProfile?.businessName || `${user.firstName} ${user.lastName}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-purple-100"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center ring-4 ring-purple-100">
                    <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
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
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {dealerProfile?.businessName || `${user.firstName} ${user.lastName}`}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      Dealer
                    </span>
                    {dealerProfile?.verified && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 flex items-center space-x-1">
                        <Award className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                    {dealerProfile?.subscriptionType && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionBadge(dealerProfile.subscriptionType)}`}>
                        {dealerProfile.subscriptionType}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
                  <div className="flex items-center justify-center sm:justify-start space-x-1">
                    <Car className="w-4 h-4" />
                    <span>{analytics?.activeCars || 0} active listings</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{analytics?.profileVisits || 0} profile visits</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>€{analytics?.monthlyRevenue?.toLocaleString() || '0'} this month</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center lg:justify-end space-x-3">
              <a
                href="/place-ad"
                className="bg-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Car</span>
              </a>
              <a
                href="/profile/edit"
                className="bg-gray-100 text-gray-700 px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
                <Settings className="w-4 h-4 sm:hidden" />
              </a>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 sm:space-x-8 border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'inventory', label: 'Inventory', icon: Car, count: cars.length },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'leads', label: 'Leads', icon: Users, count: analytics?.totalLeads },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm sm:text-base">{label}</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Monthly Revenue</h3>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">€{analytics?.monthlyRevenue?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500">this month</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Active Listings</h3>
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{analytics?.activeCars || 0}</p>
                <p className="text-sm text-gray-500">of {analytics?.totalCars || 0} total</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm font-medium text-gray-600">New Leads</h3>
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{analytics?.totalLeads || 0}</p>
                <p className="text-sm text-gray-500">this month</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Conversion Rate</h3>
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{analytics?.conversionRate?.toFixed(1) || '0'}%</p>
                <p className="text-sm text-gray-500">leads to sales</p>
              </div>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Performance Summary */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Performance Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Total Views</p>
                      <p className="text-sm text-gray-500">All time</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{analytics?.totalViews?.toLocaleString() || '0'}</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Cars Sold</p>
                      <p className="text-sm text-gray-500">This year</p>
                    </div>
                    <p className="text-xl font-bold text-green-600">{analytics?.soldCars || 0}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Avg. Days to Sell</p>
                      <p className="text-sm text-gray-500">Based on sold cars</p>
                    </div>
                    <p className="text-xl font-bold text-purple-600">{analytics?.averageDaysToSell || 0}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Top Brand</p>
                      <p className="text-sm text-gray-500">Most popular</p>
                    </div>
                    <p className="text-xl font-bold text-orange-600">{analytics?.topPerformingMake || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Recent Activity</h3>
                <div className="space-y-3 text-gray-600">
                  <p className="text-sm">No recent activity to display.</p>
                  <p className="text-sm">Start listing cars to see your activity here!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory Management</h2>
              <a
                href="/place-ad"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Car</span>
              </a>
            </div>

            {cars.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cars.map((car) => (
                          <tr key={car.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden">
                                  {car.images.length > 0 ? (
                                    <img
                                      src={car.images[0].thumbnailUrl}
                                      alt={car.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Car className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{car.year} {car.make} {car.model}</div>
                                  <div className="text-sm text-gray-500">Listed {new Date(car.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">€{car.price.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(car.status)}`}>
                                {car.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                  <Eye className="w-4 h-4 mr-1" />
                                  {car.viewsCount}
                                </div>
                                <div className="flex items-center">
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  {car.inquiriesCount}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <a href={`/cars/${car.id}/edit`} className="text-purple-600 hover:text-purple-900">
                                  Edit
                                </a>
                                <a href={`/cars/${car.id}`} className="text-blue-600 hover:text-blue-900">
                                  View
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {cars.map((car) => (
                    <div key={car.id} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-start space-x-4 mb-3">
                        <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {car.images.length > 0 ? (
                            <img
                              src={car.images[0].thumbnailUrl}
                              alt={car.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {car.year} {car.make} {car.model}
                          </h3>
                          <p className="text-lg font-bold text-gray-900 mt-1">€{car.price.toLocaleString()}</p>
                          <div className="flex items-center mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(car.status)}`}>
                              {car.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {car.viewsCount}
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {car.inquiriesCount}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <a href={`/cars/${car.id}/edit`} className="text-purple-600 hover:text-purple-900 text-sm font-medium">
                            Edit
                          </a>
                          <a href={`/cars/${car.id}`} className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                            View
                          </a>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Listed {new Date(car.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No inventory yet</h3>
                <p className="text-gray-600 mb-6">Start building your inventory by adding cars to your dealership!</p>
                <a 
                  href="/place-ad"
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Your First Car</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Other tabs would go here - Analytics, Leads, Settings */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
            <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
            <p className="text-sm sm:text-base text-gray-600">Detailed business analytics coming soon!</p>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Lead Management</h3>
            <p className="text-sm sm:text-base text-gray-600">Comprehensive lead tracking coming soon!</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dealer Settings</h2>

            {/* Business Profile Settings */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Business Profile
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Your business name"
                      defaultValue={dealerProfile?.businessName || ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://your-website.com"
                      defaultValue={dealerProfile?.website || ''}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Brief description of your business..."
                    defaultValue={dealerProfile?.description || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">About Us</label>
                  <textarea
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Tell customers about your business, experience, and what makes you special..."
                    defaultValue={(dealerProfile as any)?.aboutUs || ''}
                  />
                  <p className="text-sm text-gray-500 mt-1">This will be displayed on your public dealer page</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Luxury Cars, Electric Vehicles, Family Cars"
                    defaultValue={(dealerProfile as any)?.specialties ? ((dealerProfile as any).specialties as any).join(', ') : ''}
                  />
                  <p className="text-sm text-gray-500 mt-1">Separate multiple specialties with commas</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Save Business Profile
                </button>
              </div>
            </div>

            {/* Logo & Branding */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Logo & Branding
              </h3>

              <div className="flex items-start space-x-6">
                <div>
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    {dealerProfile?.logo ? (
                      <img src={dealerProfile.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Logo</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">Business Logo</h4>
                  <p className="text-sm text-gray-600 mb-4">Upload a logo to represent your dealership. This will be shown on your profile and listings.</p>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    Upload Logo
                  </button>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Business Hours
              </h3>

              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium text-gray-700">{day}</div>
                    <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <span className="text-gray-500">to</span>
                    <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                      <option value="17:00">17:00</option>
                      <option value="18:00">18:00</option>
                      <option value="19:00">19:00</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Save Business Hours
                </button>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Account Settings
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      defaultValue={user.firstName}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      defaultValue={user.lastName}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      defaultValue={user.email}
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Contact support to change email</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      defaultValue={(user as any).phone || ''}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Save Account Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 sm:p-6">
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
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}