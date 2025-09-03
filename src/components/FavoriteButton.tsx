'use client'

import { useState, useEffect, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
  carId: string
  initialFavoritesCount?: number
  initialIsFavorited?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
}

export default function FavoriteButton({ 
  carId, 
  initialFavoritesCount = 0, 
  initialIsFavorited = false,
  size = 'md',
  showCount = true,
  className = ''
}: FavoriteButtonProps) {
  const router = useRouter()
  const [favoritesCount, setFavoritesCount] = useState(initialFavoritesCount)
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // ✅ FIXED: Check authentication only once
  useEffect(() => {
    let mounted = true
    
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        if (mounted && data.success) {
          setUser(data.user)
        }
      } catch (error) {
        // User not logged in - this is fine
      } finally {
        if (mounted) {
          setAuthChecked(true)
        }
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
  }, []) // ✅ Empty dependency array - runs once only

  // ✅ FIXED: Fetch like status only once when component mounts
  useEffect(() => {
    let mounted = true
    
    async function fetchFavoriteStatus() {
      try {
        const response = await fetch(`/api/cars/${carId}/favorite`)
        const data = await response.json()
        if (mounted && data.success) {
          setFavoritesCount(data.favoritesCount)
          setIsFavorited(data.favorited)
        }
      } catch (error) {
        console.error('Error fetching favorite status:', error)
      }
    }
    
    fetchFavoriteStatus()
    
    return () => {
      mounted = false
    }
  }, [carId]) // ✅ Only depends on carId

  // ✅ FIXED: Stable function reference
  const handleFavorite = useCallback(async () => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname)
      router.push(`/login?returnUrl=${returnUrl}`)
      return
    }

    if (isLoading) return

    setIsLoading(true)

    try {
      const method = isFavorited ? 'DELETE' : 'POST'
      const response = await fetch(`/api/cars/${carId}/favorite`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        // Optimistic UI update
        setIsFavorited(data.favorited)
        setFavoritesCount(data.favoritesCount)
        
        // Optional: Show toast notification
        if (data.favorited) {
          // Could add toast: "Added to favorites!"
        } else {
          // Could add toast: "Removed from favorites"
        }
      } else {
        // Handle specific errors
        if (response.status === 401) {
          router.push('/login')
        } else {
          console.error('Favorite action failed:', data.error)
          // Could show error toast
        }
      }
    } catch (error) {
      console.error('Favorite action error:', error)
      // Could show error toast
    } finally {
      setIsLoading(false)
    }
  }, [user, isLoading, isFavorited, carId, router])

  // Size variants
  const sizeClasses = {
    sm: {
      button: 'p-1.5',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      button: 'p-2',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    lg: {
      button: 'p-3',
      icon: 'w-6 h-6',
      text: 'text-base'
    }
  }

  const currentSize = sizeClasses[size]

  // Don't render until auth is checked
  if (!authChecked) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className={`${currentSize.button} rounded-full bg-gray-100 animate-pulse`}>
          <div className={`${currentSize.icon} bg-gray-200 rounded`} />
        </div>
        {showCount && (
          <span className={`${currentSize.text} text-gray-400`}>
            {favoritesCount}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <button
        onClick={handleFavorite}
        disabled={isLoading}
        className={`
          ${currentSize.button}
          rounded-full
          transition-all duration-200 ease-in-out
          ${isFavorited 
            ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
            : 'text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
        `}
        title={user ? (isFavorited ? 'Remove from favorites' : 'Add to favorites') : 'Login to add favorites'}
      >
        <Heart 
          className={`
            ${currentSize.icon} 
            transition-all duration-200
            ${isFavorited ? 'fill-current' : ''}
            ${isLoading ? 'animate-pulse' : ''}
          `}
        />
      </button>
      
      {showCount && (
        <span className={`
          ${currentSize.text} 
          font-medium text-gray-600
          transition-all duration-200
          ${isLoading ? 'animate-pulse' : ''}
        `}>
          {favoritesCount}
        </span>
      )}
    </div>
  )
}