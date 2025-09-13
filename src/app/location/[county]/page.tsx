'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Car, MapPin, Filter, Grid, List, Search } from 'lucide-react';
import Link from 'next/link';
import CarCard from '@/components/CarCard';
import CarFilters from '@/components/CarFilters';
import type { Car as CarType } from '@/types/car';

// Irish counties for validation and SEO
const IRISH_COUNTIES = [
  'dublin', 'cork', 'galway', 'mayo', 'donegal', 'kerry', 'tipperary', 'clare',
  'tyrone', 'antrim', 'limerick', 'roscommon', 'down', 'wexford', 'meath',
  'londonderry', 'kilkenny', 'wicklow', 'offaly', 'cavan', 'waterford',
  'westmeath', 'sligo', 'laois', 'kildare', 'fermanagh', 'leitrim', 'armagh',
  'monaghan', 'longford', 'carlow', 'louth'
];

interface LocationPageData {
  cars: CarType[];
  totalCount: number;
  county: string;
  countyFormatted: string;
  popularMakes: Array<{ make: string; count: number }>;
  priceRange: { min: number; max: number; average: number };
  nearbyCounties: string[];
}

export default function CountyCarListings() {
  const params = useParams();
  const [data, setData] = useState<LocationPageData | null>(null);
  const [filteredCars, setFilteredCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const county = params.county as string;
  const countyLower = county?.toLowerCase();

  useEffect(() => {
    if (!county || !IRISH_COUNTIES.includes(countyLower)) {
      setLoading(false);
      return;
    }

    const fetchLocationData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/location/${countyLower}`);
        if (response.ok) {
          const locationData = await response.json();
          setData(locationData);
          setFilteredCars(locationData.cars);
        }
      } catch (error) {
        console.error('Error fetching location data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
  }, [county, countyLower]);

  const handleFiltersApply = (filters: any) => {
    if (!data) return;

    let filtered = data.cars;

    // Apply filters (similar to your existing CarFilters component)
    if (filters.make && filters.make !== 'All Makes') {
      filtered = filtered.filter(car => car.make === filters.make);
    }
    if (filters.priceMin) {
      filtered = filtered.filter(car => Number(car.price) >= filters.priceMin);
    }
    if (filters.priceMax) {
      filtered = filtered.filter(car => Number(car.price) <= filters.priceMax);
    }
    if (filters.yearMin) {
      filtered = filtered.filter(car => car.year >= filters.yearMin);
    }
    if (filters.yearMax) {
      filtered = filtered.filter(car => car.year <= filters.yearMax);
    }
    if (filters.fuelType && filters.fuelType !== 'All') {
      filtered = filtered.filter(car => car.fuelType === filters.fuelType);
    }
    if (filters.transmission && filters.transmission !== 'All') {
      filtered = filtered.filter(car => car.transmission === filters.transmission);
    }

    setFilteredCars(filtered);
    setShowFilters(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cars in {data?.countyFormatted || county}...</p>
        </div>
      </div>
    );
  }

  // Invalid county
  if (!data || !IRISH_COUNTIES.includes(countyLower)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">County Not Found</h1>
          <p className="text-gray-600 mb-6">We don't have listings for this location.</p>
          <Link
            href="/cars"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse All Cars
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Cars for Sale in {data.countyFormatted}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Find your perfect car from {data.totalCount.toLocaleString()} available listings in {data.countyFormatted}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{data.totalCount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Cars Available</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">€{data.priceRange.average.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Average Price</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{data.popularMakes.length}</div>
                <div className="text-sm text-gray-600">Car Brands</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Makes Section */}
      {data.popularMakes.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Popular Car Brands in {data.countyFormatted}
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.popularMakes.slice(0, 8).map((make) => (
                <Link
                  key={make.make}
                  href={`/location/${countyLower}/${make.make.toLowerCase()}`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors"
                >
                  {make.make} ({make.count})
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>

              <span className="text-sm text-gray-600">
                {filteredCars.length.toLocaleString()} car{filteredCars.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <CarFilters
                onFiltersChange={handleFiltersApply}
                isOpen={showFilters}
                onToggle={() => setShowFilters(!showFilters)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Cars Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCars.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or browse all cars</p>
            <div className="space-x-4">
              <button
                onClick={() => {
                  setFilteredCars(data.cars);
                  setShowFilters(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Clear Filters
              </button>
              <Link
                href="/cars"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Browse All Cars
              </Link>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}>
            {filteredCars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                variant={viewMode === 'list' ? 'list' : 'grid'}
                showPerformance={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* SEO Content Section */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Buy Cars in {data.countyFormatted}, Ireland
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Looking for a quality used car in {data.countyFormatted}? Irish Auto Market offers
              {data.totalCount > 0 ? ` ${data.totalCount.toLocaleString()} cars` : ' a wide selection of cars'}
              for sale from trusted dealers and private sellers across {data.countyFormatted}.
              Whether you're looking for a reliable family car, an efficient city runabout, or a luxury vehicle,
              you'll find the perfect match in our extensive listings.
            </p>

            {data.popularMakes.length > 0 && (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Popular Car Brands in {data.countyFormatted}
                </h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  The most sought-after car brands in {data.countyFormatted} include {' '}
                  {data.popularMakes.slice(0, 5).map(make => make.make).join(', ')}
                  {data.popularMakes.length > 5 && ', and more'}. Each brand offers unique advantages,
                  from fuel efficiency to luxury features, ensuring there's something for every budget and preference.
                </p>
              </>
            )}

            {data.nearbyCounties.length > 0 && (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Nearby Areas
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Can't find what you're looking for in {data.countyFormatted}?
                  Expand your search to nearby counties:
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {data.nearbyCounties.map((nearbyCounty) => (
                    <Link
                      key={nearbyCounty}
                      href={`/location/${nearbyCounty.toLowerCase()}`}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors text-sm"
                    >
                      {nearbyCounty}
                    </Link>
                  ))}
                </div>
              </>
            )}

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                Why Choose Irish Auto Market?
              </h3>
              <ul className="list-disc list-inside text-green-700 space-y-1">
                <li>Verified dealer and private seller listings</li>
                <li>Comprehensive vehicle histories and inspections</li>
                <li>Competitive pricing across all budgets</li>
                <li>Easy financing options available</li>
                <li>Local expertise in the Irish car market</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}