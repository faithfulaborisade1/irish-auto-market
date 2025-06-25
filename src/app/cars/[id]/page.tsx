'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Gauge, Fuel, Settings, Eye, MessageCircle, X } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LikeButton from '@/components/LikeButton'

interface CarDetailPageProps {
  params: {
    id: string
  }
}

export default function CarDetailPage({ params }: CarDetailPageProps) {
  const router = useRouter()
  const [car, setCar] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    fetchCar()
    checkAuth()
  }, [params.id])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      console.log('User not logged in')
    }
  }

  async function fetchCar() {
    try {
      setLoading(true)
      const response = await fetch(`/api/cars/${params.id}`)
      
      if (!response.ok) {
        setError(true)
        return
      }
      
      const data = await response.json()
      if (data.success && data.car) {
        setCar(data.car)
      } else {
        setError(true)
      }
    } catch (error) {
      console.error('Error fetching car:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || sendingMessage) return
    
    if (!user) {
      router.push('/login')
      return
    }

    if (user.id === car.userId) {
      alert("You can't message yourself about your own car!")
      return
    }

    try {
      setSendingMessage(true)
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          carId: params.id,
          message: messageText.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Redirect to the conversation
        router.push(`/messages/${data.conversation.id}`)
      } else {
        alert('Failed to send message: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  const openMessageModal = () => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (user.id === car.userId) {
      alert("You can't message yourself about your own car!")
      return
    }
    
    setShowMessageModal(true)
    setMessageText(`Hi, I'm interested in your ${car.make} ${car.model} ${car.year}. Is it still available?`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading car details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Car Not Found</h1>
            <p className="text-gray-600 mb-4">The car you're looking for doesn't exist or has been removed.</p>
            <Link href="/cars" className="text-primary hover:underline">
              Back to car listings
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link 
          href="/cars" 
          className="inline-flex items-center text-primary hover:text-primary/80 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Car images */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="relative h-96">
                <Image
                  src={car.images[0]?.url || '/placeholder-car.jpg'}
                  alt={car.images[0]?.alt || car.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4">
                  {car.featured && (
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                      Featured
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  <div className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {car.views}
                  </div>
                  <div className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm flex items-center">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {car.inquiries}
                  </div>
                </div>
              </div>
            </div>

            {/* Car details */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{car.title}</h1>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Year</div>
                    <div className="font-medium">{car.year}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Gauge className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Mileage</div>
                    <div className="font-medium">{car.mileage?.toLocaleString()} km</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Fuel className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Fuel Type</div>
                    <div className="font-medium capitalize">{car.fuelType?.toLowerCase()}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Settings className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Transmission</div>
                    <div className="font-medium capitalize">{car.transmission?.toLowerCase()}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{car.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="text-3xl font-bold text-primary mb-4">
                €{car.price.toLocaleString()}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Make</span>
                  <span className="font-medium">{car.make}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Model</span>
                  <span className="font-medium">{car.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Body Type</span>
                  <span className="font-medium capitalize">{car.bodyType?.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Color</span>
                  <span className="font-medium">{car.color}</span>
                </div>
              </div>

              <button 
                onClick={openMessageModal}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 font-medium mb-3 transition-colors flex items-center justify-center"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </button>
              
              <div className="flex space-x-3">
                <button className="flex-1 border border-primary text-primary py-3 px-4 rounded-lg hover:bg-primary/5 font-medium transition-colors">
                  Save to Favorites
                </button>
                <LikeButton 
                  carId={car.id}
                  size="lg"
                  showCount={true}
                  className="flex-shrink-0"
                />
              </div>
            </div>

            {/* Seller info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="font-medium">{car.seller.name}</div>
                  <div className="text-sm text-gray-600 capitalize flex items-center">
                    {car.seller.type} Seller
                    {car.seller.verified && (
                      <span className="ml-2 text-green-600">✓ Verified</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{car.location.city}, {car.location.county}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <a
                  href={`tel:${car.seller.phone}`}
                  className="flex items-center justify-center w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </a>
                <button 
                  onClick={openMessageModal}
                  className="flex items-center justify-center w-full border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Send Message to Seller</h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={car.images[0]?.url || '/placeholder-car.jpg'}
                    alt={car.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <div className="font-medium text-sm">{car.make} {car.model} {car.year}</div>
                    <div className="text-primary font-semibold">€{car.price.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write your message here..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    messageText.trim() && !sendingMessage
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}