'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AlertTriangle, Upload, X, Send, CheckCircle, AlertCircle, Bug, Shield, Flag } from 'lucide-react'

export default function ReportIssuePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterEmail: '',
    type: 'BUG',
    severity: 'MEDIUM',
    title: '',
    description: '',
    pageUrl: '',
    carId: '',
    dealerId: '',
    stepsToReproduce: '',
    errorDetails: '',
    anonymous: false
  })
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const issueTypes = [
    { value: 'BUG', label: 'Bug/Technical Issue', icon: Bug, description: 'Something is broken or not working correctly' },
    { value: 'SCAM_LISTING', label: 'Scam Listing', icon: Shield, description: 'Fraudulent or fake car listing' },
    { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content', icon: Flag, description: 'Offensive or inappropriate content' },
    { value: 'FAKE_DEALER', label: 'Fake Dealer', icon: AlertTriangle, description: 'Suspicious or fake dealer account' },
    { value: 'PRICING_ERROR', label: 'Pricing Error', icon: AlertCircle, description: 'Incorrect or misleading pricing' },
    { value: 'SPAM', label: 'Spam', icon: Flag, description: 'Spam messages or listings' },
    { value: 'HARASSMENT', label: 'Harassment', icon: Shield, description: 'Inappropriate user behavior' },
    { value: 'SECURITY_CONCERN', label: 'Security Concern', icon: Shield, description: 'Security vulnerability or concern' },
    { value: 'DATA_PRIVACY', label: 'Data Privacy', icon: Shield, description: 'Privacy or data protection issue' },
    { value: 'OTHER', label: 'Other', icon: AlertTriangle, description: 'Other issue not listed above' }
  ]

  const severityLevels = [
    { value: 'LOW', label: 'Low', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
    { value: 'CRITICAL', label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' }
  ]

  useEffect(() => {
    // Pre-fill current page URL
    setFormData(prev => ({
      ...prev,
      pageUrl: window.location.href
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Prepare form data for submission
      const submitData = new FormData()
      
      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitData.append(key, value.toString())
        }
      })

      // Add screenshots
      screenshots.forEach((file, index) => {
        submitData.append(`screenshot_${index}`, file)
      })

      const response = await fetch('/api/report', {
        method: 'POST',
        body: submitData
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setFormData({
          reporterName: '',
          reporterEmail: '',
          type: 'BUG',
          severity: 'MEDIUM',
          title: '',
          description: '',
          pageUrl: window.location.href,
          carId: '',
          dealerId: '',
          stepsToReproduce: '',
          errorDetails: '',
          anonymous: false
        })
        setScreenshots([])
      } else {
        setError(data.message || 'Failed to submit report. Please try again.')
      }
    } catch (error) {
      setError('Failed to submit report. Please try again.')
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

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + screenshots.length > 5) {
      setError('Maximum 5 screenshots allowed')
      return
    }
    setScreenshots(prev => [...prev, ...files])
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index))
  }

  const selectedIssueType = issueTypes.find(type => type.value === formData.type)
  const selectedSeverity = severityLevels.find(level => level.value === formData.severity)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="about" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Report an Issue
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us maintain a safe and reliable platform by reporting bugs, scams, or inappropriate content.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Report submitted successfully!</p>
                <p className="text-green-600 text-sm">We'll investigate this issue and take appropriate action.</p>
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
                <span className="text-blue-800 font-medium">Submit report anonymously</span>
              </label>
              <p className="text-blue-600 text-sm mt-1">
                Your name and email will not be stored if you choose anonymous reporting
              </p>
            </div>

            {/* Contact Information (hidden if anonymous) */}
            {!formData.anonymous && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="reporterName" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="reporterName"
                    name="reporterName"
                    value={formData.reporterName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your name (optional)"
                  />
                </div>

                <div>
                  <label htmlFor="reporterEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="reporterEmail"
                    name="reporterEmail"
                    value={formData.reporterEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your@email.com (optional)"
                  />
                </div>
              </div>
            )}

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What type of issue are you reporting? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {issueTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <label
                      key={type.value}
                      className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.type === type.value
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleChange}
                        className="mt-1 text-red-600 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How severe is this issue? *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {severityLevels.map((level) => (
                  <label
                    key={level.value}
                    className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.severity === level.value
                        ? level.bgColor
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={level.value}
                      checked={formData.severity === level.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className={`font-medium ${formData.severity === level.value ? level.color : 'text-gray-700'}`}>
                      {level.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Issue Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Issue Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Brief summary of the issue"
              />
            </div>

            {/* Context Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="pageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Page URL
                </label>
                <input
                  type="url"
                  id="pageUrl"
                  name="pageUrl"
                  value={formData.pageUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Page where issue occurred"
                />
              </div>

              <div>
                <label htmlFor="carId" className="block text-sm font-medium text-gray-700 mb-1">
                  Car ID (if applicable)
                </label>
                <input
                  type="text"
                  id="carId"
                  name="carId"
                  value={formData.carId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., clxxx123456"
                />
              </div>

              <div>
                <label htmlFor="dealerId" className="block text-sm font-medium text-gray-700 mb-1">
                  Dealer ID (if applicable)
                </label>
                <input
                  type="text"
                  id="dealerId"
                  name="dealerId"
                  value={formData.dealerId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., dealer123"
                />
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Issue Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Please provide detailed information about the issue..."
              />
            </div>

            {/* Steps to Reproduce (for bugs) */}
            {formData.type === 'BUG' && (
              <div>
                <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-700 mb-1">
                  Steps to Reproduce
                </label>
                <textarea
                  id="stepsToReproduce"
                  name="stepsToReproduce"
                  value={formData.stepsToReproduce}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="1. Go to page X&#10;2. Click on button Y&#10;3. See error message"
                />
              </div>
            )}

            {/* Error Details (for bugs) */}
            {formData.type === 'BUG' && (
              <div>
                <label htmlFor="errorDetails" className="block text-sm font-medium text-gray-700 mb-1">
                  Error Details
                </label>
                <textarea
                  id="errorDetails"
                  name="errorDetails"
                  value={formData.errorDetails}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Any error messages, console errors, or technical details..."
                />
              </div>
            )}

            {/* Screenshot Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Screenshots (optional)
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> screenshots
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each (max 5 files)</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {screenshots.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {screenshots.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Report</span>
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