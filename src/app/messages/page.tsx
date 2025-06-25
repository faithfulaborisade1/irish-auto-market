'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, Search, Archive, Trash2, CheckCircle2, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Conversation {
  id: string
  car: {
    id: string
    title: string
    make: string
    model: string
    year: number
    price: number
    image: string | null
  }
  otherUser: {
    id: string
    name: string
    avatar: string | null
    isDealer: boolean
    businessName?: string
    verified: boolean
  }
  lastMessage: {
    content: string
    createdAt: string
    senderName: string
    isFromMe: boolean
  } | null
  status: string
  hasUnread: boolean
  lastMessageAt: string | null
  createdAt: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversations, setSelectedConversations] = useState<string[]>([])

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/conversations')
      const data = await response.json()
      
      if (data.success) {
        setConversations(data.conversations)
      } else {
        console.error('Failed to fetch conversations:', data.error)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv => 
    conv.car.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.car.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-IE', { 
      day: 'numeric', 
      month: 'short' 
    })
  }

  const toggleConversationSelection = (conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    )
  }

  const selectAllConversations = () => {
    if (selectedConversations.length === filteredConversations.length) {
      setSelectedConversations([])
    } else {
      setSelectedConversations(filteredConversations.map(conv => conv.id))
    }
  }

  const unreadCount = conversations.filter(conv => conv.hasUnread).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="messages" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="messages" />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="w-8 h-8 mr-3 text-primary" />
                Messages
                {unreadCount > 0 && (
                  <span className="ml-3 bg-primary text-white text-sm px-3 py-1 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {conversations.length === 0 
                  ? 'No conversations yet'
                  : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            
            {selectedConversations.length > 0 && (
              <div className="flex items-center space-x-2">
                <button className="flex items-center text-gray-600 hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-gray-50">
                  <Archive className="w-4 h-4 mr-1" />
                  Archive ({selectedConversations.length})
                </button>
                <button className="flex items-center text-red-600 hover:text-red-700 transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>
          
          {conversations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={selectAllConversations}
                className="flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {selectedConversations.length === filteredConversations.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start browsing cars to begin conversations with sellers'
              }
            </p>
            <Link
              href="/cars"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 transition-colors"
            >
              Browse Cars
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors ${
                  conversation.hasUnread ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center p-4">
                  {/* Selection checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedConversations.includes(conversation.id)}
                    onChange={() => toggleConversationSelection(conversation.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary mr-4"
                  />

                  {/* Car image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={conversation.car.image || '/placeholder-car.jpg'}
                      alt={conversation.car.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Conversation details */}
                  <div className="flex-1 min-w-0 ml-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.car.make} {conversation.car.model} {conversation.car.year}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      €{conversation.car.price.toLocaleString()}
                    </p>
                    
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-gray-800 font-medium">
                        {conversation.otherUser.name}
                      </span>
                      {conversation.otherUser.verified && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />
                      )}
                      {conversation.otherUser.isDealer && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {conversation.otherUser.businessName || 'Dealer'}
                        </span>
                      )}
                    </div>
                    
                    {conversation.lastMessage && (
                      <p className={`text-sm truncate ${
                        conversation.hasUnread ? 'font-medium text-gray-900' : 'text-gray-600'
                      }`}>
                        {conversation.lastMessage.isFromMe ? 'You: ' : ''}
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Unread indicator and link */}
                  <div className="flex items-center ml-4">
                    {conversation.hasUnread && (
                      <div className="w-3 h-3 bg-primary rounded-full mr-3"></div>
                    )}
                    <Link
                      href={`/messages/${conversation.id}`}
                      className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}