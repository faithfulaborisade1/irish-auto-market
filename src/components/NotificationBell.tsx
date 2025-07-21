'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Heart, TrendingDown, Car, X, Check } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Notification {
  id: string
  type: 'CAR_LIKED' | 'PRICE_DROP' | 'CAR_SOLD' | 'INQUIRY_RECEIVED' | 'SYSTEM_UPDATE'
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: string
  car?: {
    id: string
    title: string
    make: string
    model: string
    price: number
    image?: string
  }
  metadata?: any
}

interface NotificationBellProps {
  userId?: string
}

// Helper functions outside component (already optimized ✅)
function getNotificationIcon(type: string) {
  switch (type) {
    case 'CAR_LIKED':
      return <Heart className="w-5 h-5 text-red-500" />
    case 'PRICE_DROP':
      return <TrendingDown className="w-5 h-5 text-green-500" />
    case 'CAR_SOLD':
      return <Car className="w-5 h-5 text-blue-500" />
    case 'INQUIRY_RECEIVED':
      return <Bell className="w-5 h-5 text-yellow-500" />
    default:
      return <Bell className="w-5 h-5 text-gray-500" />
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

// 🚀 FIX: Add caching for notifications (5 minutes cache)
let notificationsCache: Notification[] = []
let notificationsCacheTime = 0
let unreadCountCache = 0
const NOTIFICATIONS_CACHE_DURATION = 300000 // 5 minutes

export default function NotificationBell({ userId }: NotificationBellProps) {
  // 🚀 FIX: Start with cached data if available
  const [notifications, setNotifications] = useState<Notification[]>(notificationsCache)
  const [unreadCount, setUnreadCount] = useState(unreadCountCache)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // 🚀 FIX: Optimized fetch with caching and error handling
  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    
    // Use cache if available and fresh
    const now = Date.now()
    if (notificationsCache.length > 0 && (now - notificationsCacheTime) < NOTIFICATIONS_CACHE_DURATION) {
      setNotifications(notificationsCache)
      setUnreadCount(unreadCountCache)
      setHasLoaded(true)
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=10', {
        headers: {
          'Cache-Control': 'max-age=60' // Browser cache for 1 minute
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Update cache
        notificationsCache = data.notifications
        notificationsCacheTime = now
        unreadCountCache = data.unreadCount
        
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Don't clear existing data on error, just log it
    } finally {
      setLoading(false)
      setHasLoaded(true)
    }
  }, [userId])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        })
      })

      if (response.ok) {
        // Update both state and cache
        const updatedNotifications = notifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
        
        setNotifications(updatedNotifications)
        setUnreadCount(prev => Math.max(0, prev - 1))
        
        // Update cache
        notificationsCache = updatedNotifications
        unreadCountCache = Math.max(0, unreadCountCache - 1)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [notifications])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAllAsRead: true
        })
      })

      if (response.ok) {
        const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }))
        
        setNotifications(updatedNotifications)
        setUnreadCount(0)
        
        // Update cache
        notificationsCache = updatedNotifications
        unreadCountCache = 0
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [notifications])

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
  }, [markAsRead])

  // Click outside handler (already optimized ✅)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const dropdown = document.getElementById('notification-dropdown')
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 🚀 FIX: Only fetch when component becomes visible (lazy loading)
  useEffect(() => {
    if (userId && !hasLoaded) {
      // Delay initial load to not block header rendering
      const timer = setTimeout(() => {
        fetchNotifications()
      }, 500) // 500ms delay
      
      return () => clearTimeout(timer)
    }
  }, [userId, hasLoaded, fetchNotifications])

  // 🚀 FIX: Much longer auto-refresh interval to reduce API calls
  useEffect(() => {
    if (!userId || !hasLoaded) return

    // Increase interval to 5 minutes to reduce server load
    const interval = setInterval(fetchNotifications, 300000) // 5 minutes
    return () => clearInterval(interval)
  }, [userId, hasLoaded, fetchNotifications])

  // 🚀 FIX: Only fetch when dropdown is opened (on-demand loading)
  const handleBellClick = useCallback(() => {
    setIsOpen(!isOpen)
    
    // Fetch fresh data when opening dropdown (if cache is old)
    if (!isOpen && userId) {
      const now = Date.now()
      if ((now - notificationsCacheTime) > 60000) { // 1 minute threshold
        fetchNotifications()
      }
    }
  }, [isOpen, userId, fetchNotifications])

  // Don't render if no user
  if (!userId) return null

  return (
    <div className="relative" id="notification-dropdown">
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown - Only render when open */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-green-600 hover:text-green-700 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">We'll notify you about likes, inquiries, and updates</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id}>
                  {notification.actionUrl ? (
                    <Link
                      href={notification.actionUrl}
                      onClick={() => handleNotificationClick(notification)}
                      className={`block p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <NotificationContent 
                        notification={notification} 
                        formatTimeAgo={formatTimeAgo}
                        getNotificationIcon={getNotificationIcon}
                      />
                    </Link>
                  ) : (
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <NotificationContent 
                        notification={notification} 
                        formatTimeAgo={formatTimeAgo}
                        getNotificationIcon={getNotificationIcon}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-green-600 hover:text-green-700 transition-colors font-medium"
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Notification content component (already optimized ✅)
function NotificationContent({ 
  notification, 
  formatTimeAgo,
  getNotificationIcon
}: { 
  notification: Notification
  formatTimeAgo: (dateString: string) => string
  getNotificationIcon: (type: string) => JSX.Element
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">
            {notification.title}
          </p>
          {!notification.read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {notification.message}
        </p>
        
        {notification.car && (
          <div className="flex items-center mt-2 space-x-2">
            {notification.car.image && (
              <Image
                src={notification.car.image}
                alt={notification.car.title}
                width={32}
                height={32}
                className="rounded object-cover"
                loading="lazy" // 🚀 FIX: Lazy load images
              />
            )}
            <div className="text-xs text-gray-500">
              {notification.car.make} {notification.car.model} • €{notification.car.price.toLocaleString()}
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-400 mt-2">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
    </div>
  )
}