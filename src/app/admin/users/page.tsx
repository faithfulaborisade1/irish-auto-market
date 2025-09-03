'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  MoreVertical,
  UserX,
  UserCheck,
  Key,
  Building,
  Car,
  Star,
  Ban,
  UserCog,
  X,
  Phone,
  MapPin,
  CreditCard,
  Activity,
  RefreshCw,
  WifiOff,
  Server
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  phone?: string;
  role: 'USER' | 'DEALER' | 'ADMIN' | 'SUPER_ADMIN' | 'CONTENT_MOD' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  avatar?: string;
  bio?: string;
  location?: any;
  
  // Dealer specific
  dealerProfile?: {
    businessName: string;
    verified: boolean;
    subscriptionType: string;
    subscriptionExpires?: string;
    description?: string;
    logo?: string;
    website?: string;
  };
  
  // Admin specific
  adminProfile?: {
    adminRole: string;
    permissions: string[];
    twoFactorEnabled: boolean;
    lastLoginAt?: string;
    title?: string;
    department?: string;
  };
  
  // Stats
  carsCount?: number;
  activeCarsCount?: number;
  messagesCount?: number;
  totalSpent?: number;
  totalRevenue?: number;
  
  // Recent activity
  recentCars?: any[];
  recentMessages?: any[];
  revenueHistory?: any[];
}

interface CreateAdminData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
}

