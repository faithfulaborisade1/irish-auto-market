// src/app/dealers/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Star, MapPin, Phone, Globe, Car, Clock, Filter, Grid, List, 
  ChevronLeft, Heart, MessageCircle, Share2, CheckCircle 
} from 'lucide-react';
import Link from 'next/link';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  imageUrl: string;
  status: 'ACTIVE' | 'SOLD' | 'PENDING';
  featured: boolean;
  views: number;
  inquiries: number;
  likes: number;
  createdAt: string;
  location: string;
}

interface Dealer {
  id: string;
  businessName: string;
  description: string;
  logoUrl?: string;
  websiteUrl?: string;
  phoneNumber: string;
  location: {
    county: string;
    city: string;
    address: string;
  };
  rating: number;
  reviewCount: number;
  carCount: number;
  specialties: string[];
  verified: boolean;
  subscription: string;
  joinedDate: string;
  responseTime: string;
  businessHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  aboutUs: string;
  cars: Car[];
}

export default function DealerDetailPage() {
  const params = useParams();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'sold'>('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedMake, setSelectedMake] = useState('All Makes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDealer = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/dealers/${params.id}`);
        if (response.ok) {
          const dealerData = await response.json();
          setDealer(dealerData);
          setFilteredCars(dealerData.cars);
        } else if (response.status === 404) {
          setDealer(null);
        } else {
          console.error('Failed to fetch dealer');
        }
      } catch (error) {
        console.error('Error fetching dealer:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDealer();
    }
  }, [params.id]);

  useEffect(() => {
    if (!dealer) return;

    let filtered = dealer.cars;

    // Status filter
    if (activeTab === 'active') {
      filtered = filtered.filter(car => car.status === 'ACTIVE');
    } else if (activeTab === 'sold') {
      filtered = filtered.filter(car => car.status === 'SOLD');
    }

    // Make filter
    if (selectedMake !== 'All Makes') {
      filtered = filtered.filter(car => car.make === selectedMake);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'year_desc':
          return b.year - a.year;
        case 'mileage_asc':
          return a.mileage - b.mileage;
        case 'most_viewed':
          return b.views - a.views;
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredCars(filtered);
  }, [dealer, activeTab, selectedMake, sortBy]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-IE').format(mileage);
  };

  const getCurrentDayStatus = () => {
    if (!dealer || !dealer.businessHours) return 'Closed';
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[new Date().getDay()] as keyof typeof dealer.businessHours;
    
    const hours = dealer.businessHours[currentDay];
    if (!hours || hours.open === 'Closed') return 'Closed';
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTime = parseInt(hours.open.split(':')[0]) * 60 + parseInt(hours.open.split(':')[1]);
    const closeTime = parseInt(hours.close.split(':')[0]) * 60 + parseInt(hours.close.split(':')[1]);
    
    if (currentTime >= openTime && currentTime <= closeTime) {
      return `Open until ${hours.close}`;
    } else if (currentTime < openTime) {
      return `Opens at ${hours.open}`;
    } else {
      return 'Closed';
    }
  };

  const CarCard = ({ car }: { car: Car }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative">
        <img src={car.imageUrl} alt={`${car.make} ${car.model}`} className="w-full h-48 object-cover" />
        {car.featured && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
            Featured
          </div>
        )}
        {car.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">SOLD</span>
          </div>
        )}
        <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {car.year} {car.make} {car.model}
          </h3>
          <span className="text-lg font-bold text-green-600">{formatPrice(car.price)}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
          <div>{formatMileage(car.mileage)} km</div>
          <div>{car.fuelType}</div>
          <div>{car.transmission}</div>
          <div>{car.color}</div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{car.views} views</span>
          <span>{car.inquiries} inquiries</span>
          <span>{car.likes} likes</span>
        </div>
        
        <div className="flex space-x-2">
          <Link
            href={`/cars/${car.id}`}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center text-sm"
          >
            View Details
          </Link>
          <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dealer information...</p>
        </div>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dealer not found</h2>
          <p className="text-gray-600 mb-4">The dealer you're looking for doesn't exist.</p>
          <Link href="/find-dealer" className="text-green-600 hover:underline">
            Back to Find Dealers
          </Link>
        </div>
      </div>
    );
  }

  const activeCars = dealer.cars.filter(car => car.status === 'ACTIVE').length;
  const soldCars = dealer.cars.filter(car => car.status === 'SOLD').length;
  const makes = ['All Makes', ...Array.from(new Set(dealer.cars.map(car => car.make)))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/find-dealer" className="flex items-center text-green-600 hover:text-green-700">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Find Dealers
          </Link>
        </div>
      </div>

      {/* Dealer Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start space-x-6">
            {dealer.logoUrl ? (
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={dealer.logoUrl} alt={`${dealer.businessName} logo`} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-2xl">
                  {dealer.businessName.split(' ').map(word => word[0]).join('').slice(0, 2)}
                </span>
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{dealer.businessName}</h1>
                {dealer.verified && (
                  <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified Dealer
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-current text-yellow-400 mr-1" />
                  <span className="font-medium">{dealer.rating}</span>
                  <span className="ml-1">({dealer.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center">
                  <Car className="w-4 h-4 mr-1" />
                  <span>{dealer.carCount} cars in stock</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{getCurrentDayStatus()}</span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{dealer.description}</p>
              
              {dealer.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {dealer.specialties.map((specialty, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                  <span>{dealer.location.address}, {dealer.location.city}, {dealer.location.county}</span>
                </div>
                {dealer.phoneNumber && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-1 text-gray-400" />
                    <span>{dealer.phoneNumber}</span>
                  </div>
                )}
                {dealer.websiteUrl && (
                  <div className="flex items-center text-sm">
                    <Globe className="w-4 h-4 mr-1 text-gray-400" />
                    <a href={dealer.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              {dealer.phoneNumber && (
                <a
                  href={`tel:${dealer.phoneNumber}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2 inline" />
                  Call Dealer
                </a>
              )}
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Cars ({dealer.cars.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available ({activeCars})
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sold'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sold ({soldCars})
            </button>
          </div>
          
          {/* Filters */}
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                {makes.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="year_desc">Year: Newest First</option>
                <option value="mileage_asc">Mileage: Low to High</option>
                <option value="most_viewed">Most Viewed</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredCars.length} car{filteredCars.length !== 1 ? 's' : ''}
              </span>
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
        </div>
      </div>

      {/* Cars Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCars.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters</p>
            <button
              onClick={() => {
                setSelectedMake('All Makes');
                setActiveTab('all');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}