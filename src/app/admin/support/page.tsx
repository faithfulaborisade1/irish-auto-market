// src/app/admin/support/page.tsx - Updated with Working View/Reply Buttons
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MessageCircle, 
  Star, 
  AlertTriangle, 
  Users, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Filter,
  Search,
  Mail,
  Phone,
  Eye,
  MessageSquare,
  ArrowRight,
  Calendar,
  AlertCircle,
  XCircle,
  User,
  Car,
  Building2,
  RefreshCw
} from 'lucide-react'

interface SupportStats {
  summary: {
    totalContacts: number
    totalFeedback: number
    totalReports: number
    pendingContacts: number
    pendingFeedback: number
    pendingReports: number
    criticalReports: number
    averageRating: number
    avgResponseTime: number
  }
  today: {
    contacts: number
    feedback: number
    reports: number
  }
  urgentActions?: Array<{
    message: string
    priority: string
    url: string
  }>
}

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  category: string
  priority: string
  status: string
  createdAt: string
  userId?: string
  userAgent?: string
  ipAddress?: string
  messagePreview?: string
  timeSinceCreated?: string
}

export default function AdminSupportPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data states
  const [stats, setStats] = useState<SupportStats | null>(null)
  const [contacts, setContacts] = useState<ContactMessage[]>([])

  // Fetch support statistics
  const fetchSupportStats = async () => {
    try {
      const response = await fetch('/api/admin/support/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch support stats: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setStats(data.data)
        setError(null)
      } else {
        throw new Error(data.message || 'Failed to fetch support statistics')
      }
    } catch (err: any) {
      console.error('Error fetching support stats:', err)
      setError(err.message)
    }
  }

  // Fetch contact messages
  const fetchContactMessages = async () => {
    try {
      const response = await fetch('/api/admin/support/contact?limit=10', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch contact messages: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setContacts(data.data.contacts || [])
      } else {
        console.warn('Contact messages API returned error:', data.message)
        setContacts([])
      }
    } catch (err: any) {
      console.error('Error fetching contact messages:', err)
      setContacts([])
    }
  }

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchSupportStats(),
        fetchContactMessages()
      ])
      setLoading(false)
    }

    loadData()
  }, [])

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchSupportStats(),
      fetchContactMessages()
    ])
    setRefreshing(false)
  }

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // Handle view contact
  const handleViewContact = (contactId: string) => {
    router.push(`/admin/support/contact/${contactId}`)
  }

  // Handle reply to contact
  const handleReplyContact = (contactId: string) => {
    router.push(`/admin/support/contact/${contactId}?action=reply`)
  }

  if (loading) {
    return <LoadingPage />
  }

  if (error && !stats) {
    return <ErrorPage error={error} onRetry={handleRefresh} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <MessageCircle className="w-7 h-7 text-blue-600" />
                Support Management
              </h1>
              <p className="text-gray-600 mt-1">Manage contact messages, feedback, and issue reports</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium">{new Date().toLocaleTimeString()}</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} stats={stats} />
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <SupportContent 
              activeTab={activeTab} 
              stats={stats} 
              contacts={contacts}
              onRefresh={handleRefresh}
              onViewContact={handleViewContact}
              onReplyContact={handleReplyContact}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab Navigation Component
function TabNavigation({ 
  activeTab, 
  onTabChange, 
  stats 
}: { 
  activeTab: string
  onTabChange: (tab: string) => void
  stats: SupportStats | null 
}) {
  const tabs = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: TrendingUp, 
      count: null 
    },
    { 
      id: 'contacts', 
      name: 'Contact Messages', 
      icon: Mail, 
      count: stats?.summary?.pendingContacts || 0
    },
    { 
      id: 'feedback', 
      name: 'Feedback', 
      icon: Star, 
      count: stats?.summary?.pendingFeedback || 0
    },
    { 
      id: 'reports', 
      name: 'Issue Reports', 
      icon: AlertTriangle, 
      count: stats?.summary?.pendingReports || 0
    }
  ]

  return (
    <>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
              isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.name}
            {tab.count !== null && tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </>
  )
}

