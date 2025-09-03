// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import BuyerProfile from '@/components/profile/BuyerProfile';
import SellerProfile from '@/components/profile/SellerProfile';
import DealerProfile from '@/components/profile/DealerProfile';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'DEALER' | 'ADMIN' | 'SUPER_ADMIN';
  avatar?: string;
  _count?: {
    cars: number;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setError('Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error || 'Please log in to view your profile.'}</p>
          <a 
            href="/login" 
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Login
          </a>
        </div>
      </div>
    );
  }

  // Determine user type and render appropriate profile
  const getUserType = () => {
    if (user.role === 'DEALER') return 'dealer';
    if ((user._count?.cars || 0) > 0) return 'seller';
    return 'buyer';
  };

  const userType = getUserType();

  // Render the appropriate profile component
  switch (userType) {
    case 'dealer':
      return <DealerProfile user={user} />;
    case 'seller':
      return <SellerProfile user={user} />;
    case 'buyer':
    default:
      return <BuyerProfile user={user} />;
  }
}