'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  Car, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Settings,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Star,
  MessageSquare,
  BarChart3,
  Filter,
  Search,
  Plus,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  totalUsers?: number;
  totalCars?: number;
  activeCars?: number;
  pendingCars?: number;
  totalDealers?: number;
  totalRevenue?: number;
  monthlyRevenue?: number;
  recentUsers?: any[];
  recentCars?: any[];
  pendingActions?: any[];
  securityEvents?: any[];
  systemHealth?: {
    uptime: string;
    errorRate: number;
    responseTime: number;
  };
}

interface ActionItem {
  id: string;
  type: 'car_pending' | 'user_verification' | 'security_alert' | 'payment_issue';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  actionUrl: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'cars' | 'users' | 'revenue' | 'security'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  // 🔥 FIX: Add refs to prevent infinite loops
  const fetchInProgress = useRef(false);
  const mounted = useRef(true);
  const lastFetch = useRef(0);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // 🔥 FIX: Memoized fetch function with rate limiting
  const fetchDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchInProgress.current) {
      console.log('🛑 Dashboard fetch already in progress, skipping...');
      return;
    }

    // Rate limiting: Don't fetch more than once per 30 seconds (except manual refresh)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetch.current;
    if (timeSinceLastFetch < 30000 && !refreshing) {
      console.log(`🛑 Rate limit: ${Math.ceil((30000 - timeSinceLastFetch) / 1000)}s remaining`);
      return;
    }

    fetchInProgress.current = true;
    if (!refreshing) setLoading(true);
    setError(null);

    try {
      console.log('📊 Fetching dashboard data (controlled)...');
      
      const response = await fetch('/api/admin/dashboard/stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        // Prevent caching issues
        cache: 'no-cache'
      });

      if (!mounted.current) return; // Component unmounted

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        lastFetch.current = now;
        console.log('✅ Dashboard data loaded successfully');
      } else {
        console.warn(`⚠️ Dashboard API error: ${response.status}`);
        setError(`Failed to load dashboard data (${response.status})`);
        
        // Mock data for development - your existing fallback
        setStats({
          totalUsers: 247,
          totalCars: 1834,
          activeCars: 1456,
          pendingCars: 23,
          totalDealers: 89,
          totalRevenue: 45230,
          monthlyRevenue: 8940,
          recentUsers: [],
          recentCars: [],
          pendingActions: [],
          securityEvents: [],
          systemHealth: {
            uptime: '99.8%',
            errorRate: 0.02,
            responseTime: 245
          }
        });
      }
    } catch (error: any) {
      console.error('❌ Dashboard fetch error:', error);
      if (mounted.current) {
        setError('Network error loading dashboard');
        setStats({});
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
      fetchInProgress.current = false;
    }
  }, [refreshing]); // Only depend on refreshing

  // 🔥 FIX: Controlled useEffect - runs once only
  useEffect(() => {
    console.log('🔄 Admin Dashboard mounted');
    mounted.current = true;
    
    // Initial fetch
    fetchDashboardData();

    // 🔥 FIX: Controlled auto-refresh with cleanup
    autoRefreshInterval.current = setInterval(() => {
      if (mounted.current && !fetchInProgress.current) {
        console.log('⏰ Auto-refresh: 5 minutes elapsed');
        fetchDashboardData();
      }
    }, 300000); // 🔥 CHANGED: 5 minutes instead of 30 seconds

    // Cleanup function
    return () => {
      console.log('🧹 Admin Dashboard unmounting');
      mounted.current = false;
      fetchInProgress.current = false;
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    };
  }, []); // 🔥 EMPTY DEPENDENCY ARRAY - RUNS ONCE ONLY

  // 🔥 FIX: Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    lastFetch.current = 0; // Reset rate limit for manual refresh
    await fetchDashboardData();
  }, [fetchDashboardData]);

  const safeNumber = (value: number | undefined): number => value ?? 0;
  const safeArray = (value: any[] | undefined): any[] => value ?? [];

  // Mock urgent actions that need admin attention
  const urgentActions: ActionItem[] = [
    {
      id: '1',
      type: 'car_pending',
      title: 'Car Approval Required',
      description: '23 cars waiting for moderation approval',
      priority: 'high',
      timestamp: '2 hours ago',
      actionUrl: '/admin/cars/pending'
    },
    {
      id: '2',
      type: 'user_verification',
      title: 'Dealer Verification',
      description: '5 dealers awaiting business verification',
      priority: 'medium',
      timestamp: '4 hours ago',
      actionUrl: '/admin/users/dealers/pending'
    },
    {
      id: '3',
      type: 'security_alert',
      title: 'Suspicious Login Activity',
      description: 'Multiple failed login attempts detected',
      priority: 'critical',
      timestamp: '15 minutes ago',
      actionUrl: '/admin/security/events'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (loading && !stats.totalUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-600" />
                Admin Control Center
              </h1>
              <p className="text-gray-600 text-sm">Irish Auto Market Management Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 🔥 FIX: Updated refresh button */}
              <button
                onClick={handleManualRefresh}
                disabled={refreshing || fetchInProgress.current}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="text-right">
                <p className="text-xs text-gray-500">Last updated</p>
                <p className="text-sm font-medium">
                  {lastFetch.current ? new Date(lastFetch.current).toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 🔥 ADDED: Error display */}
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">Dashboard Warning</p>
                <p className="text-yellow-700 text-sm">{error} - Showing cached/mock data</p>
              </div>
            </div>
          </div>
        )}

        {/* Critical Actions Alert Bar */}
        {urgentActions.filter(a => a.priority === 'critical').length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Critical Actions Required</h3>
            </div>
            <div className="space-y-2">
              {urgentActions.filter(a => a.priority === 'critical').map(action => (
                <div key={action.id} className="flex items-center justify-between bg-white rounded p-3">
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <a
                    href={action.actionUrl}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    Resolve Now
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Platform Health */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.systemHealth?.uptime || '99.8%'}</h3>
            <p className="text-gray-600 text-sm">Platform Uptime</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Response: {stats.systemHealth?.responseTime || 245}ms</p>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-2">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <a href="/admin/users" className="text-xs text-blue-600 hover:text-blue-700">View All</a>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{safeNumber(stats.totalUsers).toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Total Users</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">{safeNumber(stats.totalDealers)} verified dealers</p>
            </div>
          </div>

          {/* Car Inventory */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-2">
                <Car className="w-6 h-6 text-purple-600" />
              </div>
              <a href="/admin/cars" className="text-xs text-purple-600 hover:text-purple-700">Manage</a>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{safeNumber(stats.activeCars).toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Active Listings</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-orange-500">{safeNumber(stats.pendingCars)} pending review</p>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-2">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <a href="/admin/revenue" className="text-xs text-green-600 hover:text-green-700">Details</a>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">€{safeNumber(stats.monthlyRevenue).toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">This Month</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">€{safeNumber(stats.totalRevenue).toLocaleString()} total</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions & Tasks - Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Urgent Actions Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Actions Required
                  </h3>
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                    {urgentActions.length} pending
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {urgentActions.map(action => (
                    <div key={action.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getPriorityColor(action.priority)}`}>
                          {getPriorityIcon(action.priority)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{action.title}</p>
                          <p className="text-sm text-gray-600">{action.description}</p>
                          <p className="text-xs text-gray-500">{action.timestamp}</p>
                        </div>
                      </div>
                      <a
                        href={action.actionUrl}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Management Tools */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  Quick Management
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <a href="/admin/cars/new" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
                    <Plus className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-900">Add Car</span>
                  </a>
                  
                  <a href="/admin/users/new" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group">
                    <UserCheck className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-900">Add User</span>
                  </a>
                  
                  <a href="/admin/reports" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
                    <Download className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-900">Export Data</span>
                  </a>
                  
                  <a href="/admin/settings" className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                    <Settings className="w-8 h-8 text-gray-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-900">Settings</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Monitoring & Insights */}
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  System Health
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Server Status</span>
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Online
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Connected
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="text-xs text-green-600">
                    {((stats.systemHealth?.errorRate || 0.02) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Recent Activity
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">New car listing approved</span>
                    <span className="text-xs text-gray-400 ml-auto">2m ago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">New dealer registered</span>
                    <span className="text-xs text-gray-400 ml-auto">15m ago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">Payment processed</span>
                    <span className="text-xs text-gray-400 ml-auto">1h ago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">User verification completed</span>
                    <span className="text-xs text-gray-400 ml-auto">2h ago</span>
                  </div>
                </div>
                <a href="/admin/activity" className="block text-center text-blue-600 hover:text-blue-700 text-sm mt-4 pt-3 border-t border-gray-100">
                  View All Activity
                </a>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Performance</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Page Views Today</span>
                  <span className="text-sm font-medium">12,456</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Search Queries</span>
                  <span className="text-sm font-medium">3,892</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Messages Sent</span>
                  <span className="text-sm font-medium">567</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">🔧 Debug Info (Development Only)</h3>
            <div className="text-xs text-gray-400 space-y-1">
              <p>🔄 Fetch in progress: {fetchInProgress.current ? 'Yes' : 'No'}</p>
              <p>⏰ Last fetch: {lastFetch.current ? new Date(lastFetch.current).toLocaleString() : 'Never'}</p>
              <p>📊 Stats loaded: {Object.keys(stats).length > 0 ? 'Yes' : 'No'}</p>
              <p>❌ Current error: {error || 'None'}</p>
            </div>
            <details className="mt-2">
              <summary className="text-xs text-gray-400 cursor-pointer">View raw stats data</summary>
              <pre className="text-xs text-gray-400 overflow-auto mt-2 max-h-40">
                {JSON.stringify(stats, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}