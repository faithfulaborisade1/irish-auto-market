'use client'

import Link from 'next/link'
import { User, LogOut, Settings, Heart, FileText, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import NotificationBell from './NotificationBell'

interface HeaderProps {
  currentPage?: 'home' | 'cars' | 'sell' | 'dealers' | 'about'
}

export default function Header({ currentPage = 'home' }: HeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [loading, setLoading] = useState(true)

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
              <img 
                src="/images/logo.png" 
                alt="Irish Auto Market Logo" 
                className="h-10 w-10"
              />
              <div className="flex items-center space-x-2">
                <div className="text-xl font-bold text-gray-900">
                  IRISH
                </div>
                <div className="text-xl font-bold text-secondary">
                  AUTO MARKET
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden space-x-8 md:flex">
            <Link 
              href="/cars" 
              className={`font-medium hover:text-primary ${
                currentPage === 'cars' ? 'text-primary' : 'text-gray-700'
              }`}
            >
              BUY
            </Link>
            <Link 
              href="/sell" 
              className={`font-medium hover:text-primary ${
                currentPage === 'sell' ? 'text-primary' : 'text-gray-700'
              }`}
            >
              SELL
            </Link>
            <Link 
              href="/dealers" 
              className={`font-medium hover:text-primary ${
                currentPage === 'dealers' ? 'text-primary' : 'text-gray-700'
              }`}
            >
              DEALERS
            </Link>
            <Link 
              href="/about" 
              className={`font-medium hover:text-primary ${
                currentPage === 'about' ? 'text-primary' : 'text-gray-700'
              }`}
            >
              ABOUT
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              // Loading state
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              // Logged in user section
              <div className="flex items-center space-x-3">
                {/* Notification Bell */}
                <NotificationBell userId={user.id} />
                
                {/* User Menu */}
                <div className="relative" id="user-dropdown">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-medium text-sm">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <span className="hidden md:block">{user.firstName}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white py-2 shadow-xl border border-gray-200 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.role !== 'USER' && (
                          <p className="text-xs text-primary font-medium capitalize">
                            {user.role.toLowerCase()}
                          </p>
                        )}
                      </div>
                      
                      <Link 
                        href="/profile" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
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
                      
                      <Link 
                        href="/settings" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      
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
              // Not logged in - show login/register buttons
              <>
                <Link 
                  href="/login" 
                  className="font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  LOGIN
                </Link>
                <Link 
                  href="/register" 
                  className="rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 transition-colors"
                >
                  REGISTER
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}