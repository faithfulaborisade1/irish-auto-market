'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, LogOut, Settings, Heart, FileText, ChevronDown, MessageCircle, Plus, Car, UserCircle, Edit3, Menu, X } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'

// 🚀 FIX #1: Lazy load the NotificationBell component
const NotificationBell = dynamic(() => import('./NotificationBell'), {
  loading: () => <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>,
  ssr: false // Don't render on server if it makes API calls
})

interface HeaderProps {
  currentPage?: 'home' | 'cars' | 'sell' | 'dealers' | 'about' | 'messages' | 'place-ad' | 'profile' | 'my-ads' | 'saved-cars' | 'find-dealer'
}

// 🚀 FIX #2: Add caching for auth state
let authCache: any = null
let authCacheTime = 0
const AUTH_CACHE_DURATION = 30000 // 30 seconds

export default function Header({ currentPage = 'home' }: HeaderProps) {
  const [user, setUser] = useState<any>(authCache) // Start with cache if available
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [loading, setLoading] = useState(!authCache) // Don't show loading if we have cache
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const router = useRouter()

  // 🚀 FIX #3: Optimized auth check with caching
  useEffect(() => {
    async function checkAuth() {
      const now = Date.now()
      
      // Use cache if available and fresh
      if (authCache && (now - authCacheTime) < AUTH_CACHE_DURATION) {
        setUser(authCache)
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/me', {
          // Add cache headers to prevent unnecessary requests
          headers: {
            'Cache-Control': 'max-age=30'
          }
        })
        const data = await response.json()
        
        if (data.success) {
          authCache = data.user
          authCacheTime = now
          setUser(data.user)
        } else {
          authCache = null
          authCacheTime = now
          setUser(null)
        }
      } catch (error) {
        console.log('User not logged in')
        authCache = null
        authCacheTime = now
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  // 🚀 FIX #4: Debounced and cached unread messages fetch
  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/conversations', {
        headers: {
          'Cache-Control': 'max-age=10' // Cache for 10 seconds
        }
      })
      const data = await response.json()
      if (data.success) {
        const unreadCount = data.conversations.filter((conv: any) => conv.hasUnread).length
        setUnreadMessagesCount(unreadCount)
      }
    } catch (error) {
      console.error('Error fetching unread messages count:', error)
    }
  }, [user])

  // 🚀 FIX #5: Only fetch messages once, with longer delay
  useEffect(() => {
    if (user) {
      // Delay messages fetch to not block initial render
      const timer = setTimeout(() => {
        fetchUnreadMessagesCount()
      }, 1000) // 1 second delay
      
      return () => clearTimeout(timer)
    } else {
      setUnreadMessagesCount(0)
    }
  }, [user]) // Remove fetchUnreadMessagesCount from dependencies

  // 🚀 FIX #6: Optimized event handlers with useCallback
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Clear cache
      authCache = null
      authCacheTime = 0
      
      setUser(null)
      setUnreadMessagesCount(0)
      setShowUserMenu(false)
      setShowMobileMenu(false)
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [])

  const handlePlaceAd = useCallback(() => {
    if (!user) {
      router.push('/login?redirect=/place-ad')
    } else {
      router.push('/place-ad')
    }
    setShowMobileMenu(false)
  }, [user, router])

  // 🚀 FIX #7: Memoize computed values
  const userDisplayName = useMemo(() => {
    if (!user) return ''
    if (user.dealerProfile?.businessName) {
      return user.dealerProfile.businessName
    }
    return user.firstName
  }, [user])

  const userInitials = useMemo(() => {
    if (!user) return ''
    if (user.dealerProfile?.businessName) {
      return user.dealerProfile.businessName.charAt(0).toUpperCase()
    }
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }, [user])

  // 🚀 FIX #8: Optimized click outside handler
  useEffect(() => {
    if (!showUserMenu && !showMobileMenu) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const dropdown = document.getElementById('user-dropdown')
      const mobileMenu = document.getElementById('mobile-menu')
      
      if (dropdown && !dropdown.contains(target)) {
        setShowUserMenu(false)
      }
      if (mobileMenu && !mobileMenu.contains(target)) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu, showMobileMenu])

  // 🚀 FIX #9: Show basic header immediately, load user features progressively
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Always render first */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/iam-logo.svg" 
                alt="Irish Auto Market"
                className="h-10 w-10"
              />
              <div className="flex items-center space-x-2">
                <div className="text-xl font-bold text-green-700">
                  IRISH
                </div>
                <div className="text-xl font-bold text-orange-600">
                  AUTO MARKET
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Always render */}
          <nav className="hidden space-x-8 md:flex">
            <Link 
              href="/cars" 
              className={`font-medium hover:text-green-600 transition-colors flex items-center space-x-1 ${
                currentPage === 'cars' ? 'text-green-600' : 'text-gray-700'
              }`}
            >
              <Car size={18} />
              <span>BUY</span>
            </Link>
            <button
              onClick={handlePlaceAd}
              className={`font-medium hover:text-green-600 transition-colors ${
                currentPage === 'sell' || currentPage === 'place-ad' ? 'text-green-600' : 'text-gray-700'
              }`}
            >
              SELL
            </button>
            <Link 
              href="/find-dealer" 
              className={`font-medium hover:text-green-600 transition-colors ${
                currentPage === 'find-dealer' ? 'text-green-600' : 'text-gray-700'
              }`}
            >
              DEALERS
            </Link>
          </nav>

          {/* Auth Section - Progressive Loading */}
          <div className="flex items-center space-x-4">
            {loading ? (
              // Minimal loading state
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block w-20 h-8 rounded bg-gray-200 animate-pulse"></div>
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
              </div>
            ) : user ? (
              // Logged in user section
              <div className="flex items-center space-x-3">
                {/* Place Ad Button */}
                <button
                  onClick={handlePlaceAd}
                  className={`hidden sm:flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 'place-ad'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  <Plus size={18} />
                  <span>Place Ad</span>
                </button>

                {/* Messages Link - Load immediately but fetch count later */}
                <Link
                  href="/messages"
                  className={`hidden sm:flex relative items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    currentPage === 'messages'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">Messages</span>
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>

                {/* Notification Bell - Lazy loaded */}
                <div className="hidden sm:block">
                  <NotificationBell userId={user.id} />
                </div>
                
                {/* User Menu */}
                <div className="relative" id="user-dropdown">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={userDisplayName}
                        className="w-8 h-8 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-medium text-sm">
                        {userInitials}
                      </div>
                    )}
                    <span className="hidden md:block max-w-24 truncate">{userDisplayName}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white py-2 shadow-xl border border-gray-200 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.dealerProfile?.businessName || `${user.firstName} ${user.lastName}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        {user.role !== 'USER' && (
                          <p className="text-xs text-green-600 font-medium capitalize">
                            {user.role.toLowerCase().replace('_', ' ')}
                          </p>
                        )}
                      </div>
                      
                      {/* Profile Section */}
                      <Link 
                        href="/profile" 
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          currentPage === 'profile' 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircle className="w-4 h-4 mr-3" />
                        My Profile
                      </Link>

                      <div className="border-t border-gray-100 my-2"></div>

                      <Link 
                        href="/my-ads" 
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          currentPage === 'my-ads' 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Car className="w-4 h-4 mr-3" />
                        My Ads
                      </Link>
                      
                      <Link 
                        href="/saved-cars" 
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          currentPage === 'saved-cars' 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart className="w-4 h-4 mr-3" />
                        Saved Cars
                      </Link>

                      <Link 
                        href="/messages" 
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          currentPage === 'messages' 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <MessageCircle className="w-4 h-4 mr-3" />
                        Messages
                        {unreadMessagesCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                          </span>
                        )}
                      </Link>
                      
                      <div className="border-t border-gray-100 my-2"></div>

                      <Link 
                        href="/profile/edit" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>

                      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                        <Link 
                          href="/admin" 
                          className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Admin Dashboard
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Not logged in
              <div className="hidden sm:flex items-center space-x-3">
                <button
                  onClick={handlePlaceAd}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  <Plus size={18} />
                  <span>Place Ad</span>
                </button>

                <Link 
                  href="/login" 
                  className="font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  LOGIN
                </Link>
                <Link 
                  href="/register" 
                  className="rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 transition-colors"
                >
                  REGISTER
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Only render when needed */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4" id="mobile-menu">
            <div className="space-y-4">
              <Link 
                href="/cars" 
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'cars' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <Car size={18} />
                <span>BUY</span>
              </Link>
              
              <button
                onClick={handlePlaceAd}
                className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'sell' || currentPage === 'place-ad' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Plus size={18} />
                <span>SELL</span>
              </button>

              <Link 
                href="/find-dealer" 
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'find-dealer' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                <UserCircle size={18} />
                <span>DEALERS</span>
              </Link>

              {user && (
                <>
                  <div className="border-t border-gray-200 my-4"></div>
                  
                  <Link
                    href="/messages"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 'messages' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <MessageCircle size={18} />
                    <span>Messages</span>
                    {unreadMessagesCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </span>
                    )}
                  </Link>

                  <Link 
                    href="/my-ads" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 'my-ads' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Car size={18} />
                    <span>My Ads</span>
                  </Link>

                  <Link 
                    href="/saved-cars" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 'saved-cars' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Heart size={18} />
                    <span>Saved Cars</span>
                  </Link>

                  <Link 
                    href="/profile" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === 'profile' ? 'text-green-600 bg-green-50' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <UserCircle size={18} />
                    <span>My Profile</span>
                  </Link>
                </>
              )}

              {!user && (
                <>
                  <div className="border-t border-gray-200 my-4"></div>
                  
                  <Link 
                    href="/login" 
                    className="block px-4 py-2 font-medium text-gray-700 hover:text-green-600 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    LOGIN
                  </Link>
                  <Link 
                    href="/register" 
                    className="block px-4 py-2 font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    REGISTER
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}