export default function UnifiedUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  
  // Modal states
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Form states
  const [createAdminForm, setCreateAdminForm] = useState<CreateAdminData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'ADMIN'
  });
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserType, setFilterUserType] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, [currentPage, searchTerm, filterUserType, filterRole, filterStatus]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/admin/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const user = await response.json();
        setCurrentUserRole(user.role);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(filterUserType !== 'all' && { userType: filterUserType }),
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      const response = await fetch(`/api/admin/users/all?${params}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalUsers(data.pagination?.total || 0);
        setRetryCount(0); // Reset retry count on success
      } else {
        // Enhanced error handling based on response status
        let errorMessage = 'Failed to load users';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Authentication failed. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access denied. Insufficient permissions.';
            break;
          case 404:
            errorMessage = 'User management API not found. Please contact support.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again or contact support.';
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = `Failed to load users (Status: ${response.status}). Please try again.`;
        }
        
        setError(errorMessage);
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      
      // Network error handling
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Network connection error. Please check your internet connection and try again.');
      } else {
        setError('Failed to load users. Please refresh the page or contact support.');
      }
      
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchUsers();
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      const response = await fetch('/api/admin/users/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(createAdminForm)
      });

      if (response.ok) {
        const result = await response.json();
        
        alert(`Admin created successfully!\n\nTemporary Password: ${result.temporaryPassword}\n\nVerification email sent to: ${createAdminForm.email}`);
        
        setCreateAdminForm({
          email: '',
          firstName: '',
          lastName: '',
          role: 'ADMIN'
        });
        setShowCreateAdminModal(false);
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create admin');
      }
    } catch (error: any) {
      setError('Network error creating admin');
      console.error('Error creating admin:', error);
    }
  };

  const handleUserAction = async (userId: string, action: string, newStatus?: string, hardDelete?: boolean) => {
    try {
      setActionLoading(`${action}-${userId}`);
      setError(null);

      let endpoint = '';
      let method = 'PUT';
      let body = {};

      switch (action) {
        case 'toggle_status':
          endpoint = `/api/admin/users/${userId}`;
          body = { isActive: newStatus === 'ACTIVE' };
          break;
        case 'verify_dealer':
          endpoint = `/api/admin/users/${userId}/verify-dealer`;
          method = 'POST';
          break;
        case 'reset_password':
          endpoint = `/api/admin/users/${userId}/force-password-reset`;
          method = 'POST';
          break;
        case 'suspend_user':
          endpoint = `/api/admin/users/${userId}`;
          method = 'DELETE';
          break;
        case 'delete_user':
          endpoint = `/api/admin/users/${userId}${hardDelete ? '?hard=true' : ''}`;
          method = 'DELETE';
          break;
        default:
          console.warn('Unknown action:', action);
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined
      });

      if (response.ok) {
        const result = await response.json();
        fetchUsers(); // Refresh the list
        
        if (action === 'reset_password') {
          alert('Password reset email sent successfully');
        } else if (action === 'verify_dealer') {
          alert('Dealer verified successfully');
        } else if (action === 'suspend_user') {
          alert(`User suspended successfully`);
        } else if (action === 'delete_user') {
          if (result.action === 'hard_deleted') {
            alert(`🗑️ PERMANENTLY DELETED\n\nUser "${result.dataRemoved.email}" and all data removed forever.\nEmail is now available for reuse.\n\nData removed:\n• ${result.dataRemoved.cars} cars\n• ${result.dataRemoved.messages} messages\n• ${result.dataRemoved.likes} likes\n• ${result.dataRemoved.notifications} notifications`);
          } else {
            alert('User suspended successfully');
          }
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.error || `Failed to ${action.replace('_', ' ')}`);
      }
    } catch (error: any) {
      setError(`Network error performing ${action.replace('_', ' ')}`);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.user);
      } else {
        // Use the existing user data from the list as fallback
        const user = users.find(u => u.id === userId);
        if (user) {
          setSelectedUser(user);
        } else {
          setError('Failed to load user details');
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Use the existing user data from the list as fallback
      const user = users.find(u => u.id === userId);
      if (user) {
        setSelectedUser(user);
      } else {
        setError('Failed to load user details');
      }
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.email} ${user.dealerProfile?.businessName || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesUserType = filterUserType === 'all' || 
      (filterUserType === 'regular' && user.role === 'USER') ||
      (filterUserType === 'dealers' && user.role === 'DEALER') ||
      (filterUserType === 'admins' && ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MOD', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(user.role));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesUserType && matchesRole && matchesStatus;
  });

  const canManageUsers = currentUserRole === 'SUPER_ADMIN';
  const canCreateAdmins = currentUserRole === 'SUPER_ADMIN';

  const getUserTypeIcon = (user: User) => {
    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
      case 'CONTENT_MOD':
      case 'FINANCE_ADMIN':
      case 'SUPPORT_ADMIN':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'DEALER':
        return <Building className="w-4 h-4 text-blue-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUserTypeLabel = (user: User) => {
    if (user.role === 'DEALER') {
      return user.dealerProfile?.businessName || 'Dealer';
    }
    return user.role.replace('_', ' ');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800';
      case 'ADMIN':
      case 'CONTENT_MOD':
      case 'FINANCE_ADMIN':
      case 'SUPPORT_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'DEALER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING_VERIFICATION': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string, emailVerified: boolean) => {
    if (!emailVerified) return <Mail className="w-4 h-4" />;
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING_VERIFICATION': return <Clock className="w-4 h-4" />;
      case 'SUSPENDED': return <Ban className="w-4 h-4" />;
      case 'INACTIVE': return <UserX className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">Attempt {retryCount + 1}</p>
          )}
        </div>
      </div>
    );
  }

  // Error state with no users
  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 p-8 rounded-lg mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              {error.includes('Network') ? (
                <WifiOff className="w-8 h-8 text-red-600" />
              ) : (
                <Server className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Users</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Loading
              </button>
              
              <div className="text-xs text-gray-500">
                <p>If the problem persists:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Refresh the browser page</li>
                  <li>• Contact technical support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                User Management
                {totalUsers > 0 && (
                  <span className="text-lg text-gray-500 font-normal">({totalUsers.toLocaleString()})</span>
                )}
              </h1>
              <p className="text-gray-600 text-sm">Manage all platform users, dealers, and administrators</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh user list"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              
              {canCreateAdmins && (
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* User Type Filter */}
            <select
              value={filterUserType}
              onChange={(e) => setFilterUserType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="regular">Regular Users</option>
              <option value="dealers">Dealers</option>
              <option value="admins">Administrators</option>
            </select>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="USER">User</option>
              <option value="DEALER">Dealer</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_VERIFICATION">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              {filteredUsers.length} of {totalUsers} users
            </div>
          </div>
        </div>

        {/* Error Message (when users exist but action failed) */}
        {error && users.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  {canManageUsers && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    {/* User Details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {getUserTypeIcon(user)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-gray-400 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type & Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getUserTypeIcon(user)}
                          <span className="ml-1">{getUserTypeLabel(user)}</span>
                        </span>
                        {user.dealerProfile && (
                          <div className="text-xs text-gray-500">
                            {user.dealerProfile.subscriptionType} • {user.dealerProfile.verified ? 'Verified' : 'Unverified'}
                          </div>
                        )}
                        {user.adminProfile && (
                          <div className="text-xs text-gray-500">
                            {user.adminProfile.title || 'Administrator'}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user.status, user.emailVerified)}
                        <span className="ml-1">
                          {user.status === 'PENDING_VERIFICATION' ? 'Pending' : user.status}
                        </span>
                      </span>
                      {!user.emailVerified && (
                        <div className="text-xs text-orange-600 mt-1">Email not verified</div>
                      )}
                    </td>

                    {/* Activity */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(user.lastLoginAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never logged in</span>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {user.carsCount !== undefined && (
                          <div className="flex items-center">
                            <Car className="w-3 h-3 mr-1" />
                            {user.activeCarsCount || 0}/{user.carsCount} cars
                          </div>
                        )}
                        {user.messagesCount !== undefined && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.messagesCount} messages
                          </div>
                        )}
                        {user.totalSpent && (
                          <div className="flex items-center text-green-600">
                            <Star className="w-3 h-3 mr-1" />
                            €{user.totalSpent}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    {canManageUsers && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Details */}
                          <button
                            onClick={() => {
                              fetchUserDetails(user.id);
                              setShowUserDetailsModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Role-specific actions */}
                          {user.role === 'DEALER' && !user.dealerProfile?.verified && (
                            <button
                              onClick={() => handleUserAction(user.id, 'verify_dealer')}
                              disabled={actionLoading === `verify_dealer-${user.id}`}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                              title="Verify Dealer"
                            >
                              {actionLoading === `verify_dealer-${user.id}` ? (
                                <div className="w-4 h-4 animate-spin border-2 border-green-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleUserAction(user.id, 'toggle_status', user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                            disabled={actionLoading === `toggle_status-${user.id}`}
                            className={`p-2 rounded-md transition-colors disabled:opacity-50 ${
                              user.status === 'ACTIVE' 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                          >
                            {actionLoading === `toggle_status-${user.id}` ? (
                              <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
                            ) : user.status === 'ACTIVE' ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>

                          {/* Admin-specific actions */}
                          {['SUPER_ADMIN', 'ADMIN', 'CONTENT_MOD'].includes(user.role) && (
                            <button
                              onClick={() => handleUserAction(user.id, 'reset_password')}
                              disabled={actionLoading === `reset_password-${user.id}`}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50"
                              title="Force Password Reset"
                            >
                              {actionLoading === `reset_password-${user.id}` ? (
                                <div className="w-4 h-4 animate-spin border-2 border-orange-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <Key className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Suspend User */}
                          {user.role === 'USER' && user.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => {
                                if (confirm(`Suspend ${user.firstName} ${user.lastName}?\n\nThis will disable their account but keep all data. They can be reactivated later.`)) {
                                  handleUserAction(user.id, 'suspend_user');
                                }
                              }}
                              disabled={actionLoading === `suspend_user-${user.id}`}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50"
                              title="Suspend User"
                            >
                              {actionLoading === `suspend_user-${user.id}` ? (
                                <div className="w-4 h-4 animate-spin border-2 border-orange-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Permanent Delete User (DANGEROUS) */}
                          {user.role === 'USER' && (
                            <button
                              onClick={() => {
                                const confirmation = confirm(`⚠️ PERMANENT DELETION\n\nDelete ${user.firstName} ${user.lastName} FOREVER?\n\nThis will:\n• Remove ALL user data permanently\n• Delete their cars, messages, likes\n• Free up their email for reuse\n• CANNOT BE UNDONE\n\nType "DELETE FOREVER" to confirm:`);
                                
                                if (confirmation) {
                                  const secondConfirmation = prompt(`⚠️ FINAL WARNING\n\nType "DELETE FOREVER" to permanently delete ${user.email}:`);
                                  
                                  if (secondConfirmation === "DELETE FOREVER") {
                                    handleUserAction(user.id, 'delete_user', undefined, true);
                                  } else if (secondConfirmation !== null) {
                                    alert("Deletion cancelled - incorrect confirmation text");
                                  }
                                }
                              }}
                              disabled={actionLoading === `delete_user-${user.id}`}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                              title="PERMANENT DELETE (Cannot be undone)"
                            >
                              {actionLoading === `delete_user-${user.id}` ? (
                                <div className="w-4 h-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && users.length > 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found matching your search</p>
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your search term or filters
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterUserType('all');
                  setFilterRole('all');
                  setFilterStatus('all');
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* No Users State */}
          {users.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users in the system yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Users will appear here once they register on the platform
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-6 rounded-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalUsers)}</span> of{' '}
                  <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateAdminModal && canCreateAdmins && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Admin</h3>
              <p className="text-sm text-gray-600 mt-1">Add a new administrator to the platform</p>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={createAdminForm.email}
                  onChange={(e) => setCreateAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter admin email address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={createAdminForm.firstName}
                    onChange={(e) => setCreateAdminForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={createAdminForm.lastName}
                    onChange={(e) => setCreateAdminForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Role
                </label>
                <select
                  value={createAdminForm.role}
                  onChange={(e) => setCreateAdminForm(prev => ({ ...prev, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Admin Creation Process:</p>
                    <ul className="mt-1 space-y-1 text-blue-700">
                      <li>• Temporary password will be generated</li>
                      <li>• Verification email will be sent</li>
                      <li>• Admin must change password on first login</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateAdminModal(false);
                    setCreateAdminForm({
                      email: '',
                      firstName: '',
                      lastName: '',
                      role: 'ADMIN'
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {getUserTypeIcon(selectedUser)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserDetailsModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email Verified:</span>
                    <p className="font-medium">{selectedUser.emailVerified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Member Since:</span>
                    <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  {selectedUser.bio && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Bio:</span>
                      <p className="font-medium">{selectedUser.bio}</p>
                    </div>
                  )}
                  {selectedUser.location && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Location:</span>
                      <p className="font-medium flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {selectedUser.location.area}, {selectedUser.location.county}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dealer Information */}
              {selectedUser.dealerProfile && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Dealer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Business Name:</span>
                      <p className="font-medium">{selectedUser.dealerProfile.businessName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Verified:</span>
                      <p className="font-medium">{selectedUser.dealerProfile.verified ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Subscription:</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <CreditCard className="w-3 h-3 mr-1" />
                        {selectedUser.dealerProfile.subscriptionType}
                      </span>
                    </div>
                    {selectedUser.dealerProfile.subscriptionExpires && (
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <p className="font-medium">{new Date(selectedUser.dealerProfile.subscriptionExpires).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedUser.dealerProfile.website && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Website:</span>
                        <a href={selectedUser.dealerProfile.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-800">
                          {selectedUser.dealerProfile.website}
                        </a>
                      </div>
                    )}
                    {selectedUser.dealerProfile.description && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Description:</span>
                        <p className="font-medium">{selectedUser.dealerProfile.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Information */}
              {selectedUser.adminProfile && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Admin Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Admin Role:</span>
                      <p className="font-medium">{selectedUser.adminProfile.adminRole}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">2FA Enabled:</span>
                      <p className="font-medium">{selectedUser.adminProfile.twoFactorEnabled ? 'Yes' : 'No'}</p>
                    </div>
                    {selectedUser.adminProfile.title && (
                      <div>
                        <span className="text-gray-500">Title:</span>
                        <p className="font-medium">{selectedUser.adminProfile.title}</p>
                      </div>
                    )}
                    {selectedUser.adminProfile.department && (
                      <div>
                        <span className="text-gray-500">Department:</span>
                        <p className="font-medium">{selectedUser.adminProfile.department}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-gray-500">Permissions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedUser.adminProfile.permissions.map((permission, index) => (
                          <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Statistics */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Activity Statistics
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {selectedUser.carsCount !== undefined && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Car className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{selectedUser.activeCarsCount || 0}/{selectedUser.carsCount}</p>
                      <p className="text-xs text-blue-800">Active/Total Cars</p>
                    </div>
                  )}
                  {selectedUser.messagesCount !== undefined && (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{selectedUser.messagesCount}</p>
                      <p className="text-xs text-green-800">Messages Sent</p>
                    </div>
                  )}
                  {selectedUser.totalSpent && (
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">€{selectedUser.totalSpent}</p>
                      <p className="text-xs text-yellow-800">Total Spent</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {canManageUsers && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUserAction(selectedUser.id, 'toggle_status', selectedUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedUser.status === 'ACTIVE'
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {selectedUser.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                    </button>
                    
                    {selectedUser.role === 'DEALER' && !selectedUser.dealerProfile?.verified && (
                      <button
                        onClick={() => handleUserAction(selectedUser.id, 'verify_dealer')}
                        className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors"
                      >
                        Verify Dealer
                      </button>
                    )}
                    
                    {['SUPER_ADMIN', 'ADMIN', 'CONTENT_MOD'].includes(selectedUser.role) && (
                      <button
                        onClick={() => handleUserAction(selectedUser.id, 'reset_password')}
                        className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md text-sm font-medium transition-colors"
                      >
                        Force Password Reset
                      </button>
                    )}
                    
                    {selectedUser.role === 'USER' && (
                      <button
                        onClick={() => {
                          setShowUserDetailsModal(false);
                          const confirmation = confirm(`⚠️ PERMANENT DELETION\n\nDelete ${selectedUser.firstName} ${selectedUser.lastName} FOREVER?\n\nThis will:\n• Remove ALL user data permanently\n• Delete their cars, messages, likes\n• Free up their email for reuse\n• CANNOT BE UNDONE`);
                          
                          if (confirmation) {
                            const secondConfirmation = prompt(`⚠️ FINAL WARNING\n\nType "DELETE FOREVER" to permanently delete ${selectedUser.email}:`);
                            
                            if (secondConfirmation === "DELETE FOREVER") {
                              handleUserAction(selectedUser.id, 'delete_user', undefined, true);
                            } else if (secondConfirmation !== null) {
                              alert("Deletion cancelled - incorrect confirmation text");
                            }
                          }
                        }}
                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition-colors"
                      >
                        🗑️ PERMANENT DELETE
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permission Warning for Non-Super Admins */}
      {!canManageUsers && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">
                <span className="font-medium">Limited Access:</span> Only Super Admins can manage user accounts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}