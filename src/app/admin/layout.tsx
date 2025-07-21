// src/app/admin/layout.tsx - UPDATED WITH SUPPORT NAVIGATION
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Car, 
  Users, 
  LayoutDashboard, 
  Shield, 
  Settings,
  Bell,
  ChevronDown,
  MessageCircle,
  Headphones,
  AlertTriangle
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
  lastLogin?: string | null;
}

interface SupportStats {
  pendingContacts: number;
  criticalReports: number;
  totalPending: number;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [supportStats, setSupportStats] = useState<SupportStats>({ 
    pendingContacts: 0, 
    criticalReports: 0, 
    totalPending: 0 
  });
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage) {
      checkAuth();
      fetchSupportStats();
    } else {
      setLoading(false);
    }
  }, [isLoginPage]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/me', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setError(null);
      } else if (response.status === 429) {
        setError('Too many requests. Please wait before trying again.');
      } else {
        setUser(null);
        setError('Authentication failed');
      }
    } catch (err: any) {
      console.error('Auth check error:', err);
      setError('Authentication check failed');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportStats = async () => {
    try {
      const response = await fetch('/api/admin/support/stats', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSupportStats({
            pendingContacts: data.data.summary.pendingContacts || 0,
            criticalReports: data.data.summary.criticalReports || 0,
            totalPending: (data.data.summary.pendingContacts || 0) + (data.data.summary.criticalReports || 0)
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch support stats:', error);
      // Don't show error for support stats - not critical
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      window.location.href = '/admin/login';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-600 text-white';
      case 'ADMIN': return 'bg-blue-600 text-white';
      case 'CONTENT_MOD': return 'bg-purple-600 text-white';
      case 'FINANCE_ADMIN': return 'bg-green-600 text-white';
      case 'SUPPORT_ADMIN': return 'bg-orange-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getDisplayRole = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN': return 'Admin';
      case 'CONTENT_MOD': return 'Content Mod';
      case 'FINANCE_ADMIN': return 'Finance Admin';
      case 'SUPPORT_ADMIN': return 'Support Admin';
      default: return role;
    }
  };

  // Navigation items with icons (UPDATED WITH SUPPORT)
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin'
    },
    {
      name: 'Support',
      href: '/admin/support',
      icon: MessageCircle,
      active: pathname.startsWith('/admin/support'),
      badge: supportStats.totalPending > 0 ? supportStats.totalPending : null,
      badgeColor: supportStats.criticalReports > 0 ? 'bg-red-500' : 'bg-orange-500'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      active: pathname.startsWith('/admin/users')
    },
    {
      name: 'Cars',
      href: '/admin/cars',
      icon: Car,
      active: pathname.startsWith('/admin/cars')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      active: pathname.startsWith('/admin/analytics')
    }
  ];

  // Only show Settings to SUPER_ADMIN
  if (user?.role === 'SUPER_ADMIN') {
    navigationItems.push({
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      active: pathname.startsWith('/admin/settings'),
      badge: null,
      badgeColor: ''
    });
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Login page - render without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Not authenticated - show error
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need admin privileges to access this area.</p>
            {error && (
              <p className="text-sm text-red-600 mb-4">Error: {error}</p>
            )}
          </div>
          <a 
            href="/admin/login"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-block transition-colors"
          >
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  // Authenticated admin layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Title */}
            <div className="flex items-center">
              <img src="/iam-logo.svg" alt="Irish Auto Market" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Irish Auto Market</h1>
                <p className="text-xs text-gray-500">Admin Control Panel</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a 
                    key={item.name}
                    href={item.href} 
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors relative ${
                      item.active
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                    {/* Support Badge */}
                    {item.badge && (
                      <span className={`absolute -top-1 -right-1 h-5 w-5 ${item.badgeColor} text-white text-xs rounded-full flex items-center justify-center font-medium`}>
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications with Support Alerts */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors relative">
                <Bell className="w-5 h-5" />
                {/* Enhanced notification badge for support */}
                {supportStats.criticalReports > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {supportStats.criticalReports > 9 ? '9+' : supportStats.criticalReports}
                  </span>
                )}
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'}
                    </span>
                  </div>
                  
                  {/* User Info */}
                  <div className="text-left hidden lg:block">
                    <div className="text-sm font-medium text-gray-900">{user.name || user.email}</div>
                    <div className="text-xs text-gray-500">{getDisplayRole(user.role)}</div>
                  </div>
                  
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name || 'Admin User'}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getRoleColor(user.role)}`}>
                              {getDisplayRole(user.role)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <a
                          href="/admin/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Users className="w-4 h-4 mr-3" />
                          Profile Settings
                        </a>

                        {/* Support Quick Access */}
                        <a
                          href="/admin/support"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Headphones className="w-4 h-4 mr-3" />
                          Support Center
                          {supportStats.totalPending > 0 && (
                            <span className="ml-auto bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              {supportStats.totalPending}
                            </span>
                          )}
                        </a>
                        
                        {user.role === 'SUPER_ADMIN' && (
                          <a
                            href="/admin/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            System Settings
                          </a>
                        )}

                        <div className="border-t border-gray-100 my-1"></div>
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Shield className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>

                      {/* Last Login Info */}
                      {user.lastLogin && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                          <div className="text-xs text-gray-500">
                            Last login: {new Date(user.lastLogin).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex space-x-4 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <a 
                  key={item.name}
                  href={item.href} 
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors relative ${
                    item.active
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                  {/* Mobile badge */}
                  {item.badge && (
                    <span className={`ml-1 h-4 w-4 ${item.badgeColor} text-white text-xs rounded-full flex items-center justify-center font-medium`}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </div>
  );
}