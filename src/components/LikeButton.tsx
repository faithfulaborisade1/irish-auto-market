'use client'

import { useState, useEffect, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LikeButtonProps {
  carId: string
  initialLikesCount?: number
  initialIsLiked?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
}

export default function LikeButton({ 
  carId, 
  initialLikesCount = 0, 
  initialIsLiked = false,
  size = 'md',
  showCount = true,
  className = ''
}: LikeButtonProps) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
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
    
    async function fetchLikeStatus() {
      try {
        const response = await fetch(`/api/cars/${carId}/like`)
        const data = await response.json()
        if (mounted && data.success) {
          setLikesCount(data.likesCount)
          setIsLiked(data.liked)
        }
      } catch (error) {
        console.error('Error fetching like status:', error)
      }
    }
    
    fetchLikeStatus()
    
    return () => {
      mounted = false
    }
  }, [carId]) // ✅ Only depends on carId

  // ✅ FIXED: Stable function reference
  const handleLike = useCallback(async () => {
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
      const method = isLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/cars/${carId}/like`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        // Optimistic UI update
        setIsLiked(data.liked)
        setLikesCount(data.likesCount)
        
        // Optional: Show toast notification
        if (data.liked) {
          // Could add toast: "Added to favorites!"
        } else {
          // Could add toast: "Removed from favorites"
        }
      } else {
        // Handle specific errors
        if (response.status === 401) {
          router.push('/login')
        } else {
          console.error('Like action failed:', data.error)
          // Could show error toast
        }
      }
    } catch (error) {
      console.error('Like action error:', error)
      // Could show error toast
    } finally {
      setIsLoading(false)
    }
  }, [user, isLoading, isLiked, carId, router])

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
            {likesCount}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`
          ${currentSize.button}
          rounded-full
          transition-all duration-200 ease-in-out
          ${isLiked 
            ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
            : 'text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
        `}
        title={user ? (isLiked ? 'Unlike this car' : 'Like this car') : 'Login to like cars'}
      >
        <Heart 
          className={`
            ${currentSize.icon} 
            transition-all duration-200
            ${isLiked ? 'fill-current' : ''}
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
          {likesCount}
        </span>
      )}
    </div>
  )
}