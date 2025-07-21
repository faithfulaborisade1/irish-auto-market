'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Star, Send, CheckCircle, AlertCircle, MessageSquare, Lightbulb } from 'lucide-react'

export default function FeedbackPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'GENERAL',
    subject: '',
    message: '',
    rating: 0,
    pageUrl: '',
    feature: '',
    anonymous: false
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const feedbackTypes = [
    { value: 'GENERAL', label: 'General Feedback', icon: MessageSquare },
    { value: 'BUG_REPORT', label: 'Bug Report', icon: AlertCircle },
    { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: Lightbulb },
    { value: 'USABILITY', label: 'Usability', icon: Star },
    { value: 'PERFORMANCE', label: 'Performance', icon: Star },
    { value: 'MOBILE_EXPERIENCE', label: 'Mobile Experience', icon: Star },
    { value: 'SEARCH_EXPERIENCE', label: 'Search Experience', icon: Star }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        name: formData.anonymous ? '' : formData.name,
        email: formData.anonymous ? '' : formData.email,
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setFormData({
          name: '',
          email: '',
          type: 'GENERAL',
          subject: '',
          message: '',
          rating: 0,
          pageUrl: '',
          feature: '',
          anonymous: false
        })
      } else {
        setError(data.message || 'Failed to submit feedback. Please try again.')
      }
    } catch (error) {
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    })
  }

  const handleRatingClick = (rating: number) => {
    setFormData({
      ...formData,
      rating
    })
  }

  const StarRating = ({ rating, onRatingClick }: { rating: number, onRatingClick: (rating: number) => void }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingClick(star)}
          className={`w-8 h-8 transition-colors ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
        >
          <Star className="w-full h-full fill-current" />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'No rating'}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="about" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Share Your Feedback
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us improve Irish Auto Market by sharing your thoughts and experiences with our platform.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Thank you for your feedback!</p>
                <p className="text-green-600 text-sm">Your input helps us improve our platform.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Anonymous Option */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="anonymous"
                  checked={formData.anonymous}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-blue-800 font-medium">Submit feedback anonymously</span>
              </label>
              <p className="text-blue-600 text-sm mt-1">
                Your name and email will not be stored if you choose anonymous feedback
              </p>
            </div>

            {/* Contact Information (hidden if anonymous) */}
            {!formData.anonymous && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your name (optional)"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your@email.com (optional)"
                  />
                </div>
              </div>
            )}

            {/* Feedback Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-3">
                What type of feedback is this? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <label
                      key={type.value}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.type === type.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleChange}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Overall Rating
              </label>
              <StarRating rating={formData.rating} onRatingClick={handleRatingClick} />
            </div>

            {/* Context Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="pageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Page/Feature
                </label>
                <input
                  type="text"
                  id="pageUrl"
                  name="pageUrl"
                  value={formData.pageUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Car search, Profile page, etc."
                />
              </div>

              <div>
                <label htmlFor="feature" className="block text-sm font-medium text-gray-700 mb-1">
                  Specific Feature
                </label>
                <input
                  type="text"
                  id="feature"
                  name="feature"
                  value={formData.feature}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Search filters, Message system, etc."
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Brief summary of your feedback"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Feedback Details *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Please share your detailed feedback, suggestions, or describe any issues you've encountered..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}