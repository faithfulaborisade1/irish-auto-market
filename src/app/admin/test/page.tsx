// src/app/admin/test/page.tsx - DIRECT TEST PAGE
'use client';

import { useState, useEffect } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminTestPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🧪 TEST: Checking admin auth directly...');
      
      const response = await fetch('/api/admin/auth/me', {
        method: 'GET',
        credentials: 'include'
      });

      console.log('🧪 TEST: Response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('🧪 TEST: User data received:', userData);
        setUser(userData);
        setError(null);
      } else {
        const errorData = await response.json();
        console.log('🧪 TEST: Auth failed:', errorData);
        setError(errorData.error || 'Auth failed');
      }
    } catch (err) {
      console.error('🧪 TEST: Error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">🧪 Admin Auth Test</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Admin Auth Test</h1>
      
      {error ? (
        <div className="bg-red-900 border border-red-500 p-4 rounded mb-4">
          <h2 className="font-bold">❌ Authentication Failed</h2>
          <p>{error}</p>
        </div>
      ) : user ? (
        <div className="bg-green-900 border border-green-500 p-4 rounded mb-4">
          <h2 className="font-bold">✅ Authentication Successful!</h2>
          <div className="mt-2 space-y-1">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>ID:</strong> {user.id}</p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-900 border border-yellow-500 p-4 rounded mb-4">
          <h2 className="font-bold">⚠️ No User Data</h2>
          <p>Response was OK but no user data received</p>
        </div>
      )}

      <div className="bg-gray-800 p-4 rounded">
        <h3 className="font-bold mb-2">🔧 Debug Actions:</h3>
        <div className="space-y-2">
          <button 
            onClick={checkAuth}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mr-2"
          >
            Re-check Auth
          </button>
          <a 
            href="/admin" 
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mr-2 inline-block"
          >
            Go to Admin Dashboard
          </a>
          <a 
            href="/admin/login" 
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded inline-block"
          >
            Go to Login
          </a>
        </div>
      </div>

      <div className="mt-8 bg-gray-800 p-4 rounded">
        <h3 className="font-bold mb-2">📊 Current State:</h3>
        <pre className="text-sm bg-gray-900 p-2 rounded overflow-auto">
{JSON.stringify({
  loading,
  error,
  user,
  timestamp: new Date().toISOString()
}, null, 2)}
        </pre>
      </div>
    </div>
  );
}