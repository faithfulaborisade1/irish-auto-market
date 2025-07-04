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

// ✅ FIXED: Move helper function outside component to prevent re-creation
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

// ✅ FIXED: Move helper function outside component
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

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // ✅ FIXED: Use useCallback to create stable function reference
  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=10')
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [userId]) // ✅ Only depends on userId

  // ✅ FIXED: Use useCallback for mark as read
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
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  // ✅ FIXED: Use useCallback for mark all as read
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
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [])

  // ✅ FIXED: Stable function reference for notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
    // Navigation will be handled by the Link component
  }, [markAsRead])

  // ✅ FIXED: Close dropdown when clicking outside
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

  // ✅ FIXED: Fetch notifications when userId changes (using stable function)
  useEffect(() => {
    if (userId) {
      fetchNotifications()
    } else {
      // Clear notifications when no user
      setNotifications([])
      setUnreadCount(0)
    }
  }, [userId, fetchNotifications])

  // ✅ FIXED: Auto-refresh with proper dependencies and longer interval
  useEffect(() => {
    if (!userId) return

    // Increase interval to 2 minutes to reduce API calls
    const interval = setInterval(fetchNotifications, 120000) // 2 minutes
    return () => clearInterval(interval)
  }, [userId, fetchNotifications]) // ✅ Include fetchNotifications in dependencies

  // Don't render if no user
  if (!userId) return null

  return (
    <div className="relative" id="notification-dropdown">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id}>
                  {notification.actionUrl ? (
                    <Link
                      href={notification.actionUrl}
                      onClick={() => handleNotificationClick(notification)}
                      className={`block p-4 hover:bg-gray-50 transition-colors ${
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
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
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
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ✅ FIXED: Notification content component with stable props
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