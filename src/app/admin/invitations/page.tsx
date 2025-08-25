// src/app/admin/invitations/page.tsx - COMPLETE UPDATED VERSION
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Mail, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  Upload,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Download,
  FileText,
  Trash2
} from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  location?: string;
  status: 'SENT' | 'VIEWED' | 'REGISTERED' | 'ALREADY_MEMBER';
  sentAt: string;
  viewedAt?: string;
  registeredAt?: string;
  invitedBy: {
    name: string;
    email: string;
  };
  dealerUser?: {
    id: string;
    name: string;
    email: string;
    registeredAt: string;
    businessName?: string;
    verified: boolean;
  };
}

interface InvitationStats {
  total: number;
  sent: number;
  viewed: number;
  registered: number;
  alreadyMember: number;
}

interface SendResult {
  successful: any[];
  failed: any[];
  alreadyExists: any[];
}

export default function DealerInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats>({
    total: 0,
    sent: 0,
    viewed: 0,
    registered: 0,
    alreadyMember: 0
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters and pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    businessName: '',
    contactName: '',
    phone: '',
    location: ''
  });
  const [bulkEmails, setBulkEmails] = useState('');

  // Refs for preventing infinite loops
  const fetchInProgress = useRef(false);
  const mounted = useRef(true);

  // Fetch invitations with filters
  const fetchInvitations = useCallback(async () => {
    if (fetchInProgress.current) return;

    fetchInProgress.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status: statusFilter
      });

      const response = await fetch(`/api/admin/invitations?${params}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (mounted.current) {
          setInvitations(data.invitations);
          setStats(data.statistics);
          setTotalPages(data.pagination.totalPages);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch invitations');
      }
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      setError('Network error loading invitations');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [page, search, statusFilter]);

  // Initial load
  useEffect(() => {
    mounted.current = true;
    fetchInvitations();

    return () => {
      mounted.current = false;
      fetchInProgress.current = false;
    };
  }, [fetchInvitations]);

  // Send individual invitation
  const sendInvitation = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        const { summary, results } = data;
        
        // Show appropriate message based on results
        if (summary.successful > 0) {
          setSuccess(`✅ Invitation sent successfully to ${formData.email}`);
        } else if (summary.alreadyExists > 0) {
          const reason = results.alreadyExists[0]?.reason || 'already exists';
          setError(`❌ Cannot send invitation: ${reason}`);
        } else if (summary.failed > 0) {
          const reason = results.failed[0]?.reason || 'unknown error';
          setError(`❌ Failed to send invitation: ${reason}`);
        } else {
          setError('❌ No invitation was sent');
        }
        
        // Clear form and close modal
        setFormData({
          email: '',
          businessName: '',
          contactName: '',
          phone: '',
          location: ''
        });
        setShowForm(false);
        
        // Refresh the list to show updated data
        fetchInvitations();
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (error: any) {
      setError('Network error sending invitation');
    } finally {
      setSending(false);
    }
  };

  // Send bulk invitations
  const sendBulkInvitations = async () => {
    if (!bulkEmails.trim()) {
      setError('Please enter at least one email address');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse bulk emails (support various formats)
      const emailLines = bulkEmails.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const invitations = emailLines.map(line => {
        // Support CSV format: email,businessName,contactName,phone,location
        const parts = line.split(',').map(p => p.trim());
        return {
          email: parts[0] || '',
          businessName: parts[1] || '',
          contactName: parts[2] || '',
          phone: parts[3] || '',
          location: parts[4] || ''
        };
      }).filter(inv => inv.email);

      if (invitations.length === 0) {
        setError('No valid email addresses found');
        return;
      }

      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ invitations })
      });

      const data = await response.json();

      if (response.ok) {
        const { summary, results } = data;
        
        // Create detailed success/error messages
        let message = '';
        if (summary.successful > 0) {
          message += `✅ ${summary.successful} invitation${summary.successful > 1 ? 's' : ''} sent successfully`;
        }
        if (summary.failed > 0) {
          message += message ? '\n' : '';
          message += `❌ ${summary.failed} failed`;
        }
        if (summary.alreadyExists > 0) {
          message += message ? '\n' : '';
          message += `⚠️ ${summary.alreadyExists} already exist${summary.alreadyExists > 1 ? '' : 's'} (duplicates skipped)`;
        }
        
        // Show success if any were sent, otherwise show error
        if (summary.successful > 0) {
          setSuccess(message);
        } else {
          setError(message || 'No invitations were sent');
        }
        
        // Clear form and close modal
        setBulkEmails('');
        setBulkMode(false);
        setShowForm(false);
        
        // Refresh the list to show updated data
        fetchInvitations();
      } else {
        setError(data.error || 'Failed to send bulk invitations');
      }
    } catch (error: any) {
      setError('Network error sending bulk invitations');
    } finally {
      setSending(false);
    }
  };

  // Status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'VIEWED': return 'bg-yellow-100 text-yellow-800';
      case 'REGISTERED': return 'bg-green-100 text-green-800';
      case 'ALREADY_MEMBER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return <Mail className="w-4 h-4" />;
      case 'VIEWED': return <Eye className="w-4 h-4" />;
      case 'REGISTERED': return <CheckCircle className="w-4 h-4" />;
      case 'ALREADY_MEMBER': return <Users className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-6 h-6 text-green-600" />
                Dealer Invitations
              </h1>
              <p className="text-gray-600 text-sm">Invite dealers to join Irish Auto Market</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchInvitations}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Success</p>
                <p className="text-green-700 text-sm whitespace-pre-line">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-2">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-gray-600 text-sm">Total Invitations</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-2">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.sent}</h3>
            <p className="text-gray-600 text-sm">Sent</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 rounded-lg p-2">
                <Eye className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.viewed}</h3>
            <p className="text-gray-600 text-sm">Viewed</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.registered}</h3>
            <p className="text-gray-600 text-sm">Registered</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gray-100 rounded-lg p-2">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.alreadyMember}</h3>
            <p className="text-gray-600 text-sm">Already Member</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by email, business name, or contact name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="SENT">Sent</option>
                  <option value="VIEWED">Viewed</option>
                  <option value="REGISTERED">Registered</option>
                  <option value="ALREADY_MEMBER">Already Member</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Invitations Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invitations</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No invitations found</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Send First Invitation
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invited By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations.map((invitation) => (
                    <tr key={invitation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invitation.contactName || invitation.email}
                          </div>
                          <div className="text-sm text-gray-500">{invitation.email}</div>
                          {invitation.phone && (
                            <div className="text-xs text-gray-400">{invitation.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invitation.businessName || '-'}
                        </div>
                        {invitation.location && (
                          <div className="text-xs text-gray-500">{invitation.location}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                          {getStatusIcon(invitation.status)}
                          {invitation.status.replace('_', ' ')}
                        </span>
                        {invitation.dealerUser && (
                          <div className="mt-1">
                            <a
                              href={`/admin/users/${invitation.dealerUser.id}`}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              View Dealer
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invitation.invitedBy.name}</div>
                        <div className="text-xs text-gray-500">{invitation.invitedBy.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(invitation.sentAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(invitation.sentAt).toLocaleTimeString()}
                        </div>
                        {invitation.viewedAt && (
                          <div className="text-xs text-yellow-600">
                            Viewed: {new Date(invitation.viewedAt).toLocaleDateString()}
                          </div>
                        )}
                        {invitation.registeredAt && (
                          <div className="text-xs text-green-600">
                            Registered: {new Date(invitation.registeredAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          className="text-blue-600 hover:text-blue-700 mr-3"
                          onClick={() => {
                            // TODO: View invitation details
                            console.log('View invitation:', invitation.id);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send Invitation Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {bulkMode ? 'Send Bulk Invitations' : 'Send Dealer Invitation'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      bulkMode 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {bulkMode ? 'Single Mode' : 'Bulk Mode'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setBulkMode(false);
                      setFormData({
                        email: '',
                        businessName: '',
                        contactName: '',
                        phone: '',
                        location: ''
                      });
                      setBulkEmails('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {bulkMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Addresses
                    </label>
                    <textarea
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      placeholder="Enter one email per line, or CSV format:&#10;dealer1@example.com&#10;dealer2@example.com,Business Name,Contact Name,Phone,Location&#10;dealer3@example.com"
                      className="w-full h-40 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supports: email per line, or CSV format (email,business,contact,phone,location)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="dealer@example.com"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="ABC Motors Ltd"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="John Smith"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+353 1 234 5678"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Dublin, Ireland"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setBulkMode(false);
                  setFormData({
                    email: '',
                    businessName: '',
                    contactName: '',
                    phone: '',
                    location: ''
                  });
                  setBulkEmails('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bulkMode ? sendBulkInvitations : sendInvitation}
                disabled={sending || (bulkMode ? !bulkEmails.trim() : !formData.email)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {bulkMode ? 'Send Invitations' : 'Send Invitation'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}