// src/app/admin/support/contact/[id]/page.tsx - Individual Contact Message View
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Calendar,
  User,
  Globe,
  Phone,
  MessageSquare,
  Send,
  Check,
  Clock,
  AlertTriangle,
  Eye,
  Reply,
  Archive,
  Trash2
} from 'lucide-react'

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
}

export default function ContactMessagePage() {
  const params = useParams()
  const router = useRouter()
  const contactId = params.id as string

  const [contact, setContact] = useState<ContactMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Fetch contact message details
  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await fetch(`/api/admin/support/contact/${contactId}`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch contact: ${response.status}`)
        }

        const data = await response.json()
        if (data.success) {
          setContact(data.data)
          setError(null)
        } else {
          throw new Error(data.message || 'Failed to fetch contact message')
        }
      } catch (err: any) {
        console.error('Error fetching contact:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (contactId) {
      fetchContact()
    }
  }, [contactId])

  // Handle reply submission
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyMessage.trim() || !contact) return

    setSending(true)
    try {
      const response = await fetch(`/api/admin/support/contact/${contactId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          message: replyMessage,
          status: 'RESOLVED'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to send reply: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Update contact status
        setContact(prev => prev ? { ...prev, status: 'RESOLVED' } : null)
        setShowReplyForm(false)
        setReplyMessage('')
        alert('Reply sent successfully!')
      } else {
        throw new Error(data.message || 'Failed to send reply')
      }
    } catch (err: any) {
      console.error('Error sending reply:', err)
      alert(`Error sending reply: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!contact) return

    try {
      const response = await fetch(`/api/admin/support/contact/${contactId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setContact(prev => prev ? { ...prev, status: newStatus } : null)
      } else {
        throw new Error(data.message || 'Failed to update status')
      }
    } catch (err: any) {
      console.error('Error updating status:', err)
      alert(`Error updating status: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact message...</p>
        </div>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Message Not Found</h3>
          <p className="text-gray-600 mb-4">{error || 'The contact message could not be found.'}</p>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Mail className="w-7 h-7 text-blue-600" />
                  Contact Message
                </h1>
                <p className="text-gray-600 mt-1">Reference: IAM-{contact.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contact.status)}`}>
                {contact.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(contact.priority)}`}>
                {contact.priority} Priority
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Contact Details */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Message Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{contact.subject}</h3>
                    <p className="text-sm text-gray-500">From: {contact.name} ({contact.email})</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(contact.createdAt).toLocaleDateString('en-IE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="text-blue-600">{contact.category.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-3">Message:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{contact.message}</p>
                </div>
              </div>
            </div>

            {/* Reply Form */}
            {!showReplyForm ? (
              <div className="text-center">
                <button
                  onClick={() => setShowReplyForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Reply className="w-5 h-5" />
                  Reply to Message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Send Reply</h3>
                </div>
                <form onSubmit={handleReply} className="p-6">
                  <div className="mb-4">
                    <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Response
                    </label>
                    <textarea
                      id="reply"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={6}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Type your response here..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={sending || !replyMessage.trim()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Reply
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReplyForm(false)
                        setReplyMessage('')
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-500">Customer</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{contact.email}</p>
                    <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline">
                      Send Email
                    </a>
                  </div>
                </div>
                {contact.ipAddress && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{contact.ipAddress}</p>
                      <p className="text-sm text-gray-500">IP Address</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                {contact.status === 'NEW' && (
                  <button
                    onClick={() => handleStatusUpdate('IN_PROGRESS')}
                    className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Mark In Progress
                  </button>
                )}
                {contact.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleStatusUpdate('RESOLVED')}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Mark Resolved
                  </button>
                )}
                <button
                  onClick={() => handleStatusUpdate('CLOSED')}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}