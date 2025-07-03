// src/components/admin/AdminUserForm.tsx - Complete CSRF Integration
'use client';

import { useState } from 'react';
import { useCSRFToken } from '@/hooks/useCSRFToken';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'DEALER' | 'ADMIN';
  isActive: boolean;
}

interface AdminUserFormProps {
  userId?: string;
  initialData?: Partial<UserFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdminUserForm({ 
  userId, 
  initialData, 
  onSuccess, 
  onCancel 
}: AdminUserFormProps) {
  const { makeSecureRequest, loading: csrfLoading, error: csrfError } = useCSRFToken();
  const [formData, setFormData] = useState<UserFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    role: initialData?.role || 'USER',
    isActive: initialData?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (csrfLoading) {
      setError('Security token is loading. Please wait.');
      return;
    }

    if (csrfError) {
      setError(`Security error: ${csrfError}`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const url = userId 
        ? `/api/admin/users/${userId}`
        : '/api/admin/users';
      
      const method = userId ? 'PUT' : 'POST';

      const response = await makeSecureRequest(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `${method} failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ User ${userId ? 'updated' : 'created'} successfully:`, result);
      
      setSuccess(true);
      
      // Call success callback after a brief delay to show success message
      setTimeout(() => {
        onSuccess?.();
      }, 1500);

    } catch (submitError: any) {
      console.error('Form submission error:', submitError);
      setError(submitError.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {userId ? 'Edit User' : 'Create New User'}
      </h2>

      {/* CSRF Loading State */}
      {csrfLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-600 text-sm">🔒 Loading security token...</p>
        </div>
      )}

      {/* CSRF Error */}
      {csrfError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">🚨 Security Error: {csrfError}</p>
        </div>
      )}

      {/* Form Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">
            ✅ User {userId ? 'updated' : 'created'} successfully!
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading || csrfLoading}
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading || csrfLoading}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading || csrfLoading}
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading || csrfLoading}
          >
            <option value="USER">User</option>
            <option value="DEALER">Dealer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Active Status */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
              disabled={loading || csrfLoading}
            />
            <span className="ml-2 text-sm text-gray-700">Active User</span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading || csrfLoading || !!csrfError}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {userId ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              userId ? 'Update User' : 'Create User'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Security Info */}
      <div className="mt-4 p-2 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-500">
          🔒 This form is protected by CSRF tokens and requires admin authentication.
        </p>
      </div>

      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-700 font-mono">
            DEBUG: CSRF Loading: {csrfLoading ? 'true' : 'false'} | 
            Error: {csrfError || 'none'} | 
            Form Loading: {loading ? 'true' : 'false'}
          </p>
        </div>
      )}
    </div>
  );
}

// Usage Example Component
export function AdminUserFormExample() {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingUser(null);
    // Refresh user list here
    console.log('✅ User operation completed successfully');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  if (showForm) {
    return (
      <AdminUserForm
        userId={editingUser?.id}
        initialData={editingUser}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      <div className="space-y-4">
        <button
          onClick={handleCreateUser}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Create New User
        </button>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Example Users:</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 border rounded">
              <span>John Doe (john@example.com)</span>
              <button
                onClick={() => handleEditUser({
                  id: 'user1',
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john@example.com',
                  role: 'USER',
                  isActive: true
                })}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
            <div className="flex justify-between items-center p-2 border rounded">
              <span>Jane Smith (jane@example.com)</span>
              <button
                onClick={() => handleEditUser({
                  id: 'user2',
                  firstName: 'Jane',
                  lastName: 'Smith',
                  email: 'jane@example.com',
                  role: 'DEALER',
                  isActive: true
                })}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}