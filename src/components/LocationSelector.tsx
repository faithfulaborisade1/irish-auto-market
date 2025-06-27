// src/components/LocationSelector.tsx
'use client';

import React, { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { IRISH_LOCATIONS } from '@/data/irish-locations';

interface LocationSelectorProps {
  selectedCounty: string;
  selectedArea: string;
  onCountyChange: (county: string) => void;
  onAreaChange: (area: string) => void;
  required?: boolean;
  className?: string;
}

export default function LocationSelector({
  selectedCounty,
  selectedArea,
  onCountyChange,
  onAreaChange,
  required = false,
  className = ""
}: LocationSelectorProps) {
  // Get available areas for selected county
  const availableAreas = selectedCounty ? IRISH_LOCATIONS[selectedCounty as keyof typeof IRISH_LOCATIONS] || [] : [];

  const handleCountyChange = (county: string) => {
    onCountyChange(county);
    // Reset area when county changes
    onAreaChange('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* County Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          County {required && '*'}
        </label>
        <div className="relative">
          <select
            value={selectedCounty}
            onChange={(e) => handleCountyChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            required={required}
          >
            <option value="">Select County</option>
            {Object.keys(IRISH_LOCATIONS).sort().map(county => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Area Selector - Only show if county is selected */}
      {selectedCounty && availableAreas.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Area / Town (Optional)
          </label>
          <div className="relative">
            <select
              value={selectedArea}
              onChange={(e) => onAreaChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            >
              <option value="">All {selectedCounty}</option>
              {availableAreas.map(area => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {availableAreas.length} areas available in {selectedCounty}
          </p>
        </div>
      )}

      {/* Selected Location Display */}
      {selectedCounty && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">
            <strong>Selected Location:</strong> {selectedArea ? `${selectedArea}, ` : ''}{selectedCounty}
          </p>
        </div>
      )}
    </div>
  );
}

// Alternative simplified version for forms
export function SimpleLocationSelector({
  value,
  onChange,
  required = false,
  className = ""
}: {
  value: string;
  onChange: (county: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <MapPin className="inline w-4 h-4 mr-1" />
        County {required && '*'}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
          required={required}
        >
          <option value="">Select County</option>
          {Object.keys(IRISH_LOCATIONS).sort().map(county => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}