// src/components/CarSelector.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Car, Search, ChevronDown } from 'lucide-react';
import { CAR_MAKES_MODELS, getAllCarMakes, getModelsForMake } from '@/data/car-makes-models';

interface CarSelectorProps {
  selectedMake: string;
  selectedModel: string;
  onMakeChange: (make: string) => void;
  onModelChange: (model: string) => void;
  required?: boolean;
  className?: string;
  showSearch?: boolean;
}

export default function CarSelector({
  selectedMake,
  selectedModel,
  onMakeChange,
  onModelChange,
  required = false,
  className = "",
  showSearch = true
}: CarSelectorProps) {
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  // Get all makes and filter based on search
  const allMakes = getAllCarMakes();
  const filteredMakes = useMemo(() => {
    if (!makeSearch) return allMakes;
    return allMakes.filter(make => 
      make.toLowerCase().includes(makeSearch.toLowerCase())
    );
  }, [allMakes, makeSearch]);

  // Get models for selected make and filter based on search
  const availableModels = selectedMake ? getModelsForMake(selectedMake) : [];
  const filteredModels = useMemo(() => {
    if (!modelSearch) return availableModels;
    return availableModels.filter(model => 
      model.toLowerCase().includes(modelSearch.toLowerCase())
    );
  }, [availableModels, modelSearch]);

  const handleMakeChange = (make: string) => {
    onMakeChange(make);
    // Reset model when make changes
    onModelChange('');
    setModelSearch('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Make Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Car className="inline w-4 h-4 mr-1" />
          Make {required && '*'}
        </label>
        
        {showSearch && (
          <div className="relative mb-2">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search makes..."
              value={makeSearch}
              onChange={(e) => setMakeSearch(e.target.value)}
              className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        )}
        
        <div className="relative">
          <select
            value={selectedMake}
            onChange={(e) => handleMakeChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            required={required}
          >
            <option value="">Select Make</option>
            {filteredMakes.map(make => (
              <option key={make} value={make}>
                {make} ({getModelsForMake(make).length} models)
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        
        {makeSearch && filteredMakes.length === 0 && (
          <p className="text-sm text-red-600 mt-1">No makes found matching "{makeSearch}"</p>
        )}
      </div>

      {/* Model Selector - Only show if make is selected */}
      {selectedMake && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model {required && '*'}
          </label>
          
          {showSearch && availableModels.length > 10 && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${selectedMake} models...`}
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          )}
          
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
              disabled={!selectedMake}
              required={required}
            >
              <option value="">Select Model</option>
              {filteredModels.map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            {modelSearch ? 
              `${filteredModels.length} of ${availableModels.length} models shown` :
              `${availableModels.length} models available for ${selectedMake}`
            }
          </p>
          
          {modelSearch && filteredModels.length === 0 && (
            <p className="text-sm text-red-600 mt-1">No {selectedMake} models found matching "{modelSearch}"</p>
          )}
        </div>
      )}

      {/* Selected Car Display */}
      {selectedMake && selectedModel && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Selected Car:</strong> {selectedMake} {selectedModel}
          </p>
        </div>
      )}

      {/* Popular Makes Quick Select */}
      {!selectedMake && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Popular Makes:</p>
          <div className="flex flex-wrap gap-2">
            {['Audi', 'BMW', 'Mercedes-Benz', 'Toyota', 'Ford', 'Volkswagen', 'Nissan', 'Honda'].map(make => (
              <button
                key={make}
                type="button"
                onClick={() => handleMakeChange(make)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {make}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified version for basic forms
export function SimpleCarSelector({
  make,
  model,
  onMakeChange,
  onModelChange,
  required = false,
  className = ""
}: {
  make: string;
  model: string;
  onMakeChange: (make: string) => void;
  onModelChange: (model: string) => void;
  required?: boolean;
  className?: string;
}) {
  const availableModels = make ? getModelsForMake(make) : [];

  const handleMakeChange = (newMake: string) => {
    onMakeChange(newMake);
    onModelChange(''); // Reset model
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Make */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Make {required && '*'}
        </label>
        <div className="relative">
          <select
            value={make}
            onChange={(e) => handleMakeChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            required={required}
          >
            <option value="">Select Make</option>
            {getAllCarMakes().map(carMake => (
              <option key={carMake} value={carMake}>
                {carMake}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model {required && '*'}
        </label>
        <div className="relative">
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            disabled={!make}
            required={required}
          >
            <option value="">Select Model</option>
            {availableModels.map(carModel => (
              <option key={carModel} value={carModel}>
                {carModel}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}