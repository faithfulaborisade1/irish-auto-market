'use client'

import { Euro } from 'lucide-react'

interface LoanittFinanceButtonProps {
  // Optional car details to pre-fill the form
  car?: {
    make?: string
    model?: string
    year?: number
    price?: number
    mileage?: number
  }
  // Optional dealer details
  dealer?: {
    id: string
    name: string
  }
  // Button styling options
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullWidth?: boolean
}

export default function LoanittFinanceButton({
  car,
  dealer,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false
}: LoanittFinanceButtonProps) {

  const buildLoanittUrl = () => {
    const baseUrl = 'https://my.loanitt.com/init/motor'
    const params = new URLSearchParams()

    // Required parameters
    params.set('utm_source', 'irishautomarket')

    // Dealer ID (with IAM prefix as required)
    if (dealer?.id) {
      params.set('dealerId', `IAM${dealer.id}`)
    }

    // Dealer name
    if (dealer?.name) {
      params.set('dealerName', dealer.name)
    }

    // Optional car details
    if (car) {
      if (car.make) params.set('make', car.make)
      if (car.model) params.set('model', car.model)
      if (car.year) params.set('pYear', car.year.toString())
      if (car.price) params.set('pAmount', Math.round(car.price).toString())
      if (car.mileage) params.set('mileage', car.mileage.toString())
    }

    return `${baseUrl}?${params.toString()}`
  }

  const handleClick = async () => {
    // Track the click (non-blocking)
    try {
      fetch('/api/analytics/finance-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car && car.make && car.model ? String(car.make + car.model + car.year) : undefined,
          carMake: car?.make,
          carModel: car?.model,
          carYear: car?.year,
          carPrice: car?.price,
          dealerId: dealer?.id,
          dealerName: dealer?.name,
          sourceUrl: window.location.href
        })
      }).catch(err => console.log('Click tracking failed:', err));
    } catch (err) {
      // Silently fail - don't block the user
    }

    // Open finance application (this happens immediately)
    const url = buildLoanittUrl()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  }

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <button
      onClick={handleClick}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-lg font-medium transition-colors
        flex items-center justify-center
        shadow-sm hover:shadow-md
        ${className}
      `}
    >
      <Euro className={`${iconSizes[size]} mr-2`} />
      Apply for Finance
    </button>
  )
}
