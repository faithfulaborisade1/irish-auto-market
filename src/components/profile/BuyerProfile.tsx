// src/components/profile/BuyerProfile.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Heart, 
  Search, 
  MessageCircle, 
  Settings, 
  User, 
  ArrowLeft,
  Car,
  Eye,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Plus,
  Camera,
  Upload,
  X,
  Bell
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface BuyerProfileProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  };
}

interface FavoriteCar {
  id: string;
  car: {
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    images: { thumbnailUrl: string }[];
    location?: { county: string; area: string };
  };
  createdAt: string;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: any;
  alertsEnabled: boolean;
  matchCount: number;
  createdAt: string;
}

export default function BuyerProfile({ user: initialUser }: BuyerProfileProps) {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<'favorites' | 'searches' | 'messages' | 'settings'>('favorites');
  const [favorites, setFavorites] = useState<FavoriteCar[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  useEffect(() => {
    fetchFavorites();
    fetchSavedSearches();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/profile/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch('/api/profile/saved-searches');
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.searches || []);
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    }
  };

  const handleAvatarUpload = async (uploadedImages: any[]) => {
    if (uploadedImages.length > 0) {
      const avatarUrl = uploadedImages[0].url;
      
      try {
        const response = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl })
        });

        if (response.ok) {
          setUser({ ...user, avatar: avatarUrl });
          setShowImageUpload(false);
        }
      } catch (error) {
        console.error('Error updating avatar:', error);
      }
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch(`/api/profile/favorites/${favoriteId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setFavorites(favorites.filter(f => f.id !== favoriteId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const toggleSearchAlerts = async (searchId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/profile/saved-searches/${searchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertsEnabled: enabled })
      });
      
      if (response.ok) {
        setSavedSearches(searches => 
          searches.map(s => s.id === searchId ? { ...s, alertsEnabled: enabled } : s)
        );
      }
    } catch (error) {
      console.error('Error updating search alerts:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Back to Home */}
          <div className="mb-6">
            <a 
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Car Search</span>
            </a>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              {/* Profile Photo */}
              <div className="relative">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-green-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center ring-4 ring-green-100">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
                <button
                  onClick={() => setShowImageUpload(true)}
                  className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Car Buyer
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{favorites.length} favorites</span>
                  </div>
                </div>
              </div>
            </div>

            <a 
              href="/profile/edit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </a>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'favorites', label: 'Favorites', icon: Heart, count: favorites.length },
              { id: 'searches', label: 'Saved Searches', icon: Search, count: savedSearches.length },
              { id: 'messages', label: 'Messages', icon: MessageCircle },
              { id: 'settings', label: 'Account', icon: Settings }
            ].map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
                  activeTab === id 
                    ? 'border-green-600 text-green-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
                {count !== undefined && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'favorites' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Favorite Cars</h2>
              <a 
                href="/"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Find More Cars</span>
              </a>
            </div>

            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => (
                  <div key={favorite.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-200 relative">
                      {favorite.car.images.length > 0 ? (
                        <img 
                          src={favorite.car.images[0].thumbnailUrl} 
                          alt={favorite.car.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => removeFavorite(favorite.id)}
                        className="absolute top-3 right-3 bg-white/90 rounded-full p-2 hover:bg-white transition-colors"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {favorite.car.year} {favorite.car.make} {favorite.car.model}
                      </h3>
                      <p className="text-xl font-bold text-green-600 mb-2">
                        €{favorite.car.price.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{favorite.car.location?.county || 'Ireland'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(favorite.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <a
                          href={`/cars/${favorite.car.id}`}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium text-center hover:bg-green-700 transition-colors"
                        >
                          View Details
                        </a>
                        <a
                          href={`/messages?car=${favorite.car.id}`}
                          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Message
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-600 mb-6">Start browsing cars and save the ones you love!</p>
                <a 
                  href="/"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Browse Cars</span>
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'searches' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Saved Searches</h2>
              <a 
                href="/?save_search=1"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Search</span>
              </a>
            </div>

            {savedSearches.length > 0 ? (
              <div className="space-y-4">
                {savedSearches.map((search) => (
                  <div key={search.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{search.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>{search.matchCount} matches found</span>
                          <span>Created {new Date(search.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={search.alertsEnabled}
                              onChange={(e) => toggleSearchAlerts(search.id, e.target.checked)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">Email alerts</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`/?search=${search.id}`}
                          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          View Results
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved searches</h3>
                <p className="text-gray-600 mb-6">Save your car searches to get notifications when new matches are found!</p>
                <a 
                  href="/?save_search=1"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Search</span>
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Messages</h3>
            <p className="text-gray-600 mb-6">
              Manage conversations with car sellers and dealers
            </p>
            <a 
              href="/messages"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Open Messages</span>
            </a>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Personal Information
                </h4>
                <p className="text-gray-600 text-sm mb-3">
                  Update your name, email, phone number, and location preferences.
                </p>
                <a 
                  href="/profile/edit" 
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </a>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Notification Preferences</h4>
                <p className="text-gray-600 text-sm mb-3">
                  Manage email alerts for new cars, price drops, and saved searches.
                </p>
                <button className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                  <Bell className="w-4 h-4 mr-2" />
                  Manage Notifications
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Update Profile Picture</h3>
                <button
                  onClick={() => setShowImageUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <ImageUpload
                onImagesChange={handleAvatarUpload}
                maxImages={1}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}