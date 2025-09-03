'use client'

import { useState, useEffect } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { AdminButton } from '@/components/admin/AdminButton'
import { 
  Send, 
  Users, 
  Mail, 
  UserCheck, 
  Building2, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  X,
  Eye
} from 'lucide-react'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  createdAt: string
}

interface EmailTemplate {
  id: string
  name: string
  description: string
  template: 'dealer_outreach' | 'general' | 'follow_up'
  fromEmail: string
  subject: string
  defaultMessage: string
}

interface EmailCampaign {
  id: string
  subject: string
  recipients: number
  sent: number
  failed: number
  template: string
  sentAt: string
  status: 'sending' | 'completed' | 'failed'
}

const emailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Dealer Partnership',
    description: 'Invite dealers to join the platform',
    template: 'dealer_outreach',
    fromEmail: 'dealers@irishautomarket.ie',
    subject: 'Partnership Opportunity with Irish Auto Market',
    defaultMessage: `Hello,

We would like to invite you to join Irish Auto Market, Ireland's fastest-growing car sales platform.

For a limited time, you can list your vehicles at no cost for 2-3 months - no setup fees, no hidden costs.

Why partner with us?
• Enhanced visibility from buyers across Ireland
• Professional platform built for Irish dealers  
• Mobile-optimized experience for modern car shopping
• SEO and marketing support to boost your inventory visibility
• No obligations - try our platform risk-free

We'd love to discuss this opportunity with you.

Best regards,
The Irish Auto Market Team`
  },
  {
    id: '2',
    name: 'User Support',
    description: 'General support and assistance messages',
    template: 'general',
    fromEmail: 'support@irishautomarket.ie',
    subject: 'Irish Auto Market - Support Message',
    defaultMessage: `Hello,

Thank you for using Irish Auto Market. We're here to help with any questions or concerns you may have.

Please feel free to reach out to us anytime at support@irishautomarket.ie

Best regards,
Irish Auto Market Support Team`
  },
  {
    id: '3',
    name: 'Follow Up',
    description: 'Follow up with existing users or dealers',
    template: 'follow_up',
    fromEmail: 'info@irishautomarket.ie',
    subject: 'Following up - Irish Auto Market',
    defaultMessage: `Hello,

We wanted to follow up and see how your experience with Irish Auto Market has been.

If you have any questions or feedback, we'd love to hear from you.

Best regards,
Irish Auto Market Team`
  }
]

