'use client'

export default function PromotionalRibbon() {
  return (
    <>
      {/* Mobile Version - Top Banner */}
      <div className="block md:hidden absolute top-4 left-4 right-4 z-40 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-4 rounded-lg shadow-xl">
        <div className="flex items-center justify-center gap-2 text-sm font-bold">
          <span className="text-yellow-300">🎉</span>
          <span>FREE LISTINGS until Jan 15th!</span>
          <span className="text-yellow-300">🎉</span>
        </div>
      </div>

      {/* Desktop Version - Clean Badge */}
      <div className="hidden md:block absolute top-2 left-4 z-40">
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg border border-white/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 text-emerald-800 px-1.5 py-0.5 rounded-full text-xs font-bold">
              LIMITED TIME
            </div>
            <div className="text-sm font-bold">
              🎉 FREE LISTINGS until Jan 15th!
            </div>
          </div>
          <div className="text-emerald-100 text-xs mt-0.5 text-center">
            No fees • No hidden costs • Start selling today
          </div>
        </div>
      </div>

      {/* Tablet Version - Compact Badge */}
      <div className="hidden sm:block md:hidden absolute top-16 right-4 z-40">
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="text-sm font-bold text-center">
            🎉 FREE until Jan 15th!
          </div>
        </div>
      </div>
    </>
  )
}