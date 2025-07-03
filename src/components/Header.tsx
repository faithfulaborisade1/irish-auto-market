'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, LogOut, Settings, Heart, FileText, ChevronDown, MessageCircle, Plus, Car, UserCircle, Edit3 } from 'lucide-react'
import { useState, useEffect } from 'react'
import NotificationBell from './NotificationBell'

interface HeaderProps {
  currentPage?: 'home' | 'cars' | 'sell' | 'dealers' | 'about' | 'messages' | 'place-ad' | 'profile'
}

export default function Header({ currentPage = 'home' }: HeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const router = useRouter()

  // Check if user is logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
        }
      } catch (error) {
        console.log('User not logged in')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Fetch unread messages count when user is logged in
  useEffect(() => {
    if (user) {
      fetchUnreadMessagesCount()
    }
  }, [user])

  const fetchUnreadMessagesCount = async () => {
    try {
      const response = await fetch('/api/conversations')
      const data = await response.json()
      if (data.success) {
        const unreadCount = data.conversations.filter((conv: any) => conv.hasUnread).length
        setUnreadMessagesCount(unreadCount)
      }
    } catch (error) {
      console.error('Error fetching unread messages count:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setShowUserMenu(false)
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handlePlaceAd = () => {
    if (!user) {
      // Redirect to login with return URL
      router.push('/login?redirect=/place-ad')
    } else {
      router.push('/place-ad')
    }
  }

  // Get user display name (for dealers, show business name)
  const getUserDisplayName = () => {
    if (!user) return ''
    if (user.dealerProfile?.businessName) {
      return user.dealerProfile.businessName
    }
    return user.firstName
  }

  // Get user initials
  const getUserInitials = () => {
    if (!user) return ''
    if (user.dealerProfile?.businessName) {
      return user.dealerProfile.businessName.charAt(0).toUpperCase()
    }
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const dropdown = document.getElementById('user-dropdown')
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              {/* Irish Flag Colors Logo: Green, White, Orange */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-600 via-white to-orange-500 flex items-center justify-center shadow-lg border-2 border-gray-200">
                <div className="text-green-700 font-bold text-sm tracking-tight drop-shadow-sm">
                  IAM
                </div>
              </div>
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

          {/* Navigation */}
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
            {/* <Link 
              href="/dealers" 
              className={`font-medium hover:text-green-600 transition-colors ${
                currentPage === 'dealers' ? 'text-green-600' : 'text-gray-700'
              }`}
            >
              DEALERS
            </Link> */}
            {/* <Link 
              href="/about" 
              className={`font-medium hover:text-green-600 transition-colors ${
                currentPage === 'about' ? 'text-green-600' : 'text-gray-700'
              }`}
            >
              ABOUT
            </Link> */}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              // Loading state
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              // Logged in user section
              <div className="flex items-center space-x-3">
                {/* Place Ad Button - Primary CTA */}
                <button
                  onClick={handlePlaceAd}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 'place-ad'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  <Plus size={18} />
                  <span className="hidden sm:block">Place Ad</span>
                </button>

                {/* Messages Link with Badge */}
                <Link
                  href="/messages"
                  className={`relative flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    currentPage === 'messages'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="hidden sm:block font-medium">Messages</span>
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>

                {/* Notification Bell */}
                <NotificationBell userId={user.id} />
                
                {/* User Menu */}
                <div className="relative" id="user-dropdown">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={getUserDisplayName()}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-medium text-sm">
                        {getUserInitials()}
                      </div>
                    )}
                    <span className="hidden md:block max-w-24 truncate">{getUserDisplayName()}</span>
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
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircle className="w-4 h-4 mr-3" />
                        My Profile
                      </Link>

                      <Link 
                        href="/profile/edit" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Edit3 className="w-4 h-4 mr-3" />
                        Edit Profile
                      </Link>

                      <div className="border-t border-gray-100 my-2"></div>

                      {/* Activity Section */}
                      <Link 
                        href="/messages" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
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
                      
                      {(user.role === 'DEALER' || user.role === 'USER') && (
                        <Link 
                          href="/my-ads" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FileText className="w-4 h-4 mr-3" />
                          My Ads
                        </Link>
                      )}
                      
                      <Link 
                        href="/saved" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart className="w-4 h-4 mr-3" />
                        Saved Cars
                      </Link>
                      
                      <div className="border-t border-gray-100 my-2"></div>

                      {/* Settings & Admin */}
                      <Link 
                        href="/settings" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>

                      {/* Admin Dashboard Link for Admins */}
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
              // Not logged in - show login/register buttons + Place Ad
              <div className="flex items-center space-x-3">
                {/* Place Ad Button for Non-Authenticated Users */}
                <button
                  onClick={handlePlaceAd}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  <Plus size={18} />
                  <span className="hidden sm:block">Place Ad</span>
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
              onClick={() => {
                // Add mobile menu toggle logic here if needed
                console.log('Mobile menu clicked')
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}