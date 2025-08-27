'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  Eye,
  MessageCircle,
  Heart,
  TrendingUp,
  Users,
  Calendar,
  Star,
  Globe,
  Phone,
  MapPin,
  Settings,
  Edit3,
  BarChart3,
  Badge
} from 'lucide-react';

interface DealerStats {
  totalCars: number;
  activeCars: number;
  soldCars: number;
  totalViews: number;
  totalInquiries: number;
  totalLikes: number;
  averagePrice: number;
  thisMonthViews: number;
  thisMonthInquiries: number;
  topMake: string;
}

interface DealerProfile {
  businessName: string;
  description?: string;
  logo?: string;
  website?: string;
  verified: boolean;
  subscriptionType: string;
  specialties: string[];
  responseTime: string;
  memberSince: string;
}

interface RecentCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  views: number;
  inquiries: number;
  likes: number;
  createdAt: string;
  images: Array<{ thumbnailUrl?: string; url?: string }>;
}

export default function DealerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DealerStats | null>(null);
  const [profile, setProfile] = useState<DealerProfile | null>(null);
  const [recentCars, setRecentCars] = useState<RecentCar[]>([]);

  useEffect(() => {
    fetchDealerData();
  }, []);

  const fetchDealerData = async () => {
    try {
      // Check if user is authenticated and is a dealer
      const profileResponse = await fetch('/api/profile');
      if (!profileResponse.ok) {
        router.push('/login');
        return;
      }

      const userData = await profileResponse.json();
      if (userData.role !== 'DEALER') {
        router.push('/profile');
        return;
      }

      // Fetch dealer analytics
      const analyticsResponse = await fetch('/api/profile/analytics');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setStats(analyticsData);
      }

      // Fetch dealer profile info
      const dealerResponse = await fetch('/api/profile/dealer');
      if (dealerResponse.ok) {
        const dealerData = await dealerResponse.json();
        setProfile({
          businessName: dealerData.dealerProfile?.businessName || `${userData.firstName} ${userData.lastName}`,
          description: dealerData.dealerProfile?.description,
          logo: dealerData.dealerProfile?.logo,
          website: dealerData.dealerProfile?.website,
          verified: dealerData.dealerProfile?.verified || false,
          subscriptionType: dealerData.dealerProfile?.subscriptionType || 'BASIC',
          specialties: dealerData.dealerProfile?.specialties || [],
          responseTime: 'Within 4 hours', // Could be calculated
          memberSince: new Date(userData.createdAt).toLocaleDateString('en-IE', {
            month: 'long',
            year: 'numeric'
          })
        });
      }

      // Fetch recent cars
      const carsResponse = await fetch('/api/profile/cars');
      if (carsResponse.ok) {
        const carsData = await carsResponse.json();
        setRecentCars(carsData.cars || []);
      }

    } catch (error) {
      console.error('Error fetching dealer data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      BASIC: { text: 'Basic', class: 'bg-gray-100 text-gray-800', color: 'text-gray-600' },
      PREMIUM: { text: 'Premium', class: 'bg-blue-100 text-blue-800', color: 'text-blue-600' },
      ENTERPRISE: { text: 'Enterprise', class: 'bg-green-100 text-green-800', color: 'text-green-600' }
    };
    return badges[subscription as keyof typeof badges] || badges.BASIC;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/profile" className="flex items-center text-green-600 hover:text-green-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {profile?.logo ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={profile.logo}
                    alt="Business logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {profile?.businessName.split(' ').map(word => word[0]).join('').slice(0, 2) || 'DL'}
                  </span>
                </div>
              )}
              
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.businessName}</h1>
                  {profile?.verified && (
                    <Badge className="w-5 h-5 text-blue-600" />
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionBadge(profile?.subscriptionType || 'BASIC').class}`}>
                    {getSubscriptionBadge(profile?.subscriptionType || 'BASIC').text}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">Dealer Dashboard</p>
                <p className="text-sm text-gray-500">Member since {profile?.memberSince}</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Link
                href="/profile/dealer/edit"
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Cars</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalCars || 0}</p>
                    <p className="text-xs text-gray-500">{stats?.activeCars || 0} active</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalViews || 0}</p>
                    <p className="text-xs text-gray-500">+{stats?.thisMonthViews || 0} this month</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Inquiries</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalInquiries || 0}</p>
                    <p className="text-xs text-gray-500">+{stats?.thisMonthInquiries || 0} this month</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <MessageCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Cars */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Listings</h3>
                  <Link href="/my-ads" className="text-green-600 hover:text-green-700 text-sm font-medium">
                    View All
                  </Link>
                </div>
              </div>
              
              {recentCars.length === 0 ? (
                <div className="p-8 text-center">
                  <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No cars listed yet</h4>
                  <p className="text-gray-600 mb-4">Start selling by creating your first car listing</p>
                  <Link
                    href="/place-ad"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Listing
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentCars.slice(0, 5).map((car) => (
                    <div key={car.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={car.images?.[0]?.thumbnailUrl || car.images?.[0]?.url || '/placeholder-car.jpg'}
                            alt={car.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <Link href={`/cars/${car.id}`} className="hover:text-green-600">
                              <h4 className="text-lg font-medium text-gray-900 truncate">
                                {car.title}
                              </h4>
                            </Link>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              car.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              car.status === 'SOLD' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {car.status}
                            </span>
                          </div>
                          
                          <p className="text-lg font-semibold text-green-600 mt-1">
                            {formatPrice(car.price)}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {car.views} views
                            </div>
                            <div className="flex items-center">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              {car.inquiries} inquiries
                            </div>
                            <div className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              {car.likes} likes
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(car.createdAt).toLocaleDateString('en-IE')}
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          href={`/cars/${car.id}/edit`}
                          className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Verification Status</span>
                  <div className="flex items-center">
                    {profile?.verified ? (
                      <span className="flex items-center text-green-600">
                        <Badge className="w-4 h-4 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-gray-500">Not Verified</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subscription</span>
                  <span className={getSubscriptionBadge(profile?.subscriptionType || 'BASIC').color}>
                    {getSubscriptionBadge(profile?.subscriptionType || 'BASIC').text}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Response Time</span>
                  <span className="text-gray-900">{profile?.responseTime}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Cars Sold</span>
                  <span className="text-gray-900">{stats?.soldCars || 0}</span>
                </div>
              </div>
            </div>

            {/* Specialties */}
            {profile?.specialties && profile.specialties.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/place-ad"
                  className="w-full flex items-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Car className="w-4 h-4 mr-3" />
                  Add New Car
                </Link>
                
                <Link
                  href="/my-ads"
                  className="w-full flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Manage Listings
                </Link>
                
                <Link
                  href="/messages"
                  className="w-full flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-3" />
                  View Messages
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}