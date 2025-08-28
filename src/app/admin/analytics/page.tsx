// src/app/admin/analytics/page.tsx - COMPREHENSIVE ANALYTICS DASHBOARD
'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import {
  TrendingUp,
  TrendingDown,
  Users,
  Car,
  MessageSquare,
  Heart,
  Eye,
  DollarSign,
  Shield,
  AlertTriangle,
  Activity,
  Globe,
  Calendar,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCars: number;
    totalDealers: number;
    totalRevenue: number;
    growth: {
      users: { last24h: number; last7d: number; last30d: number };
      cars: { last24h: number; last7d: number; last30d: number };
      inquiries: { last24h: number; last7d: number; last30d: number };
    };
  };
  users: {
    total: number;
    active: number;
    byRole: Array<{ role: string; count: number }>;
    registrationTrends: Array<{ date: string; registrations: number; dealerRegistrations: number }>;
  };
  cars: {
    total: number;
    active: number;
    byStatus: Array<{ status: string; count: number }>;
    byCondition: Array<{ condition: string; count: number }>;
    byFuelType: Array<{ fuelType: string; count: number }>;
    byTransmission: Array<{ transmission: string; count: number }>;
    byBodyType: Array<{ bodyType: string; count: number }>;
    popularMakes: Array<{ make: string; count: number }>;
    popularModels: Array<{ make: string; model: string; count: number }>;
    priceAnalytics: {
      average: number;
      min: number;
      max: number;
      count: number;
    };
    priceRanges: Array<{ range: string; count: number }>;
    listingTrends: Array<{ date: string; listings: number }>;
    topPerforming: Array<{
      id: string;
      title: string;
      make: string;
      model: string;
      year: number;
      price: number;
      viewsCount: number;
      inquiriesCount: number;
      likesCount: number;
      user: { name: string; email: string };
    }>;
  };
  dealers: {
    total: number;
    active: number;
    verified: number;
    bySubscription: Array<{ subscriptionType: string; count: number }>;
    topPerformers: Array<{
      id: string;
      name: string;
      email: string;
      business_name: string;
      totalListings: number;
      activeListings: number;
      totalViews: number;
      totalInquiries: number;
    }>;
  };
  engagement: {
    inquiries: {
      total: number;
      recent: number;
      byStatus: Array<{ status: string; count: number }>;
      trends: Array<{ date: string; inquiries: number }>;
    };
    conversations: { total: number; active: number };
    messages: { total: number; recent: number };
    favorites: { total: number; recent: number };
    likes: { total: number; recent: number };
  };
  geographic: {
    distribution: Array<{ county: string; count: number }>;
  };
  support: {
    contacts: {
      total: number;
      pending: number;
      recent: number;
      byCategory: Array<{ category: string; count: number }>;
      byPriority: Array<{ priority: string; count: number }>;
    };
    feedback: { total: number; recent: number };
    issues: {
      total: number;
      critical: number;
      byType: Array<{ type: string; count: number }>;
    };
  };
  admin: {
    users: {
      total: number;
      byRole: Array<{ role: string; count: number }>;
    };
    activity: { auditLogs: number; recentLogs: number };
    security: { events: number; recentEvents: number };
  };
  revenue: {
    total: number;
    last30Days: number;
    bySource: Array<{ source: string; amount: number }>;
    pendingPayments: number;
    featuredListings: {
      total: number;
      active: number;
      revenue: number;
    };
  };
  invitations: {
    total: number;
    recent: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  systemHealth: any;
  metadata: {
    generatedAt: string;
    generatedBy: string;
    timeRanges: any;
  };
}

