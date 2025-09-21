import React, { useState, useEffect } from 'react';import React, { useState, useEffect } from 'react';

import NeomorphicCard from '../ui/NeomorphicCard';import NeomorphicCard from '../ui/NeomorphicCard';

import NeomorphicButton from '../ui/NeomorphicButton';import NeomorphicButton from '../ui/NeomorphicButton';

import LoadingSpinner from '../ui/LoadingSpinner';import LoadingSpinner from '../ui/LoadingSpinner';



interface MobileFeature {interface MobileFeature {

  id: string;  id: string;

  name: string;  name: string;

  description: string;  description: string;

  status: 'active' | 'inactive' | 'development';  status: 'active' | 'inactive' | 'development';

  usage: number;  usage: number;

  lastUpdated: string;  lastUpdated: string;

  icon: string;  icon: string;

}}



interface AppAnalytics {interface AppAnalytics {

  downloads: number;  downloads: number;

  activeUsers: number;  activeUsers: number;

  retention: number;  retention: number;

  rating: number;  rating: number;

  crashes: number;  crashes: number;

  revenue: number;  revenue: number;

}}



interface DeviceStats {interface DeviceStats {

  ios: number;  ios: number;

  android: number;  android: number;

  tablets: number;  tablets: number;

  phones: number;  phones: number;

}}



