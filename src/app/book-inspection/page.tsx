'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Calendar, Clock, MapPin, CheckCircle, ArrowLeft, Phone, Mail, Car, MessageCircle, AlertCircle } from 'lucide-react'
import { getAllCarMakes, getModelsForMake } from '@/data/car-makes-models'
import { IRISH_LOCATIONS } from '@/data/irish-locations'

export default function BookInspectionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    // Contact Information
    fullName: '',
    email: '',
    phone: '',
    preferredContact: 'phone', // phone, email, whatsapp
    
    // Car Information
    carMake: '',
    carModel: '',
    carYear: '',
    carPrice: '',
    sellerName: '',
    sellerPhone: '',
    
    // Location Information
    inspectionAddress: '',
    inspectionCounty: '',
    inspectionArea: '',
    addressOptional: true, // Privacy option
    
    // Scheduling
    preferredDate: '',
    preferredTime: 'morning', // morning, afternoon, evening, flexible
    urgency: 'within-week', // asap, within-3-days, within-week, flexible
    
    // Additional Information
    specificConcerns: '',
    additionalInfo: '',
    
    // Agreement
    agreedToTerms: false,
    agreedToPrice: false
  })

  // NOW the computed values come after formData is declared
  const availableModels = useMemo(() => {
    return formData.carMake ? getModelsForMake(formData.carMake) : []
  }, [formData.carMake])
  
  const availableAreas = useMemo(() => {
    return formData.inspectionCounty ? IRISH_LOCATIONS[formData.inspectionCounty as keyof typeof IRISH_LOCATIONS] || [] : []
  }, [formData.inspectionCounty])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Reset model when make changes
  const handleMakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMake = e.target.value
    setFormData(prev => ({
      ...prev,
      carMake: newMake,
      carModel: '' // Reset model when make changes
    }))
  }

  // Reset area when county changes
  const handleCountyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCounty = e.target.value
    setFormData(prev => ({
      ...prev,
      inspectionCounty: newCounty,
      inspectionArea: '' // Reset area when county changes
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/book-inspection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        alert('There was an error submitting your booking. Please try calling us directly.')
      }
    } catch (error) {
      console.error('Booking submission error:', error)
      alert('There was an error submitting your booking. Please try calling us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Request Received!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for your inspection request. We'll contact you within 2 hours to confirm 
              your appointment details and answer any questions.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Back to Homepage
              </button>
              <p className="text-sm text-gray-500">
                Questions? Call us at <span className="font-bold text-green-600">087 170 8603</span>
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🚗 Book Your Car Inspection
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete the form below and we'll contact you within 2 hours to confirm your appointment. 
            Our certified mechanics will inspect your potential purchase at any location in Ireland.
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Quick Response</div>
                <div className="text-sm text-gray-600">Contact within 2 hours</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-orange-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Any Location</div>
                <div className="text-sm text-gray-600">We come to you</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Fixed Price</div>
                <div className="text-sm text-gray-600">€99 per inspection</div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Contact Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="085 123 4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  name="preferredContact"
                  value={formData.preferredContact}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="phone">Phone Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
          </div>

          {/* Car Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Car className="w-5 h-5 mr-2" />
              Car Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Car Make *
                </label>
                <select
                  name="carMake"
                  required
                  value={formData.carMake}
                  onChange={handleMakeChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select car make</option>
                  {getAllCarMakes().map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Car Model *
                </label>
                <select
                  name="carModel"
                  required
                  value={formData.carModel}
                  onChange={handleInputChange}
                  disabled={!formData.carMake}
                  className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    !formData.carMake ? 'bg-gray-50 cursor-not-allowed text-gray-400' : ''
                  }`}
                >
                  <option value="">
                    {formData.carMake ? 'Select car model' : 'Select make first'}
                  </option>
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                {!formData.carMake && (
                  <p className="text-xs text-gray-500 mt-1">Please select a car make first</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  name="carYear"
                  min="1990"
                  max="2025"
                  value={formData.carYear}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="2020"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asking Price
                </label>
                <input
                  type="text"
                  name="carPrice"
                  value={formData.carPrice}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="€25,000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seller Name (if known)
                </label>
                <input
                  type="text"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="John Smith / ABC Motors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seller Phone (if available)
                </label>
                <input
                  type="tel"
                  name="sellerPhone"
                  value={formData.sellerPhone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="01 234 5678"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Inspection Location
            </h2>
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Privacy Options:</p>
                  <p>You can provide just the county/area if you prefer to discuss the exact address during our call.</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County *
                </label>
                <select
                  name="inspectionCounty"
                  required
                  value={formData.inspectionCounty}
                  onChange={handleCountyChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select county</option>
                  {Object.keys(IRISH_LOCATIONS).sort().map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area (Optional)
                </label>
                <select
                  name="inspectionArea"
                  value={formData.inspectionArea}
                  onChange={handleInputChange}
                  disabled={!formData.inspectionCounty}
                  className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    !formData.inspectionCounty ? 'bg-gray-50 cursor-not-allowed text-gray-400' : ''
                  }`}
                >
                  <option value="">
                    {formData.inspectionCounty ? 'Select area (optional)' : 'Select county first'}
                  </option>
                  {availableAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                {!formData.inspectionCounty && (
                  <p className="text-xs text-gray-500 mt-1">Please select a county first</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address (Optional)
                </label>
                <input
                  type="text"
                  name="inspectionAddress"
                  value={formData.inspectionAddress}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="123 Main Street, Cityname - or leave blank for privacy"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can provide the exact address now or discuss it during our call
                </p>
              </div>
            </div>
          </div>

          {/* Scheduling Preferences */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Scheduling Preferences
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Date
                </label>
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time
                </label>
                <select
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="morning">Morning (9AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 5PM)</option>
                  <option value="evening">Evening (5PM - 7PM)</option>
                  <option value="flexible">Flexible - Any time</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How urgent is this inspection?
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="asap">ASAP - I'm viewing the car today/tomorrow</option>
                  <option value="within-3-days">Within 3 days</option>
                  <option value="within-week">Within a week</option>
                  <option value="flexible">Flexible timing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Additional Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any specific concerns about the car?
                </label>
                <textarea
                  name="specificConcerns"
                  value={formData.specificConcerns}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g. Strange noise when braking, previous accident damage, high mileage concerns..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional information or special requests
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Any other details that might help us prepare for the inspection..."
                />
              </div>
            </div>
          </div>

          {/* Agreement Checkboxes */}
          <div className="mb-8 space-y-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                name="agreedToPrice"
                checked={formData.agreedToPrice}
                onChange={handleInputChange}
                required
                className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-3 text-sm text-gray-700">
                <span className="font-medium">I understand the inspection fee is €99</span>, payable on completion of the inspection.
              </label>
            </div>
            
            <div className="flex items-start">
              <input
                type="checkbox"
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleInputChange}
                required
                className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-3 text-sm text-gray-700">
                I agree to the <span className="text-green-600 font-medium">terms and conditions</span> and understand that this inspection is for informational purposes and does not guarantee the condition of the vehicle.
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting || !formData.agreedToTerms || !formData.agreedToPrice}
              className={`w-full max-w-md mx-auto px-8 py-4 rounded-lg font-bold text-lg transition-colors ${
                isSubmitting || !formData.agreedToTerms || !formData.agreedToPrice
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white flex items-center justify-center`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting Request...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit Inspection Request
                </>
              )}
            </button>
            
            <p className="mt-4 text-sm text-gray-600">
              We'll contact you within 2 hours to confirm your appointment
            </p>
          </div>
        </form>
      </div>
      
      <Footer />
    </div>
  )
}