// Chart color schemes
const CHART_COLORS = {
  primary: ['#16A34A', '#15803D', '#166534', '#14532D', '#052E16'],
  status: ['#16A34A', '#F59E0B', '#EF4444', '#6B7280', '#3B82F6'],
  fuel: ['#16A34A', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'],
  body: ['#16A34A', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280', '#10B981'],
  subscription: ['#FFD700', '#C0C0C0', '#CD7F32']
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [vercelData, setVercelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vercelLoading, setVercelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/analytics', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Analytics API Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setData(result.data);
      setLastUpdated(new Date().toLocaleString());
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      setError(error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVercelAnalytics = async () => {
    try {
      setVercelLoading(true);
      
      const response = await fetch(`/api/admin/analytics/vercel?period=${selectedTimeRange}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setVercelData(result.data);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch Vercel analytics:', error);
      // Don't show error for Vercel analytics - it's supplementary
    } finally {
      setVercelLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchVercelAnalytics();
  }, []);

  useEffect(() => {
    fetchVercelAnalytics();
  }, [selectedTimeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IE').format(num);
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-green-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Loading Analytics</h3>
          <p className="mt-2 text-gray-500">Gathering comprehensive data...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Analytics Error</h3>
          <p className="mt-2 text-gray-500">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Comprehensive insights into platform performance and user behavior
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated}
              </div>
              
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>

              <button
                onClick={() => {
                  fetchAnalytics();
                  fetchVercelAnalytics();
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.totalUsers)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{data.overview.growth.users.last30d} this month
                </p>
              </div>
              <Users className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cars</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.totalCars)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{data.overview.growth.cars.last30d} this month
                </p>
              </div>
              <Car className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Dealers</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.totalDealers)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {data.dealers.verified} verified
                </p>
              </div>
              <Shield className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.totalRevenue)}</p>
                <p className="text-sm text-green-600 mt-1">
                  {formatCurrency(data.revenue.last30Days)} this month
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Website Traffic Analytics */}
        {vercelData && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-6 h-6 mr-2 text-blue-600" />
              Website Traffic Analytics
              {vercelLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin text-blue-600" />}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Page Views</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(vercelData.pageViews.total)}</p>
                    <p className="text-sm text-gray-600 mt-1">in {selectedTimeRange}</p>
                  </div>
                  <Eye className="w-10 h-10 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unique Visitors</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(vercelData.uniqueVisitors.total)}</p>
                    <p className="text-sm text-gray-600 mt-1">in {selectedTimeRange}</p>
                  </div>
                  <Users className="w-10 h-10 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Top Country</p>
                    <p className="text-xl font-bold text-gray-900">
                      {vercelData.countries.length > 0 ? vercelData.countries[0].name : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {vercelData.countries.length > 0 ? formatNumber(vercelData.countries[0].visits) + ' visits' : ''}
                    </p>
                  </div>
                  <Globe className="w-10 h-10 text-purple-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Top Device</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">
                      {vercelData.devices.length > 0 ? vercelData.devices[0].device : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {vercelData.devices.length > 0 ? vercelData.devices[0].percentage + '%' : ''}
                    </p>
                  </div>
                  <Activity className="w-10 h-10 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Traffic Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Views Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={vercelData.pageViews.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Page Views"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitors Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={vercelData.uniqueVisitors.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#16A34A" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Unique Visitors"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Pages & Countries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
                <div className="space-y-3">
                  {vercelData.topPages.slice(0, 8).map((page: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {page.title || page.path}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{page.path}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-900 ml-4">
                        {formatNumber(page.views)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
                <div className="space-y-3">
                  {vercelData.countries.slice(0, 8).map((country: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">{country.country}</div>
                        <div className="text-sm font-medium text-gray-900">
                          {country.name}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatNumber(country.visits)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-lg font-semibold text-gray-900">{formatNumber(data.engagement.inquiries.total)}</p>
            <p className="text-sm text-gray-600">Total Inquiries</p>
            <p className="text-xs text-green-600">+{data.engagement.inquiries.recent} today</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <Heart className="w-8 h-8 mx-auto text-red-600 mb-2" />
            <p className="text-lg font-semibold text-gray-900">{formatNumber(data.engagement.likes.total)}</p>
            <p className="text-sm text-gray-600">Car Likes</p>
            <p className="text-xs text-red-600">+{data.engagement.likes.recent} today</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <Eye className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <p className="text-lg font-semibold text-gray-900">{formatNumber(data.engagement.favorites.total)}</p>
            <p className="text-sm text-gray-600">Favorites</p>
            <p className="text-xs text-blue-600">+{data.engagement.favorites.recent} today</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <Activity className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="text-lg font-semibold text-gray-900">{formatNumber(data.engagement.conversations.active)}</p>
            <p className="text-sm text-gray-600">Active Chats</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-orange-600 mb-2" />
            <p className="text-lg font-semibold text-gray-900">{data.support.contacts.pending}</p>
            <p className="text-sm text-gray-600">Pending Support</p>
            <p className="text-xs text-orange-600">+{data.support.contacts.recent} today</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <Shield className="w-8 h-8 mx-auto text-red-600 mb-2" />
            <p className="text-lg font-semibold text-gray-900">{data.support.issues.critical}</p>
            <p className="text-sm text-gray-600">Critical Issues</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* User Registration Trends */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <LineIcon className="w-5 h-5 mr-2 text-green-600" />
                User Registration Trends
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.users.registrationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="registrations" 
                  stackId="1" 
                  stroke="#16A34A" 
                  fill="#16A34A" 
                  fillOpacity={0.6}
                  name="Total Registrations"
                />
                <Area 
                  type="monotone" 
                  dataKey="dealerRegistrations" 
                  stackId="2" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6}
                  name="Dealer Registrations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Car Listing Trends */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Car Listing Trends
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.cars.listingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="listings" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="New Listings"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Car Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieIcon className="w-5 h-5 mr-2 text-green-600" />
              Car Status
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.cars.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {data.cars.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS.status[index % CHART_COLORS.status.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Fuel Type Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieIcon className="w-5 h-5 mr-2 text-blue-600" />
              Fuel Types
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.cars.byFuelType}
                  dataKey="count"
                  nameKey="fuelType"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ fuelType, count }) => `${fuelType}: ${count}`}
                >
                  {data.cars.byFuelType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS.fuel[index % CHART_COLORS.fuel.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Price Range Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-yellow-600" />
              Price Ranges
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.cars.priceRanges} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="range" type="category" width={100} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Popular Makes */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Most Popular Car Makes
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.cars.popularMakes.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="make" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-green-600" />
            Geographic Distribution (Top Counties)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.geographic.distribution.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="county" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#16A34A" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performing Cars */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Cars</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inquiries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.cars.topPerforming.slice(0, 10).map((car) => (
                  <tr key={car.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {car.year} {car.make} {car.model}
                        </div>
                        <div className="text-sm text-gray-500">{car.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(car.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(car.viewsCount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(car.inquiriesCount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(car.likesCount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {car.user.name || car.user.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Dealers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Dealers</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inquiries</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.dealers.topPerformers.slice(0, 10).map((dealer) => (
                  <tr key={dealer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {dealer.business_name}
                        </div>
                        <div className="text-sm text-gray-500">{dealer.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dealer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dealer.activeListings} active
                      </div>
                      <div className="text-sm text-gray-500">
                        {dealer.totalListings} total
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(dealer.totalViews)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(dealer.totalInquiries)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-yellow-600" />
              Revenue by Source
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.revenue.bySource}
                  dataKey="amount"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ source, amount }) => `${source}: ${formatCurrency(amount)}`}
                >
                  {data.revenue.bySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Revenue</span>
                <span className="text-xl font-semibold text-green-600">
                  {formatCurrency(data.revenue.total)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last 30 Days</span>
                <span className="text-lg font-medium text-gray-900">
                  {formatCurrency(data.revenue.last30Days)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Featured Listings Revenue</span>
                <span className="text-lg font-medium text-gray-900">
                  {formatCurrency(data.revenue.featuredListings.revenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Payments</span>
                <span className="text-lg font-medium text-orange-600">
                  {data.revenue.pendingPayments} transactions
                </span>
              </div>
            </div>
          </div>
          
        </div>

        {/* System Health & Metadata */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            System Health & Metadata
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Database</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Total Records: {formatNumber(data.systemHealth.database.totalRecords)}</li>
                <li>Recent Errors: {data.systemHealth.database.recentErrors}</li>
                <li>Tables: {data.systemHealth.database.totalTables}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Admin Activity</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Total Audit Logs: {formatNumber(data.admin.activity.auditLogs)}</li>
                <li>Recent Logs: {data.admin.activity.recentLogs}</li>
                <li>Security Events: {data.admin.security.events}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Analytics</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Generated: {new Date(data.metadata.generatedAt).toLocaleString()}</li>
                <li>Generated By: {data.metadata.generatedBy}</li>
                <li>Data Fresh: ✅ Real-time</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}