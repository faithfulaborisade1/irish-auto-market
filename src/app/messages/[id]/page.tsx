'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  Phone, 
  MoreHorizontal,
  CheckCircle2,
  Star,
  MapPin,
  Calendar,
  Eye,
  Wifi,
  WifiOff
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useSocket } from '@/hooks/useSocket'

interface Message {
  id: string
  content: string
  messageType: string
  attachments: any
  createdAt: string
  readAt: string | null
  sender: {
    id: string
    name: string
    avatar: string | null
  }
  isFromMe: boolean
}

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
    status: string
  }
  otherUser: {
    id: string
    name: string
    avatar: string | null
    isDealer: boolean
    businessName?: string
    verified: boolean
  }
  isUserBuyer: boolean
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const conversationId = params.id
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [showCarDetails, setShowCarDetails] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize socket connection (disabled in production)
  const { socket, connected, joinConversation, leaveConversation, sendTyping, stopTyping, broadcastMessage, broadcastRead } = useSocket(currentUser?.id)

  // Get current user and set up socket
  useEffect(() => {
    async function getCurrentUser() {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        if (data.success) {
          setCurrentUser(data.user)
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      }
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (conversationId && currentUser) {
      fetchConversation()
    }
  }, [conversationId, currentUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Socket event listeners (disabled in production)
  useEffect(() => {
    if (!socket || !currentUser) return

    // All WebSocket functionality disabled for production
    // These functions do nothing but prevent errors
    joinConversation(conversationId)

    return () => {
      leaveConversation(conversationId)
    }
  }, [socket, currentUser, conversationId])

  useEffect(() => {
    if (conversationId) {
      fetchConversation()
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      const data = await response.json()
      
      if (data.success) {
        setConversation(data.conversation)
        setMessages(data.messages)
      } else {
        console.error('Failed to fetch conversation:', data.error)
        if (response.status === 404) {
          router.push('/messages')
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
      router.push('/messages')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const messageContent = newMessage.trim()
      setNewMessage('')

      // Optimistically add message to UI
      const tempMessage: Message = {
        id: 'temp-' + Date.now(),
        content: messageContent,
        messageType: 'TEXT',
        attachments: null,
        createdAt: new Date().toISOString(),
        readAt: null,
        sender: {
          id: 'current-user',
          name: 'You',
          avatar: null
        },
        isFromMe: true
      }
      setMessages(prev => [...prev, tempMessage])

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageContent,
          messageType: 'TEXT'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Replace temp message with real message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? data.message : msg
          )
        )
        
        // Broadcast message (disabled in production)
        if (currentUser) {
          broadcastMessage(conversationId, data.message, currentUser.id)
        }
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        console.error('Failed to send message:', data.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id.startsWith('temp-')))
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    if (!isTyping && currentUser && conversation) {
      setIsTyping(true)
      sendTyping(conversationId, `${currentUser.firstName} ${currentUser.lastName}`, currentUser.id)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (currentUser) {
        stopTyping(conversationId, currentUser.id)
      }
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else {
      handleTyping()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMs / 3600000)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString('en-IE', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

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

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="messages" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Conversation not found</h2>
            <Link href="/messages" className="text-primary hover:text-primary/80">
              Back to Messages
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentPage="messages" />
      
      <div className="flex-1 flex">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/messages')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                    {conversation.otherUser.avatar ? (
                      <img 
                        src={conversation.otherUser.avatar} 
                        alt={conversation.otherUser.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      conversation.otherUser.name.charAt(0)
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">
                        {conversation.otherUser.name}
                      </h3>
                      {conversation.otherUser.verified && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {/* Only show connection status when actually connected */}
                      {connected && (
                        <div className="flex items-center space-x-1">
                          <div className="relative group">
                            <Wifi className="w-3 h-3 text-green-500" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Connected
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {conversation.otherUser.isDealer && (
                      <p className="text-sm text-primary">
                        {conversation.otherUser.businessName || 'Verified Dealer'}
                      </p>
                    )}
                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <p className="text-xs text-gray-500 italic">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((message, index) => {
              const showTime = index === 0 || 
                new Date(messages[index - 1].createdAt).getTime() - new Date(message.createdAt).getTime() > 300000 // 5 minutes

              return (
                <div key={message.id}>
                  {showTime && (
                    <div className="text-center my-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isFromMe 
                        ? 'bg-primary text-white ml-auto' 
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-between mt-1 text-xs ${
                        message.isFromMe ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {message.isFromMe && message.readAt && (
                          <span className="ml-2">Seen</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex items-end space-x-3">
              <button className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Write a message..."
                  rows={1}
                  className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className={`p-2 rounded-lg transition-colors ${
                  newMessage.trim() && !sending
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Car Details Sidebar */}
        {showCarDetails && (
          <div className="w-80 bg-white border-l border-gray-200 p-6">
            <div className="space-y-6">
              {/* Car Image */}
              <div className="relative">
                <img
                  src={conversation.car.image || '/placeholder-car.jpg'}
                  alt={conversation.car.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {conversation.car.status === 'SOLD' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">SOLD</span>
                  </div>
                )}
              </div>

              {/* Car Details */}
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {conversation.car.make} {conversation.car.model}
                </h3>
                <p className="text-2xl font-bold text-primary mb-4">
                  €{conversation.car.price.toLocaleString()}
                </p>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{conversation.car.year}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  href={`/cars/${conversation.car.id}`}
                  className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-center block"
                >
                  View Full Listing
                </Link>
                
                {conversation.car.status === 'ACTIVE' && (
                  <button className="w-full border border-primary text-primary py-2 px-4 rounded-lg hover:bg-primary/10 transition-colors">
                    Make Offer
                  </button>
                )}
              </div>

              {/* Seller Info */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  {conversation.isUserBuyer ? 'Seller' : 'Buyer'}
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                    {conversation.otherUser.avatar ? (
                      <img 
                        src={conversation.otherUser.avatar} 
                        alt={conversation.otherUser.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      conversation.otherUser.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <p className="font-medium text-gray-900">
                        {conversation.otherUser.name}
                      </p>
                      {conversation.otherUser.verified && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {conversation.otherUser.isDealer && (
                      <p className="text-sm text-primary">
                        {conversation.otherUser.businessName || 'Verified Dealer'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}