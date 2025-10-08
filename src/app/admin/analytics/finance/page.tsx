'use client';

import { useState, useEffect } from 'react';
import { Euro, TrendingUp, Users, MousePointerClick, Smartphone, Monitor, Tablet, Calendar } from 'lucide-react';

interface FinanceStats {
  period: string;
  summary: {
    totalClicks: number;
    uniqueUsers: number;
    anonymousClicks: number;
    conversionRate: number;
  };
  clicksByCar: Array<{
    carId: string;
    make: string;
    model: string;
    price: number;
    clicks: number;
  }>;
  clicksByDealer: Array<{
    dealerId: string;
    name: string;
    clicks: number;
  }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  recentClicks: Array<{
    id: string;
    car: string;
    dealer: string;
    device: string;
    timestamp: string;
    user: string;
  }>;
}

export default function FinanceAnalyticsPage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7days');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/finance-click?period=${period}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch finance stats');
      }
    } catch (error) {
      console.error('Error fetching finance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading finance analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Euro className="w-6 h-6 text-green-600" />
                Finance Application Analytics
              </h1>
              <p className="text-gray-600 text-sm">Track "Apply for Finance" button clicks and user engagement</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-100 rounded-lg p-2">
                <MousePointerClick className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.summary.totalClicks}</h3>
            <p className="text-gray-600 text-sm">Total Clicks</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-100 rounded-lg p-2">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.summary.uniqueUsers}</h3>
            <p className="text-gray-600 text-sm">Unique Users</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-purple-100 rounded-lg p-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.summary.anonymousClicks}</h3>
            <p className="text-gray-600 text-sm">Anonymous Clicks</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-orange-100 rounded-lg p-2">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats.summary.totalClicks > 0 ? (stats.summary.totalClicks / (period === '7days' ? 7 : period === '30days' ? 30 : 1)).toFixed(1) : 0}
            </h3>
            <p className="text-gray-600 text-sm">Avg. Clicks/Day</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Device Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(stats.deviceBreakdown).map(([device, count]) => {
                const percentage = ((count / stats.summary.totalClicks) * 100).toFixed(1);
                const Icon = device === 'mobile' ? Smartphone : device === 'tablet' ? Tablet : Monitor;
                return (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium capitalize text-gray-700">{device}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-16 text-right">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browser Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(stats.browserBreakdown).map(([browser, count]) => {
                const percentage = ((count / stats.summary.totalClicks) * 100).toFixed(1);
                return (
                  <div key={browser} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{browser}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-16 text-right">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Cars by Finance Clicks */}
        {stats.clicksByCar.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Cars by Finance Clicks</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Car</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.clicksByCar.slice(0, 10).map((car) => (
                    <tr key={car.carId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {car.make} {car.model}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        €{Number(car.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{car.clicks}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {((car.clicks / stats.summary.totalClicks) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Dealers by Finance Clicks */}
        {stats.clicksByDealer.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Dealers by Finance Clicks</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.clicksByDealer.slice(0, 10).map((dealer) => (
                    <tr key={dealer.dealerId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{dealer.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{dealer.clicks}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {((dealer.clicks / stats.summary.totalClicks) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Clicks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Finance Clicks</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Car</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentClicks.map((click) => (
                  <tr key={click.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(click.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{click.car}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{click.dealer}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{click.device}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{click.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