// Support Content Component
function SupportContent({ 
  activeTab, 
  stats, 
  contacts,
  onRefresh,
  onViewContact,
  onReplyContact
}: { 
  activeTab: string
  stats: SupportStats | null
  contacts: ContactMessage[]
  onRefresh: () => void
  onViewContact: (id: string) => void
  onReplyContact: (id: string) => void
}) {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Support Data</h3>
        <p className="text-gray-600 mb-4">Unable to connect to the support API.</p>
        <button 
          onClick={onRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (activeTab === 'overview') {
    return <SupportOverview stats={stats} recentContacts={contacts} onViewContact={onViewContact} onReplyContact={onReplyContact} />
  } else if (activeTab === 'contacts') {
    return <ContactMessages contacts={contacts} onViewContact={onViewContact} onReplyContact={onReplyContact} />
  } else if (activeTab === 'feedback') {
    return <FeedbackManagement stats={stats} />
  } else if (activeTab === 'reports') {
    return <IssueReports stats={stats} />
  }

  return <SupportOverview stats={stats} recentContacts={contacts} onViewContact={onViewContact} onReplyContact={onReplyContact} />
}

// Support Overview Component
function SupportOverview({ 
  stats, 
  recentContacts, 
  onViewContact, 
  onReplyContact 
}: { 
  stats: SupportStats
  recentContacts: ContactMessage[]
  onViewContact: (id: string) => void
  onReplyContact: (id: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Urgent Actions Alert */}
      {stats.urgentActions && stats.urgentActions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Urgent Actions Required</h3>
          </div>
          <div className="space-y-2">
            {stats.urgentActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded p-3">
                <div>
                  <p className="font-medium text-gray-900">{action.message}</p>
                  <p className="text-sm text-gray-600">Priority: {action.priority}</p>
                </div>
                <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center gap-2">
                  Handle Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Contact Messages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 rounded-lg p-2">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {stats.summary.pendingContacts} pending
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.summary.totalContacts}</h3>
          <p className="text-gray-600 text-sm">Contact Messages</p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">+{stats.today.contacts} today</p>
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 rounded-lg p-2">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {stats.summary.averageRating}★ avg
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.summary.totalFeedback}</h3>
          <p className="text-gray-600 text-sm">User Feedback</p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">+{stats.today.feedback} today</p>
          </div>
        </div>

        {/* Issue Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 rounded-lg p-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              {stats.summary.criticalReports} critical
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.summary.totalReports}</h3>
          <p className="text-gray-600 text-sm">Issue Reports</p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">+{stats.today.reports} today</p>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 rounded-lg p-2">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Target: 6h
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.summary.avgResponseTime}h</h3>
          <p className="text-gray-600 text-sm">Avg Response Time</p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-green-600">Meeting target</p>
          </div>
        </div>
      </div>

      {/* Recent Contact Messages */}
      {recentContacts && recentContacts.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Recent Contact Messages
              </h3>
              <button 
                onClick={() => onViewContact('contacts')} 
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentContacts.slice(0, 5).map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          contact.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          contact.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {contact.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onViewContact(contact.id)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button 
                      onClick={() => onReplyContact(contact.id)}
                      className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Contact Messages Yet</h3>
          <p className="text-gray-600">Contact messages will appear here when users submit the contact form.</p>
        </div>
      )}
    </div>
  )
}

// Contact Messages Component
function ContactMessages({ 
  contacts, 
  onViewContact, 
  onReplyContact 
}: { 
  contacts: ContactMessage[]
  onViewContact: (id: string) => void
  onReplyContact: (id: string) => void
}) {
  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Contact Messages</h3>
        <p className="text-gray-600">Contact messages will appear here when users submit the contact form.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Contact Messages</h2>
        <div className="text-sm text-gray-600">
          Showing {contacts.length} message{contacts.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <div key={contact.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        contact.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        contact.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {contact.priority}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        contact.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                        contact.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {contact.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600">{contact.subject}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-blue-600">{contact.category.replace('_', ' ')}</span>
                    </div>
                    {contact.message && (
                      <p className="text-sm text-gray-600 mt-2 max-w-lg">
                        {contact.message.substring(0, 150)}
                        {contact.message.length > 150 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onViewContact(contact.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button 
                    onClick={() => onReplyContact(contact.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Placeholder components for other tabs
function FeedbackManagement({ stats }: { stats: SupportStats }) {
  return (
    <div className="text-center py-12">
      <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Feedback Management</h3>
      <p className="text-gray-600 mb-4">
        Total feedback: {stats.summary.totalFeedback} | Average rating: {stats.summary.averageRating}★
      </p>
      <p className="text-sm text-gray-500">Feedback management interface coming soon.</p>
    </div>
  )
}

function IssueReports({ stats }: { stats: SupportStats }) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Issue Reports Management</h3>
      <p className="text-gray-600 mb-4">
        Total reports: {stats.summary.totalReports} | Critical: {stats.summary.criticalReports}
      </p>
      <p className="text-sm text-gray-500">Issue reports management interface coming soon.</p>
    </div>
  )
}

// Loading and Error Components
function LoadingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading support data...</p>
      </div>
    </div>
  )
}

function ErrorPage({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Support Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  )
}