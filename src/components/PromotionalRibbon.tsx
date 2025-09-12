'use client'

import Image from 'next/image'

export default function PromotionalRibbon() {
  return (
    <div className="absolute top-20 left-8 z-50 transform rotate-[-25deg] w-[400px] h-16">
      {/* Ribbon image background */}
      <div className="relative w-full h-full">
        <Image
          src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=80&fit=crop"
          alt="Decorative ribbon banner"
          fill
          className="object-cover shadow-2xl"
          style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/80 via-red-500/70 to-red-600/80" 
             style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}></div>
        
        {/* Text content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white font-bold text-base text-center drop-shadow-lg px-4">
            🎉 FREE LISTINGS until January 15th!
          </div>
        </div>
      </div>
      
      {/* Drop shadow */}
      <div className="absolute top-1 left-1 w-full h-full bg-black/20 -z-10 blur-sm transform rotate-1"
           style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}></div>
    </div>
  )
}