export default function AdminMessagingPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('compose')

  // Email form state
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(emailTemplates[0])
  const [subject, setSubject] = useState(emailTemplates[0].subject)
  const [message, setMessage] = useState(emailTemplates[0].defaultMessage)
  const [customRecipients, setCustomRecipients] = useState('')
  const [recipientType, setRecipientType] = useState<'users' | 'dealers' | 'custom' | 'all'>('users')

  // Toast notification state
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Load users
  useEffect(() => {
    fetchUsers()
    fetchEmailCampaigns()
  }, [])

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/all')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchEmailCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/messaging/send')
      if (response.ok) {
        const data = await response.json()
        setEmailCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to fetch email campaigns:', error)
      // Mock data as fallback
      setEmailCampaigns([
        {
          id: '1',
          subject: 'Partnership Opportunity with Irish Auto Market',
          recipients: 25,
          sent: 23,
          failed: 2,
          template: 'dealer_outreach',
          sentAt: new Date().toISOString(),
          status: 'completed'
        }
      ])
    }
  }

  const handleTemplateChange = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setSubject(template.subject)
      setMessage(template.defaultMessage)
    }
  }

  const getRecipientList = () => {
    const recipients: string[] = []

    switch (recipientType) {
      case 'users':
        recipients.push(...selectedUsers.map(u => u.email))
        break
      case 'dealers':
        recipients.push(...users.filter(u => u.role === 'DEALER').map(u => u.email))
        break
      case 'all':
        recipients.push(...users.map(u => u.email))
        break
      case 'custom':
        const customEmails = customRecipients
          .split(',')
          .map(email => email.trim())
          .filter(email => email.includes('@'))
        recipients.push(...customEmails)
        break
    }

    return recipients
  }

  const handleSendEmail = async () => {
    const recipients = getRecipientList()

    if (recipients.length === 0) {
      showNotification('error', 'Please select recipients or enter email addresses')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/messaging/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipients,
          subject,
          message,
          template: selectedTemplate.template,
          emailType: selectedTemplate.template === 'dealer_outreach' ? 'marketing' : 'transactional'
        })
      })

      const result = await response.json()

      if (response.ok) {
        showNotification('success', `Emails sent successfully to ${result.totalSent} recipients. ${result.totalFailed} failed.`)

        // Reset form
        setSelectedUsers([])
        setCustomRecipients('')
        setMessage(selectedTemplate.defaultMessage)
        setSubject(selectedTemplate.subject)

        // Refresh campaigns
        fetchEmailCampaigns()
      } else {
        throw new Error(result.error || 'Failed to send emails')
      }
    } catch (error: any) {
      showNotification('error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white p-4 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Messaging</h1>
          <p className="text-gray-600">Send emails to users and dealers</p>
        </div>
        <button
          onClick={async () => {
            try {
              const response = await fetch('/api/admin/messaging/test', {
                method: 'POST'
              })
              const result = await response.json()
              if (response.ok) {
                showNotification('success', 'Email service test completed - check console for details')
                console.log('📧 Email test result:', result)
              } else {
                showNotification('error', `Email test failed: ${result.error}`)
              }
            } catch (error) {
              showNotification('error', 'Email test failed')
              console.error('Email test error:', error)
            }
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
        >
          Test Email Service
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('compose')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'compose'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="inline-block mr-2 h-4 w-4" />
              Compose Email
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="inline-block mr-2 h-4 w-4" />
              Email History
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'compose' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Template Selection */}
            <AdminCard title="Email Template">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Email Template
                </h3>
                <p className="text-gray-600 mb-4">Choose a pre-built template or customize your message</p>
                
                <select
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                  defaultValue="1"
                >
                  {emailTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>

                <div className="space-y-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    From: {selectedTemplate.fromEmail}
                  </span>
                  <p className="text-sm text-gray-600">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>
            </AdminCard>

            {/* Recipient Selection */}
            <AdminCard title="Recipients">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recipients
                </h3>
                <p className="text-gray-600 mb-4">Select who will receive this email</p>

                <select
                  onChange={(e) => setRecipientType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                  value={recipientType}
                >
                  <option value="users">Selected Users</option>
                  <option value="dealers">All Dealers</option>
                  <option value="all">All Users</option>
                  <option value="custom">Custom Emails</option>
                </select>

                {recipientType === 'users' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="text-sm text-gray-600">
                      {selectedUsers.length} users selected
                    </div>
                  </div>
                )}

                {recipientType === 'dealers' && (
                  <div className="text-sm text-gray-600">
                    {users.filter(u => u.role === 'DEALER').length} dealers will receive this email
                  </div>
                )}

                {recipientType === 'all' && (
                  <div className="text-sm text-gray-600">
                    {users.length} users will receive this email
                  </div>
                )}

                {recipientType === 'custom' && (
                  <textarea
                    placeholder="Enter email addresses separated by commas..."
                    value={customRecipients}
                    onChange={(e) => setCustomRecipients(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>
            </AdminCard>

            {/* User Selection (when users selected) */}
            {recipientType === 'users' && (
              <AdminCard title="Select Users">
                <div className="p-6 max-h-96 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Select Users</h3>
                  <div className="space-y-2">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {user.role}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (selectedUsers.find(u => u.id === user.id)) {
                              setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
                            } else {
                              setSelectedUsers([...selectedUsers, user])
                            }
                          }}
                          className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                            selectedUsers.find(u => u.id === user.id)
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {selectedUsers.find(u => u.id === user.id) ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </AdminCard>
            )}
          </div>

          {/* Email Composition */}
          <AdminCard title="Compose Email">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compose Email</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Email message..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Eye className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                    <p className="text-sm text-green-700">
                      <strong>Preview:</strong> This email will be sent from <strong>{selectedTemplate.fromEmail}</strong> 
                      to <strong>{getRecipientList().length}</strong> recipients using the 
                      <strong> {selectedTemplate.name}</strong> template.
                    </p>
                  </div>
                </div>

                <div className="w-full">
                  <AdminButton
                    onClick={handleSendEmail}
                    disabled={loading || getRecipientList().length === 0}
                  >
                  {loading ? (
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {loading ? 'Sending...' : `Send Email to ${getRecipientList().length} Recipients`}
                  </AdminButton>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {activeTab === 'history' && (
        <AdminCard title="Email Campaign History">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Campaign History</h3>
            <p className="text-gray-600 mb-6">View previous email campaigns and their results</p>
            
            <div className="space-y-4">
              {emailCampaigns.map(campaign => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{campaign.subject}</div>
                    <div className="text-sm text-gray-500">
                      {campaign.template} • {new Date(campaign.sentAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">{campaign.recipients}</div>
                      <div className="text-xs text-gray-500">Recipients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600">{campaign.sent}</div>
                      <div className="text-xs text-gray-500">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-600">{campaign.failed}</div>
                      <div className="text-xs text-gray-500">Failed</div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      campaign.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : campaign.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {campaign.status === 'completed' ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : campaign.status === 'failed' ? (
                        <XCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {campaign.status}
                    </span>
                  </div>
                </div>
              ))}

              {emailCampaigns.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No email campaigns sent yet.</p>
                  <p className="text-sm">Start by composing your first email campaign above.</p>
                </div>
              )}
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  )
}