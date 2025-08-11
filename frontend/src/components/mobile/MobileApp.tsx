import React, { useState, useEffect } from 'react';
import NeomorphicCard from '../ui/NeomorphicCard';
import NeomorphicButton from '../ui/NeomorphicButton';
import LoadingSpinner from '../ui/LoadingSpinner';

interface MobileFeature {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'development';
  usage: number;
  lastUpdated: string;
  icon: string;
}

interface AppAnalytics {
  downloads: number;
  activeUsers: number;
  retention: number;
  rating: number;
  crashes: number;
  revenue: number;
}

interface DeviceStats {
  ios: number;
  android: number;
  tablets: number;
  phones: number;
}

export const MobileApp: React.FC = () => {
  const [features, setFeatures] = useState<MobileFeature[]>([]);
  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'analytics' | 'distribution'>('overview');

  useEffect(() => {
    loadMobileData();
  }, []);

  const loadMobileData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFeatures([
        {
          id: '1',
          name: 'Staff Check-in',
          description: 'Location-based attendance tracking with face recognition',
          status: 'active',
          usage: 89,
          lastUpdated: '2024-01-15',
          icon: '👥'
        },
        {
          id: '2',
          name: 'Real-time Booking',
          description: 'Live booking management and client communication',
          status: 'active',
          usage: 76,
          lastUpdated: '2024-01-14',
          icon: '📅'
        },
        {
          id: '3',
          name: 'Inventory Scanner',
          description: 'QR/Barcode scanning for inventory management',
          status: 'active',
          usage: 82,
          lastUpdated: '2024-01-13',
          icon: '📦'
        },
        {
          id: '4',
          name: 'Expense Tracker',
          description: 'Photo-based expense reporting with GPS',
          status: 'development',
          usage: 45,
          lastUpdated: '2024-01-12',
          icon: '💰'
        },
        {
          id: '5',
          name: 'Push Notifications',
          description: 'Smart notifications for tasks and updates',
          status: 'active',
          usage: 94,
          lastUpdated: '2024-01-11',
          icon: '🔔'
        },
        {
          id: '6',
          name: 'Offline Mode',
          description: 'Work without internet, sync when connected',
          status: 'development',
          usage: 23,
          lastUpdated: '2024-01-10',
          icon: '📱'
        }
      ]);

      setAnalytics({
        downloads: 12500,
        activeUsers: 8900,
        retention: 78,
        rating: 4.6,
        crashes: 12,
        revenue: 15400
      });

      setDeviceStats({
        ios: 58,
        android: 42,
        tablets: 15,
        phones: 85
      });
    } catch (error) {
      console.error('Failed to load mobile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'development': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const generateQRCode = () => {
    // In a real app, this would generate actual QR codes
    alert('QR code generated for mobile app download!');
  };

  const deployUpdate = () => {
    alert('App update deployed to app stores!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Mobile App Management</h1>
          <p className="text-gray-600 mt-2">Manage mobile features, analytics, and distribution</p>
        </div>
        <div className="flex space-x-3">
          <NeomorphicButton onClick={generateQRCode} className="flex items-center space-x-2">
            <span>📱</span>
            <span>Generate QR</span>
          </NeomorphicButton>
          <NeomorphicButton onClick={deployUpdate} className="flex items-center space-x-2">
            <span>🚀</span>
            <span>Deploy Update</span>
          </NeomorphicButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'features', label: 'Features', icon: '⚙️' },
          { key: 'analytics', label: 'Analytics', icon: '📈' },
          { key: 'distribution', label: 'Distribution', icon: '🚀' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeTab === tab.key
                ? 'bg-white shadow-md text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && analytics && deviceStats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Downloads</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.downloads.toLocaleString()}</p>
                  <p className="text-green-600 text-sm">+12% this month</p>
                </div>
                <span className="text-3xl">📱</span>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.activeUsers.toLocaleString()}</p>
                  <p className="text-green-600 text-sm">+8% this week</p>
                </div>
                <span className="text-3xl">👥</span>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">App Rating</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.rating}/5</p>
                  <p className="text-green-600 text-sm">+0.2 this month</p>
                </div>
                <span className="text-3xl">⭐</span>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Retention Rate</p>
                  <p className="text-2xl font-bold text-gray-800">{analytics.retention}%</p>
                  <p className="text-green-600 text-sm">+5% this month</p>
                </div>
                <span className="text-3xl">🔄</span>
              </div>
            </NeomorphicCard>
          </div>

          {/* Device Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Distribution</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🍎</span>
                    <span className="text-gray-700">iOS</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${deviceStats.ios}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-600">{deviceStats.ios}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🤖</span>
                    <span className="text-gray-700">Android</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: `${deviceStats.android}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-600">{deviceStats.android}%</span>
                  </div>
                </div>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Device Types</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">📱</span>
                    <span className="text-gray-700">Phones</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${deviceStats.phones}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-600">{deviceStats.phones}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">📟</span>
                    <span className="text-gray-700">Tablets</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${deviceStats.tablets}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-600">{deviceStats.tablets}%</span>
                  </div>
                </div>
              </div>
            </NeomorphicCard>
          </div>

          {/* Recent Activity */}
          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent App Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🔄</span>
                  <span className="text-gray-700">App version 2.3.1 deployed</span>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🐛</span>
                  <span className="text-gray-700">Bug fix for iOS notification issue</span>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">⭐</span>
                  <span className="text-gray-700">New 5-star review received</span>
                </div>
                <span className="text-sm text-gray-500">2 days ago</span>
              </div>
            </div>
          </NeomorphicCard>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <NeomorphicCard key={feature.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{feature.name}</h3>
                      <p className="text-sm text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                    {feature.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Usage</span>
                    <span className="font-medium">{feature.usage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${feature.usage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-sm text-gray-500">{feature.lastUpdated}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <NeomorphicButton className="flex-1 text-sm">
                    {feature.status === 'development' ? 'Continue Dev' : 'Configure'}
                  </NeomorphicButton>
                  <NeomorphicButton className="px-3 text-sm">
                    📊
                  </NeomorphicButton>
                </div>
              </NeomorphicCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Crash Rate</span>
                  <span className="font-medium text-green-600">0.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Load Time</span>
                  <span className="font-medium">2.3s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Battery Usage</span>
                  <span className="font-medium text-green-600">Low</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Usage</span>
                  <span className="font-medium">3.2MB/day</span>
                </div>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">User Engagement</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session Length</span>
                  <span className="font-medium">8.5 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Sessions</span>
                  <span className="font-medium">3.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Feature Adoption</span>
                  <span className="font-medium text-green-600">76%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Push CTR</span>
                  <span className="font-medium">12.5%</span>
                </div>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Revenue</span>
                  <span className="font-medium">${analytics.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ARPU</span>
                  <span className="font-medium">$1.73</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">LTV</span>
                  <span className="font-medium">$24.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-medium text-green-600">3.8%</span>
                </div>
              </div>
            </NeomorphicCard>
          </div>

          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Feedback</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">John D.</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">2 days ago</span>
                </div>
                <p className="text-gray-700">"Great app! The inventory scanner feature saves us so much time."</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Sarah M.</span>
                    <div className="flex">
                      {[...Array(4)].map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">1 week ago</span>
                </div>
                <p className="text-gray-700">"Love the real-time notifications. Could use better offline support."</p>
              </div>
            </div>
          </NeomorphicCard>
        </div>
      )}

      {activeTab === 'distribution' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">App Store Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🍎</span>
                    <div>
                      <span className="font-medium">App Store</span>
                      <p className="text-sm text-gray-500">Version 2.3.1</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Live</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">📱</span>
                    <div>
                      <span className="font-medium">Google Play</span>
                      <p className="text-sm text-gray-500">Version 2.3.1</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Live</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🏢</span>
                    <div>
                      <span className="font-medium">Enterprise</span>
                      <p className="text-sm text-gray-500">Internal Distribution</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">Active</span>
                </div>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Download Links</h3>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">iOS App Store</span>
                    <NeomorphicButton className="text-sm px-3 py-1">Copy Link</NeomorphicButton>
                  </div>
                  <p className="text-sm text-gray-500 break-all">https://apps.apple.com/app/abeer-crm</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Google Play Store</span>
                    <NeomorphicButton className="text-sm px-3 py-1">Copy Link</NeomorphicButton>
                  </div>
                  <p className="text-sm text-gray-500 break-all">https://play.google.com/store/apps/abeer-crm</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">QR Code</span>
                    <NeomorphicButton onClick={generateQRCode} className="text-sm px-3 py-1">Generate</NeomorphicButton>
                  </div>
                  <p className="text-sm text-gray-500">Quick download via QR scanning</p>
                </div>
              </div>
            </NeomorphicCard>
          </div>

          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Release Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium">Version 2.4.0 (Beta)</h4>
                  <p className="text-sm text-gray-500">New offline mode and enhanced security</p>
                </div>
                <div className="flex space-x-2">
                  <NeomorphicButton className="text-sm">Test</NeomorphicButton>
                  <NeomorphicButton className="text-sm">Deploy</NeomorphicButton>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium">Version 2.3.2 (Hotfix)</h4>
                  <p className="text-sm text-gray-500">Critical bug fixes for notification system</p>
                </div>
                <div className="flex space-x-2">
                  <NeomorphicButton className="text-sm">Review</NeomorphicButton>
                  <NeomorphicButton className="text-sm">Deploy</NeomorphicButton>
                </div>
              </div>
            </div>
          </NeomorphicCard>
        </div>
      )}
    </div>
  );
};
