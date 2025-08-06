// src/components/admin/NotificationToast.tsx
'use client';

import React from 'react';
import { X, Car, Users, AlertTriangle, Shield, ExternalLink } from 'lucide-react';
import type { AdminNotification } from '@/lib/admin-notifications';

interface NotificationToastProps {
  notification: AdminNotification;
  onClose: () => void;
  onAction?: (url: string) => void;
}

export default function NotificationToast({ 
  notification, 
  onClose, 
  onAction 
}: NotificationToastProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'NEW_CAR':
        return <Car className="w-5 h-5" />;
      case 'NEW_USER':
      case 'NEW_DEALER':
        return <Users className="w-5 h-5" />;
      case 'URGENT_REPORT':
        return <AlertTriangle className="w-5 h-5" />;
      case 'SYSTEM_ALERT':
        return <Shield className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50 text-red-800';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 text-orange-800';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50 text-blue-800';
      case 'low':
        return 'border-l-green-500 bg-green-50 text-green-800';
      default:
        return 'border-l-gray-500 bg-gray-50 text-gray-800';
    }
  };

  const getIconColor = () => {
    switch (notification.priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-blue-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleActionClick = () => {
    if (notification.actionUrl && onAction) {
      onAction(notification.actionUrl);
    }
    onClose();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className={`
        fixed top-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 
        border-l-4 ${getPriorityStyles()} z-50 animate-in slide-in-from-right duration-300
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded ${getIconColor()}`}>
              {getIcon()}
            </div>
            <h3 className="font-medium text-gray-900 text-sm">
              {notification.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
          {notification.message}
        </p>

        {/* Car-specific details */}
        {notification.type === 'NEW_CAR' && notification.data && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Car className="w-3 h-3" />
              <span>
                {notification.data.make} {notification.data.model} • 
                €{notification.data.price?.toLocaleString()} • 
                {notification.data.location}
              </span>
            </div>
            {notification.data.seller && (
              <div className="mt-1 text-gray-500">
                by {notification.data.seller.name} ({notification.data.seller.type})
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {formatTime(notification.timestamp)}
          </span>
          
          {notification.actionUrl && (
            <button
              onClick={handleActionClick}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              View
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Priority indicator */}
      {notification.priority === 'critical' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
}

// Notification Container Component
interface NotificationContainerProps {
  notifications: AdminNotification[];
  onClose: (id: string) => void;
  onAction?: (url: string) => void;
}

export function NotificationContainer({ 
  notifications, 
  onClose, 
  onAction 
}: NotificationContainerProps) {
  // Show only the 3 most recent notifications
  const visibleNotifications = notifications.slice(0, 3);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ 
            transform: `translateY(${index * 4}px)`,
            zIndex: 50 - index 
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => onClose(notification.id)}
            onAction={onAction}
          />
        </div>
      ))}
    </div>
  );
}