export const MobileApp: React.FC = () => {export const MobileApp: React.FC = () => {

  const [features, setFeatures] = useState<MobileFeature[]>([]);  const [features, setFeatures] = useState<MobileFeature[]>([]);

  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);

  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);

  const [loading, setLoading] = useState(true);  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'analytics' | 'distribution'>('overview');  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'analytics' | 'distribution'>('overview');



  useEffect(() => {  useEffect(() => {

    loadMobileData();    loadMobileData();

  }, []);  }, []);



  const loadMobileData = async () => {  const loadMobileData = async () => {

    try {    try {

      setLoading(true);      setLoading(true);

      await new Promise(resolve => setTimeout(resolve, 1000));      await new Promise(resolve => setTimeout(resolve, 1000));

      

      setFeatures([      setFeatures([

        { id: '1', name: 'Staff Check-in', description: 'Location-based attendance tracking with face recognition', status: 'active', usage: 89, lastUpdated: '2024-01-15', icon: '👥' },        {

        { id: '2', name: 'Real-time Booking', description: 'Live booking management and client communication', status: 'active', usage: 76, lastUpdated: '2024-01-14', icon: '📅' },          id: '1',

        { id: '3', name: 'Inventory Scanner', description: 'QR/Barcode scanning for inventory management', status: 'active', usage: 82, lastUpdated: '2024-01-13', icon: '📦' },          name: 'Staff Check-in',

        { id: '4', name: 'Expense Tracker', description: 'Photo-based expense reporting with GPS', status: 'development', usage: 45, lastUpdated: '2024-01-12', icon: '💰' },          description: 'Location-based attendance tracking with face recognition',

        { id: '5', name: 'Push Notifications', description: 'Smart notifications for tasks and updates', status: 'active', usage: 94, lastUpdated: '2024-01-11', icon: '🔔' },          status: 'active',

        { id: '6', name: 'Offline Mode', description: 'Work without internet, sync when connected', status: 'development', usage: 23, lastUpdated: '2024-01-10', icon: '📱' }          usage: 89,

      ]);          lastUpdated: '2024-01-15',

          icon: '👥'

      setAnalytics({ downloads: 12500, activeUsers: 8900, retention: 78, rating: 4.6, crashes: 12, revenue: 15400 });        },

        {

      setDeviceStats({ ios: 58, android: 42, tablets: 15, phones: 85 });          id: '2',

    } catch (error) {          name: 'Real-time Booking',

      console.error('Failed to load mobile data:', error);          description: 'Live booking management and client communication',

    } finally {          status: 'active',

      setLoading(false);          usage: 76,

    }          lastUpdated: '2024-01-14',

  };          icon: '📅'

        },

  const getStatusColor = (status: string) => {        {

    switch (status) {          id: '3',

      case 'active': return 'text-green-600 bg-green-100';          name: 'Inventory Scanner',

      case 'development': return 'text-yellow-600 bg-yellow-100';          description: 'QR/Barcode scanning for inventory management',

      case 'inactive': return 'text-red-600 bg-red-100';          status: 'active',

      default: return 'text-gray-600 bg-gray-100';          usage: 82,

    }          lastUpdated: '2024-01-13',

  };          icon: '📦'

        },

  const generateQRCode = () => {        {

    alert('QR code generated for mobile app download!');          id: '4',

  };          name: 'Expense Tracker',

          description: 'Photo-based expense reporting with GPS',

  const deployUpdate = () => {          status: 'development',

    alert('App update deployed to app stores!');          usage: 45,

  };          lastUpdated: '2024-01-12',

          icon: '💰'

  if (loading) return (        },

    <div className="flex items-center justify-center h-64">        {

      <LoadingSpinner />          id: '5',

    </div>          name: 'Push Notifications',

  );          description: 'Smart notifications for tasks and updates',

          status: 'active',

  return (          usage: 94,

    <div className="space-y-6">          lastUpdated: '2024-01-11',

      <div className="flex justify-between items-center">          icon: '🔔'

        <div>        },

          <h1 className="text-3xl font-bold text-gray-800">Mobile App Management</h1>        {

          <p className="text-gray-600 mt-2">Manage mobile features, analytics, and distribution</p>          id: '6',

        </div>          name: 'Offline Mode',

        <div className="flex space-x-3">          description: 'Work without internet, sync when connected',

          <NeomorphicButton onClick={generateQRCode} className="flex items-center space-x-2">          status: 'development',

            <span>📱</span>          usage: 23,

            <span>Generate QR</span>          lastUpdated: '2024-01-10',

          </NeomorphicButton>          icon: '📱'

          <NeomorphicButton onClick={deployUpdate} className="flex items-center space-x-2">        }

            <span>🚀</span>      ]);

            <span>Deploy Update</span>

          </NeomorphicButton>      setAnalytics({

        </div>        downloads: 12500,

      </div>        activeUsers: 8900,

        retention: 78,

      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">        rating: 4.6,

        {[        crashes: 12,

          { key: 'overview', label: 'Overview', icon: '📊' },        revenue: 15400

          { key: 'features', label: 'Features', icon: '⚙️' },      });

          { key: 'analytics', label: 'Analytics', icon: '📈' },

          { key: 'distribution', label: 'Distribution', icon: '🚀' }      setDeviceStats({

        ].map((tab) => (        ios: 58,

          <button        android: 42,

            key={tab.key}        tablets: 15,

            onClick={() => setActiveTab(tab.key as any)}        phones: 85

            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all ${      });

              activeTab === tab.key ? 'bg-white shadow-md text-blue-600' : 'text-gray-600 hover:text-gray-800'    } catch (error) {

            }`}      console.error('Failed to load mobile data:', error);

          >    } finally {

            <span>{tab.icon}</span>      setLoading(false);

            <span>{tab.label}</span>    }

          </button>  };

        ))}

      </div>  const getStatusColor = (status: string) => {

    switch (status) {

      {activeTab === 'overview' && analytics && deviceStats && (      case 'active': return 'text-green-600 bg-green-100';

        <div className="space-y-6">      case 'development': return 'text-yellow-600 bg-yellow-100';

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">      case 'inactive': return 'text-red-600 bg-red-100';

            <NeomorphicCard className="p-6">      default: return 'text-gray-600 bg-gray-100';

              <div className="flex items-center justify-between">    }

                <div>  };

                  <p className="text-gray-600 text-sm">Total Downloads</p>

                  <p className="text-2xl font-bold text-gray-800">{analytics.downloads.toLocaleString()}</p>  const generateQRCode = () => {

                  <p className="text-green-600 text-sm">+12% this month</p>    

                </div>    alert('QR code generated for mobile app download!');

                <span className="text-3xl">📱</span>  };

              </div>

            </NeomorphicCard>  const deployUpdate = () => {

    alert('App update deployed to app stores!');

            <NeomorphicCard className="p-6">  };

              <div className="flex items-center justify-between">

                <div>  if (loading) {

                  <p className="text-gray-600 text-sm">Active Users</p>    return (

                  <p className="text-2xl font-bold text-gray-800">{analytics.activeUsers.toLocaleString()}</p>      <div className="flex items-center justify-center h-64">

                  <p className="text-green-600 text-sm">+8% this week</p>        <LoadingSpinner />

                </div>      </div>

                <span className="text-3xl">👥</span>    );

              </div>  }

            </NeomorphicCard>

  return (

            <NeomorphicCard className="p-6">    <div className="space-y-6">

              <div className="flex items-center justify-between">      

                <div>      <div className="flex justify-between items-center">

                  <p className="text-gray-600 text-sm">App Rating</p>        <div>

                  <p className="text-2xl font-bold text-gray-800">{analytics.rating}/5</p>          <h1 className="text-3xl font-bold text-gray-800">Mobile App Management</h1>

                  <p className="text-green-600 text-sm">+0.2 this month</p>          <p className="text-gray-600 mt-2">Manage mobile features, analytics, and distribution</p>

                </div>        </div>

                <span className="text-3xl">⭐</span>        <div className="flex space-x-3">

              </div>          <NeomorphicButton onClick={generateQRCode} className="flex items-center space-x-2">

            </NeomorphicCard>            <span>📱</span>

            <span>Generate QR</span>

            <NeomorphicCard className="p-6">          </NeomorphicButton>

              <div className="flex items-center justify-between">          <NeomorphicButton onClick={deployUpdate} className="flex items-center space-x-2">

                <div>            <span>🚀</span>

                  <p className="text-gray-600 text-sm">Retention Rate</p>            <span>Deploy Update</span>

                  <p className="text-2xl font-bold text-gray-800">{analytics.retention}%</p>          </NeomorphicButton>

                  <p className="text-green-600 text-sm">+5% this month</p>        </div>

                </div>      </div>

                <span className="text-3xl">🔄</span>

              </div>      

            </NeomorphicCard>      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">

          </div>        {[

          { key: 'overview', label: 'Overview', icon: '📊' },

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">          { key: 'features', label: 'Features', icon: '⚙️' },

            <NeomorphicCard className="p-6">          { key: 'analytics', label: 'Analytics', icon: '📈' },

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Distribution</h3>          { key: 'distribution', label: 'Distribution', icon: '🚀' }

              <div className="space-y-4">        ].map((tab) => (

                <div className="flex items-center justify-between">          <button

                  <div className="flex items-center space-x-3">            key={tab.key}

                    <span className="text-xl">🍎</span>            onClick={() => setActiveTab(tab.key as any)}

                    <span className="text-gray-700">iOS</span>            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all ${

                  </div>              activeTab === tab.key

                  <div className="flex items-center space-x-3">                ? 'bg-white shadow-md text-blue-600'

                    <div className="w-32 bg-gray-200 rounded-full h-3">                : 'text-gray-600 hover:text-gray-800'

                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${deviceStats.ios}%` }}></div>            }`}

                    </div>          >

                    <span className="text-sm text-gray-600">{deviceStats.ios}%</span>            <span>{tab.icon}</span>

                  </div>            <span>{tab.label}</span>

                </div>          </button>

                <div className="flex items-center justify-between">        ))}

                  <div className="flex items-center space-x-3">      </div>

                    <span className="text-xl">🤖</span>

                    <span className="text-gray-700">Android</span>      

                  </div>      {activeTab === 'overview' && analytics && deviceStats && (

                  <div className="flex items-center space-x-3">        <div className="space-y-6">

                    <div className="w-32 bg-gray-200 rounded-full h-3">          

                      <div className="bg-green-500 h-3 rounded-full" style={{ width: `${deviceStats.android}%` }}></div>          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    </div>            <NeomorphicCard className="p-6">

                    <span className="text-sm text-gray-600">{deviceStats.android}%</span>              <div className="flex items-center justify-between">

                  </div>                <div>

                </div>                  <p className="text-gray-600 text-sm">Total Downloads</p>

              </div>                  <p className="text-2xl font-bold text-gray-800">{analytics.downloads.toLocaleString()}</p>

            </NeomorphicCard>                  <p className="text-green-600 text-sm">+12% this month</p>

                </div>

            <NeomorphicCard className="p-6">                <span className="text-3xl">📱</span>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Device Types</h3>              </div>

              <div className="space-y-4">            </NeomorphicCard>

                <div className="flex items-center justify-between">

                  <div className="flex items-center space-x-3">            <NeomorphicCard className="p-6">

                    <span className="text-xl">📱</span>              <div className="flex items-center justify-between">

                    <span className="text-gray-700">Phones</span>                <div>

                  </div>                  <p className="text-gray-600 text-sm">Active Users</p>

                  <div className="flex items-center space-x-3">                  <p className="text-2xl font-bold text-gray-800">{analytics.activeUsers.toLocaleString()}</p>

                    <div className="w-32 bg-gray-200 rounded-full h-3">                  <p className="text-green-600 text-sm">+8% this week</p>

                      <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${deviceStats.phones}%` }}></div>                </div>

                    </div>                <span className="text-3xl">👥</span>

                    <span className="text-sm text-gray-600">{deviceStats.phones}%</span>              </div>

                  </div>            </NeomorphicCard>

                </div>

                <div className="flex items-center justify-between">            <NeomorphicCard className="p-6">

                  <div className="flex items-center space-x-3">              <div className="flex items-center justify-between">

                    <span className="text-xl">📟</span>                <div>

                    <span className="text-gray-700">Tablets</span>                  <p className="text-gray-600 text-sm">App Rating</p>

                  </div>                  <p className="text-2xl font-bold text-gray-800">{analytics.rating}/5</p>

                  <div className="flex items-center space-x-3">                  <p className="text-green-600 text-sm">+0.2 this month</p>

                    <div className="w-32 bg-gray-200 rounded-full h-3">                </div>

                      <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${deviceStats.tablets}%` }}></div>                <span className="text-3xl">⭐</span>

                    </div>              </div>

                    <span className="text-sm text-gray-600">{deviceStats.tablets}%</span>            </NeomorphicCard>

                  </div>

                </div>            <NeomorphicCard className="p-6">

              </div>              <div className="flex items-center justify-between">

            </NeomorphicCard>                <div>

          </div>                  <p className="text-gray-600 text-sm">Retention Rate</p>

                  <p className="text-2xl font-bold text-gray-800">{analytics.retention}%</p>

          <NeomorphicCard className="p-6">                  <p className="text-green-600 text-sm">+5% this month</p>

            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent App Activity</h3>                </div>

            <div className="space-y-3">                <span className="text-3xl">🔄</span>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">              </div>

                <div className="flex items-center space-x-3">            </NeomorphicCard>

                  <span className="text-xl">🔄</span>          </div>

                  <span className="text-gray-700">App version 2.3.1 deployed</span>

                </div>          

                <span className="text-sm text-gray-500">2 hours ago</span>          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              </div>            <NeomorphicCard className="p-6">

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">              <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Distribution</h3>

                <div className="flex items-center space-x-3">              <div className="space-y-4">

                  <span className="text-xl">🐛</span>                <div className="flex items-center justify-between">

                  <span className="text-gray-700">Bug fix for iOS notification issue</span>                  <div className="flex items-center space-x-3">

                </div>                    <span className="text-xl">🍎</span>

                <span className="text-sm text-gray-500">1 day ago</span>                    <span className="text-gray-700">iOS</span>

              </div>                  </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">                  <div className="flex items-center space-x-3">

                <div className="flex items-center space-x-3">                    <div className="w-32 bg-gray-200 rounded-full h-3">

                  <span className="text-xl">⭐</span>                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${deviceStats.ios}%` }}></div>

                  <span className="text-gray-700">New 5-star review received</span>                    </div>

                </div>                    <span className="text-sm text-gray-600">{deviceStats.ios}%</span>

                <span className="text-sm text-gray-500">2 days ago</span>                  </div>

              </div>                </div>

            </div>                <div className="flex items-center justify-between">

          </NeomorphicCard>                  <div className="flex items-center space-x-3">

        </div>                    <span className="text-xl">🤖</span>

      )}                    <span className="text-gray-700">Android</span>

                  </div>

      {activeTab === 'features' && (                  <div className="flex items-center space-x-3">

        <div className="space-y-6">                    <div className="w-32 bg-gray-200 rounded-full h-3">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">                      <div className="bg-green-500 h-3 rounded-full" style={{ width: `${deviceStats.android}%` }}></div>

            {features.map((feature) => (                    </div>

              <NeomorphicCard key={feature.id} className="p-6">                    <span className="text-sm text-gray-600">{deviceStats.android}%</span>

                <div className="flex items-start justify-between mb-4">                  </div>

                  <div className="flex items-center space-x-3">                </div>

                    <span className="text-2xl">{feature.icon}</span>              </div>

                    <div>            </NeomorphicCard>

                      <h3 className="font-semibold text-gray-800">{feature.name}</h3>

                      <p className="text-sm text-gray-500">{feature.description}</p>            <NeomorphicCard className="p-6">

                    </div>              <h3 className="text-lg font-semibold text-gray-800 mb-4">Device Types</h3>

                  </div>              <div className="space-y-4">

                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>                <div className="flex items-center justify-between">

                    {feature.status.toUpperCase()}                  <div className="flex items-center space-x-3">

                  </span>                    <span className="text-xl">📱</span>

                </div>                    <span className="text-gray-700">Phones</span>

                  </div>

                <div className="space-y-3">                  <div className="flex items-center space-x-3">

                  <div className="flex items-center justify-between">                    <div className="w-32 bg-gray-200 rounded-full h-3">

                    <span className="text-gray-600">Usage</span>                      <div className="bg-purple-500 h-3 rounded-full" style={{ width: `${deviceStats.phones}%` }}></div>

                    <span className="font-medium">{feature.usage}%</span>                    </div>

                  </div>                    <span className="text-sm text-gray-600">{deviceStats.phones}%</span>

                  <div className="w-full bg-gray-200 rounded-full h-2">                  </div>

                    <div                 </div>

                      className="bg-blue-600 h-2 rounded-full"                 <div className="flex items-center justify-between">

                      style={{ width: `${feature.usage}%` }}                  <div className="flex items-center space-x-3">

                    ></div>                    <span className="text-xl">📟</span>

                  </div>                    <span className="text-gray-700">Tablets</span>

                  <div className="flex items-center justify-between">                  </div>

                    <span className="text-gray-600">Last Updated</span>                  <div className="flex items-center space-x-3">

                    <span className="text-sm text-gray-500">{feature.lastUpdated}</span>                    <div className="w-32 bg-gray-200 rounded-full h-3">

                  </div>                      <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${deviceStats.tablets}%` }}></div>

                </div>                    </div>

                    <span className="text-sm text-gray-600">{deviceStats.tablets}%</span>

                <div className="flex space-x-2 mt-4">                  </div>

                  <NeomorphicButton className="flex-1 text-sm">                </div>

                    {feature.status === 'development' ? 'Continue Dev' : 'Configure'}              </div>

                  </NeomorphicButton>            </NeomorphicCard>

                  <NeomorphicButton className="px-3 text-sm">          </div>

                    📊

                  </NeomorphicButton>          

                </div>          <NeomorphicCard className="p-6">

              </NeomorphicCard>            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent App Activity</h3>

            ))}            <div className="space-y-3">

          </div>              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">

        </div>                <div className="flex items-center space-x-3">

      )}                  <span className="text-xl">🔄</span>

                  <span className="text-gray-700">App version 2.3.1 deployed</span>

      {activeTab === 'analytics' && analytics && (                </div>

        <div className="space-y-6">                <span className="text-sm text-gray-500">2 hours ago</span>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">              </div>

            <NeomorphicCard className="p-6">              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>                <div className="flex items-center space-x-3">

              <div className="space-y-3">                  <span className="text-xl">🐛</span>

                <div className="flex justify-between">                  <span className="text-gray-700">Bug fix for iOS notification issue</span>

                  <span className="text-gray-600">Crash Rate</span>                </div>

                  <span className="font-medium text-green-600">0.1%</span>                <span className="text-sm text-gray-500">1 day ago</span>

                </div>              </div>

                <div className="flex justify-between">              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">

                  <span className="text-gray-600">Load Time</span>                <div className="flex items-center space-x-3">

                  <span className="font-medium">2.3s</span>                  <span className="text-xl">⭐</span>

                </div>                  <span className="text-gray-700">New 5-star review received</span>

                <div className="flex justify-between">                </div>

                  <span className="text-gray-600">Battery Usage</span>                <span className="text-sm text-gray-500">2 days ago</span>

                  <span className="font-medium text-green-600">Low</span>              </div>

                </div>            </div>

                <div className="flex justify-between">          </NeomorphicCard>

                  <span className="text-gray-600">Data Usage</span>        </div>

                  <span className="font-medium">3.2MB/day</span>      )}

                </div>

              </div>      {activeTab === 'features' && (

            </NeomorphicCard>        <div className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <NeomorphicCard className="p-6">            {features.map((feature) => (

              <h3 className="text-lg font-semibold text-gray-800 mb-4">User Engagement</h3>              <NeomorphicCard key={feature.id} className="p-6">

              <div className="space-y-3">                <div className="flex items-start justify-between mb-4">

                <div className="flex justify-between">                  <div className="flex items-center space-x-3">

                  <span className="text-gray-600">Session Length</span>                    <span className="text-2xl">{feature.icon}</span>

                  <span className="font-medium">8.5 min</span>                    <div>

                </div>                      <h3 className="font-semibold text-gray-800">{feature.name}</h3>

                <div className="flex justify-between">                      <p className="text-sm text-gray-500">{feature.description}</p>

                  <span className="text-gray-600">Daily Sessions</span>                    </div>

                  <span className="font-medium">3.2</span>                  </div>

                </div>                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>

                <div className="flex justify-between">                    {feature.status.toUpperCase()}

                  <span className="text-gray-600">Feature Adoption</span>                  </span>

                  <span className="font-medium text-green-600">76%</span>                </div>

                </div>                

                <div className="flex justify-between">                <div className="space-y-3">

                  <span className="text-gray-600">Push CTR</span>                  <div className="flex items-center justify-between">

                  <span className="font-medium">12.5%</span>                    <span className="text-gray-600">Usage</span>

                </div>                    <span className="font-medium">{feature.usage}%</span>

              </div>                  </div>

            </NeomorphicCard>                  <div className="w-full bg-gray-200 rounded-full h-2">

                    <div 

            <NeomorphicCard className="p-6">                      className="bg-blue-600 h-2 rounded-full" 

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Metrics</h3>                      style={{ width: `${feature.usage}%` }}

              <div className="space-y-3">                    ></div>

                <div className="flex justify-between">                  </div>

                  <span className="text-gray-600">Monthly Revenue</span>                  <div className="flex items-center justify-between">

                  <span className="font-medium">${analytics.revenue.toLocaleString()}</span>                    <span className="text-gray-600">Last Updated</span>

                </div>                    <span className="text-sm text-gray-500">{feature.lastUpdated}</span>

                <div className="flex justify-between">                  </div>

                  <span className="text-gray-600">ARPU</span>                </div>

                  <span className="font-medium">$1.73</span>                

                </div>                <div className="flex space-x-2 mt-4">

                <div className="flex justify-between">                  <NeomorphicButton className="flex-1 text-sm">

                  <span className="text-gray-600">LTV</span>                    {feature.status === 'development' ? 'Continue Dev' : 'Configure'}

                  <span className="font-medium">$24.50</span>                  </NeomorphicButton>

                </div>                  <NeomorphicButton className="px-3 text-sm">

                <div className="flex justify-between">                    📊

                  <span className="text-gray-600">Conversion Rate</span>                  </NeomorphicButton>

                  <span className="font-medium text-green-600">3.8%</span>                </div>

                </div>              </NeomorphicCard>

              </div>            ))}

            </NeomorphicCard>          </div>

          </div>        </div>

      )}

          <NeomorphicCard className="p-6">

            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Feedback</h3>      {activeTab === 'analytics' && analytics && (

            <div className="space-y-4">        <div className="space-y-6">

              <div className="p-4 bg-gray-50 rounded-lg">          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <div className="flex items-center justify-between mb-2">            <NeomorphicCard className="p-6">

                  <div className="flex items-center space-x-2">              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>

                    <span className="font-medium">John D.</span>              <div className="space-y-3">

                    <div className="flex">                <div className="flex justify-between">

                      {[...Array(5)].map((_, i) => (                  <span className="text-gray-600">Crash Rate</span>

                        <span key={i} className="text-yellow-400">⭐</span>                  <span className="font-medium text-green-600">0.1%</span>

                      ))}                </div>

                    </div>                <div className="flex justify-between">

                  </div>                  <span className="text-gray-600">Load Time</span>

                  <span className="text-sm text-gray-500">2 days ago</span>                  <span className="font-medium">2.3s</span>

                </div>                </div>

                <p className="text-gray-700">"Great app! The inventory scanner feature saves us so much time."</p>                <div className="flex justify-between">

              </div>                  <span className="text-gray-600">Battery Usage</span>

              <div className="p-4 bg-gray-50 rounded-lg">                  <span className="font-medium text-green-600">Low</span>

                <div className="flex items-center justify-between mb-2">                </div>

                  <div className="flex items-center space-x-2">                <div className="flex justify-between">

                    <span className="font-medium">Sarah M.</span>                  <span className="text-gray-600">Data Usage</span>

                    <div className="flex">                  <span className="font-medium">3.2MB/day</span>

                      {[...Array(4)].map((_, i) => (                </div>

                        <span key={i} className="text-yellow-400">⭐</span>              </div>

                      ))}            </NeomorphicCard>

                    </div>

                  </div>            <NeomorphicCard className="p-6">

                  <span className="text-sm text-gray-500">1 week ago</span>              <h3 className="text-lg font-semibold text-gray-800 mb-4">User Engagement</h3>

                </div>              <div className="space-y-3">

                <p className="text-gray-700">"Love the real-time notifications. Could use better offline support."</p>                <div className="flex justify-between">

              </div>                  <span className="text-gray-600">Session Length</span>

            </div>                  <span className="font-medium">8.5 min</span>

          </NeomorphicCard>                </div>

        </div>                <div className="flex justify-between">

      )}                  <span className="text-gray-600">Daily Sessions</span>

                  <span className="font-medium">3.2</span>

      {activeTab === 'distribution' && (                </div>

        <div className="space-y-6">                <div className="flex justify-between">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">                  <span className="text-gray-600">Feature Adoption</span>

            <NeomorphicCard className="p-6">                  <span className="font-medium text-green-600">76%</span>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">App Store Status</h3>                </div>

              <div className="space-y-4">                <div className="flex justify-between">

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">                  <span className="text-gray-600">Push CTR</span>

                  <div className="flex items-center space-x-3">                  <span className="font-medium">12.5%</span>

                    <span className="text-xl">🍎</span>                </div>

                    <div>              </div>

                      <span className="font-medium">App Store</span>            </NeomorphicCard>

                      <p className="text-sm text-gray-500">Version 2.3.1</p>

                    </div>            <NeomorphicCard className="p-6">

                  </div>              <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Metrics</h3>

                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Live</span>              <div className="space-y-3">

                </div>                <div className="flex justify-between">

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">                  <span className="text-gray-600">Monthly Revenue</span>

                  <div className="flex items-center space-x-3">                  <span className="font-medium">${analytics.revenue.toLocaleString()}</span>

                    <span className="text-xl">📱</span>                </div>

                    <div>                <div className="flex justify-between">

                      <span className="font-medium">Google Play</span>                  <span className="text-gray-600">ARPU</span>

                      <p className="text-sm text-gray-500">Version 2.3.1</p>                  <span className="font-medium">$1.73</span>

                    </div>                </div>

                  </div>                <div className="flex justify-between">

                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Live</span>                  <span className="text-gray-600">LTV</span>

                </div>                  <span className="font-medium">$24.50</span>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">                </div>

                  <div className="flex items-center space-x-3">                <div className="flex justify-between">

                    <span className="text-xl">🏢</span>                  <span className="text-gray-600">Conversion Rate</span>

                    <div>                  <span className="font-medium text-green-600">3.8%</span>

                      <span className="font-medium">Enterprise</span>                </div>

                      <p className="text-sm text-gray-500">Internal Distribution</p>              </div>

                    </div>            </NeomorphicCard>

                  </div>          </div>

                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">Active</span>

                </div>          <NeomorphicCard className="p-6">

              </div>            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Feedback</h3>

            </NeomorphicCard>            <div className="space-y-4">

              <div className="p-4 bg-gray-50 rounded-lg">

            <NeomorphicCard className="p-6">                <div className="flex items-center justify-between mb-2">

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Download Links</h3>                  <div className="flex items-center space-x-2">

              <div className="space-y-4">                    <span className="font-medium">John D.</span>

                <div className="p-3 bg-gray-50 rounded-lg">                    <div className="flex">

                  <div className="flex items-center justify-between mb-2">                      {[...Array(5)].map((_, i) => (

                    <span className="font-medium">iOS App Store</span>                        <span key={i} className="text-yellow-400">⭐</span>

                    <NeomorphicButton className="text-sm px-3 py-1">Copy Link</NeomorphicButton>                      ))}

                  </div>                    </div>

                  <p className="text-sm text-gray-500 break-all">https:</p>                  </div>

                </div>                  <span className="text-sm text-gray-500">2 days ago</span>

                <div className="p-3 bg-gray-50 rounded-lg">                </div>

                  <div className="flex items-center justify-between mb-2">                <p className="text-gray-700">"Great app! The inventory scanner feature saves us so much time."</p>

                    <span className="font-medium">Google Play Store</span>              </div>

                    <NeomorphicButton className="text-sm px-3 py-1">Copy Link</NeomorphicButton>              <div className="p-4 bg-gray-50 rounded-lg">

                  </div>                <div className="flex items-center justify-between mb-2">

                  <p className="text-sm text-gray-500 break-all">https:</p>                  <div className="flex items-center space-x-2">

                </div>                    <span className="font-medium">Sarah M.</span>

                <div className="p-3 bg-gray-50 rounded-lg">                    <div className="flex">

                  <div className="flex items-center justify-between mb-2">                      {[...Array(4)].map((_, i) => (

                    <span className="font-medium">QR Code</span>                        <span key={i} className="text-yellow-400">⭐</span>

                    <NeomorphicButton onClick={generateQRCode} className="text-sm px-3 py-1">Generate</NeomorphicButton>                      ))}

                  </div>                    </div>

                  <p className="text-sm text-gray-500">Quick download via QR scanning</p>                  </div>

                </div>                  <span className="text-sm text-gray-500">1 week ago</span>

              </div>                </div>

            </NeomorphicCard>                <p className="text-gray-700">"Love the real-time notifications. Could use better offline support."</p>

              </div>

            <NeomorphicCard className="p-6">            </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Release Management</h3>          </NeomorphicCard>

              <div className="space-y-4">        </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">      )}

                  <div>

                    <h4 className="font-medium">Version 2.4.0 (Beta)</h4>      {activeTab === 'distribution' && (

                    <p className="text-sm text-gray-500">New offline mode and enhanced security</p>        <div className="space-y-6">

                  </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="flex space-x-2">            <NeomorphicCard className="p-6">

                    <NeomorphicButton className="text-sm">Test</NeomorphicButton>              <h3 className="text-lg font-semibold text-gray-800 mb-4">App Store Status</h3>

                    <NeomorphicButton className="text-sm">Deploy</NeomorphicButton>              <div className="space-y-4">

                  </div>                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">

                </div>                  <div className="flex items-center space-x-3">

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">                    <span className="text-xl">🍎</span>

                  <div>                    <div>

                    <h4 className="font-medium">Version 2.3.2 (Hotfix)</h4>                      <span className="font-medium">App Store</span>

                    <p className="text-sm text-gray-500">Critical bug fixes for notification system</p>                      <p className="text-sm text-gray-500">Version 2.3.1</p>

                  </div>                    </div>

                  <div className="flex space-x-2">                  </div>

                    <NeomorphicButton className="text-sm">Review</NeomorphicButton>                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Live</span>

                    <NeomorphicButton className="text-sm">Deploy</NeomorphicButton>                </div>

                  </div>                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">

                </div>                  <div className="flex items-center space-x-3">

              </div>                    <span className="text-xl">📱</span>

            </NeomorphicCard>                    <div>

          </div>                      <span className="font-medium">Google Play</span>

        </div>                      <p className="text-sm text-gray-500">Version 2.3.1</p>

      )}                    </div>

    </div>                  </div>

  );                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Live</span>

};                </div>

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
                  <p className="text-sm text-gray-500 break-all">https:</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Google Play Store</span>
                    <NeomorphicButton className="text-sm px-3 py-1">Copy Link</NeomorphicButton>
                  </div>
                  <p className="text-sm text-gray-500 break-all">https:</p>
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
