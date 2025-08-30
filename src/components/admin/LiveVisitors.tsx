// src/components/admin/LiveVisitors.tsx - Live visitors component
'use client';

import { useState, useEffect } from 'react';

interface LiveVisitor {
  id: string;
  currentPage: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  startedAt: string;
  pageViewCount: number;
  lastActivity: string;
}

interface LiveVisitorsData {
  count: number;
  visitors: LiveVisitor[];
  timestamp: string;
}

export function LiveVisitors() {
  const [liveData, setLiveData] = useState<LiveVisitorsData>({
    count: 0,
    visitors: [],
    timestamp: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveVisitors = async () => {
    try {
      const response = await fetch('/api/live-tracking', {
        method: 'GET',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch live visitors');
      }

      const data = await response.json();
      setLiveData(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching live visitors:', error);
      setError('Failed to load live visitors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLiveVisitors();

    // Set up polling every 10 seconds
    const interval = setInterval(fetchLiveVisitors, 10000);

    return () => clearInterval(interval);
  }, []);

  const getSessionDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getTimeSinceActivity = (lastActivity: string) => {
    const activity = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - activity.getTime();
    const seconds = Math.floor(diffMs / 1000);
    
    if (seconds < 60) {
      return 'now';
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    }
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[400px]">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          Live Visitors
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[400px]">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        Live Visitors
        <span className="ml-auto bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded">
          {liveData.count}
        </span>
      </h3>
      <div>
        {error ? (
          <div className="text-red-600 text-center py-8">
            {error}
          </div>
        ) : liveData.count === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No active visitors right now
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {liveData.visitors.map((visitor) => (
              <div
                key={visitor.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-sm">
                        {visitor.currentPage || '/'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Location:</span> {visitor.country || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Device:</span> {visitor.device || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Browser:</span> {visitor.browser || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Pages:</span> {visitor.pageViewCount}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right text-xs text-gray-500">
                    <div>Duration: {getSessionDuration(visitor.startedAt)}</div>
                    <div>Active: {getTimeSinceActivity(visitor.lastActivity)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
          Last updated: {new Date(liveData.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}