import React, { useState, useEffect } from 'react';
import NeomorphicCard from '../ui/NeomorphicCard';
import NeomorphicButton from '../ui/NeomorphicButton';
import NeomorphicModal from '../ui/NeomorphicModal';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  lastSync: string;
  dataFlow: 'bidirectional' | 'inbound' | 'outbound';
  icon: string;
  provider: string;
  version: string;
}

interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  status: 'active' | 'inactive';
  calls: number;
  avgResponseTime: number;
  lastUsed: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  deliveries: number;
  successRate: number;
}

export const SystemIntegration: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'integrations' | 'api' | 'webhooks' | 'marketplace'>('integrations');
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIntegrations([
        {
          id: '1',
          name: 'QuickBooks',
          description: 'Accounting and financial management integration',
          category: 'Finance',
          status: 'connected',
          lastSync: '2024-01-15 14:30',
          dataFlow: 'bidirectional',
          icon: '💰',
          provider: 'Intuit',
          version: '2.3.1'
        },
        {
          id: '2',
          name: 'WhatsApp Business',
          description: 'Client communication and messaging platform',
          category: 'Communication',
          status: 'connected',
          lastSync: '2024-01-15 16:45',
          dataFlow: 'bidirectional',
          icon: '💬',
          provider: 'Meta',
          version: '1.8.2'
        },
        {
          id: '3',
          name: 'Google Calendar',
          description: 'Event scheduling and calendar synchronization',
          category: 'Productivity',
          status: 'connected',
          lastSync: '2024-01-15 12:15',
          dataFlow: 'bidirectional',
          icon: '📅',
          provider: 'Google',
          version: '3.1.0'
        },
        {
          id: '4',
          name: 'Stripe',
          description: 'Payment processing and subscription management',
          category: 'Finance',
          status: 'connected',
          lastSync: '2024-01-15 15:20',
          dataFlow: 'bidirectional',
          icon: '💳',
          provider: 'Stripe Inc.',
          version: '2024.1.0'
        },
        {
          id: '5',
          name: 'Twilio',
          description: 'SMS and voice communication services',
          category: 'Communication',
          status: 'error',
          lastSync: '2024-01-14 09:30',
          dataFlow: 'outbound',
          icon: '📱',
          provider: 'Twilio',
          version: '4.2.1'
        },
        {
          id: '6',
          name: 'Salesforce',
          description: 'CRM and customer relationship management',
          category: 'CRM',
          status: 'configuring',
          lastSync: 'Never',
          dataFlow: 'bidirectional',
          icon: '☁️',
          provider: 'Salesforce',
          version: '2024.1'
        }
      ]);

      setApiEndpoints([
        {
          id: '1',
          name: 'Get Bookings',
          method: 'GET',
          url: '/api/bookings',
          status: 'active',
          calls: 15420,
          avgResponseTime: 245,
          lastUsed: '2024-01-15 16:50'
        },
        {
          id: '2',
          name: 'Create Client',
          method: 'POST',
          url: '/api/clients',
          status: 'active',
          calls: 3240,
          avgResponseTime: 180,
          lastUsed: '2024-01-15 15:30'
        },
        {
          id: '3',
          name: 'Update Inventory',
          method: 'PUT',
          url: '/api/inventory/:id',
          status: 'active',
          calls: 8900,
          avgResponseTime: 320,
          lastUsed: '2024-01-15 14:20'
        },
        {
          id: '4',
          name: 'Delete Staff Member',
          method: 'DELETE',
          url: '/api/staff/:id',
          status: 'inactive',
          calls: 125,
          avgResponseTime: 150,
          lastUsed: '2024-01-10 11:15'
        }
      ]);

      setWebhooks([
        {
          id: '1',
          name: 'Payment Webhook',
          url: 'https://api.abeer-crm.com/webhooks/payment',
          events: ['payment.completed', 'payment.failed'],
          status: 'active',
          deliveries: 2340,
          successRate: 98.5
        },
        {
          id: '2',
          name: 'Booking Webhook',
          url: 'https://api.abeer-crm.com/webhooks/booking',
          events: ['booking.created', 'booking.updated', 'booking.cancelled'],
          status: 'active',
          deliveries: 5670,
          successRate: 97.2
        },
        {
          id: '3',
          name: 'Inventory Alert',
          url: 'https://api.abeer-crm.com/webhooks/inventory',
          events: ['inventory.low', 'inventory.reorder'],
          status: 'inactive',
          deliveries: 890,
          successRate: 95.8
        }
      ]);
    } catch (error) {
      console.error('Failed to load integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': case 'active': return 'text-green-600 bg-green-100';
      case 'disconnected': case 'inactive': return 'text-red-600 bg-red-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'configuring': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-600 bg-green-100';
      case 'POST': return 'text-blue-600 bg-blue-100';
      case 'PUT': return 'text-yellow-600 bg-yellow-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleIntegration = (integrationId: string) => {
    setIntegrations(prevIntegrations =>
      prevIntegrations.map(integration =>
        integration.id === integrationId
          ? {
              ...integration,
              status: integration.status === 'connected' ? 'disconnected' : 'connected' as 'connected' | 'disconnected'
            }
          : integration
      )
    );
  };

  const syncIntegration = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    alert(`Syncing ${integration?.name}...`);
  };

  const testWebhook = (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    alert(`Testing webhook: ${webhook?.name}`);
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
      {}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">System Integration</h1>
          <p className="text-gray-600 mt-2">Manage external integrations, APIs, and webhooks</p>
        </div>
        <div className="flex space-x-3">
          <NeomorphicButton onClick={() => setShowIntegrationModal(true)} className="flex items-center space-x-2">
            <span>🔗</span>
            <span>Add Integration</span>
          </NeomorphicButton>
          <NeomorphicButton className="flex items-center space-x-2">
            <span>📖</span>
            <span>API Docs</span>
          </NeomorphicButton>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NeomorphicCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Integrations</p>
              <p className="text-2xl font-bold text-gray-800">{integrations.filter(i => i.status === 'connected').length}</p>
              <p className="text-green-600 text-sm">+1 this week</p>
            </div>
            <span className="text-3xl">🔗</span>
          </div>
        </NeomorphicCard>

        <NeomorphicCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">API Calls Today</p>
              <p className="text-2xl font-bold text-gray-800">27,785</p>
              <p className="text-green-600 text-sm">+8% from yesterday</p>
            </div>
            <span className="text-3xl">⚡</span>
          </div>
        </NeomorphicCard>

        <NeomorphicCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Webhook Deliveries</p>
              <p className="text-2xl font-bold text-gray-800">8,900</p>
              <p className="text-green-600 text-sm">97.2% success rate</p>
            </div>
            <span className="text-3xl">🎯</span>
          </div>
        </NeomorphicCard>

        <NeomorphicCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">System Health</p>
              <p className="text-2xl font-bold text-green-600">99.8%</p>
              <p className="text-green-600 text-sm">All systems operational</p>
            </div>
            <span className="text-3xl">💚</span>
          </div>
        </NeomorphicCard>
      </div>

      {}
      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
        {[
          { key: 'integrations', label: 'Integrations', icon: '🔗' },
          { key: 'api', label: 'API Endpoints', icon: '⚡' },
          { key: 'webhooks', label: 'Webhooks', icon: '🎯' },
          { key: 'marketplace', label: 'Marketplace', icon: '🏪' }
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

      {}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((integration) => (
              <NeomorphicCard key={integration.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{integration.name}</h3>
                      <p className="text-sm text-gray-500">{integration.provider} • v{integration.version}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                    {integration.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{integration.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Category: </span>
                    <span className="text-gray-700">{integration.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Data Flow: </span>
                    <span className="text-gray-700 capitalize">{integration.dataFlow}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Last Sync: </span>
                    <span className="text-gray-700">{integration.lastSync}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <NeomorphicButton
                    onClick={() => toggleIntegration(integration.id)}
                    className={`flex-1 text-sm ${
                      integration.status === 'connected' 
                        ? 'bg-red-50 text-red-600' 
                        : 'bg-green-50 text-green-600'
                    }`}
                  >
                    {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </NeomorphicButton>
                  <NeomorphicButton 
                    onClick={() => syncIntegration(integration.id)}
                    className="px-3 text-sm"
                    disabled={integration.status !== 'connected'}
                  >
                    🔄
                  </NeomorphicButton>
                  <NeomorphicButton className="px-3 text-sm">
                    ⚙️
                  </NeomorphicButton>
                </div>
              </NeomorphicCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="space-y-6">
          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">API Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">27,785</p>
                <p className="text-sm text-gray-500">Requests Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">99.2%</p>
                <p className="text-sm text-gray-500">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">245ms</p>
                <p className="text-sm text-gray-500">Avg Response Time</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">12</p>
                <p className="text-sm text-gray-500">Active Endpoints</p>
              </div>
            </div>
          </NeomorphicCard>

          <div className="grid grid-cols-1 gap-4">
            {apiEndpoints.map((endpoint) => (
              <NeomorphicCard key={endpoint.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-800">{endpoint.name}</h4>
                      <p className="text-sm text-gray-500 font-mono">{endpoint.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-800">{endpoint.calls.toLocaleString()}</p>
                      <p className="text-gray-500">Calls</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-800">{endpoint.avgResponseTime}ms</p>
                      <p className="text-gray-500">Avg Time</p>
                    </div>
                    <div className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(endpoint.status)}`}>
                        {endpoint.status.toUpperCase()}
                      </span>
                    </div>
                    <NeomorphicButton className="text-sm px-3 py-1">
                      Test
                    </NeomorphicButton>
                  </div>
                </div>
              </NeomorphicCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {webhooks.map((webhook) => (
              <NeomorphicCard key={webhook.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-800">{webhook.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(webhook.status)}`}>
                        {webhook.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-mono mb-3">{webhook.url}</p>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <NeomorphicButton 
                      onClick={() => testWebhook(webhook.id)}
                      className="text-sm px-3 py-1"
                    >
                      Test
                    </NeomorphicButton>
                    <NeomorphicButton className="text-sm px-3 py-1">
                      Edit
                    </NeomorphicButton>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{webhook.deliveries.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total Deliveries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{webhook.successRate}%</p>
                    <p className="text-sm text-gray-500">Success Rate</p>
                  </div>
                </div>
              </NeomorphicCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {}
            <NeomorphicCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">📧</span>
                <div>
                  <h3 className="font-semibold text-gray-800">Mailchimp</h3>
                  <p className="text-sm text-gray-500">Email Marketing Platform</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">Automate email campaigns and manage subscriber lists.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-medium">FREE</span>
                <NeomorphicButton className="text-sm">Install</NeomorphicButton>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="font-semibold text-gray-800">Tableau</h3>
                  <p className="text-sm text-gray-500">Data Visualization</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">Create advanced data visualizations and dashboards.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">PREMIUM</span>
                <NeomorphicButton className="text-sm">Install</NeomorphicButton>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="font-semibold text-gray-800">Slack</h3>
                  <p className="text-sm text-gray-500">Team Communication</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">Get notifications and updates directly in Slack channels.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-medium">FREE</span>
                <NeomorphicButton className="text-sm">Install</NeomorphicButton>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">☁️</span>
                <div>
                  <h3 className="font-semibold text-gray-800">Dropbox</h3>
                  <p className="text-sm text-gray-500">Cloud Storage</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">Automatically backup and sync files to cloud storage.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-medium">FREE</span>
                <NeomorphicButton className="text-sm">Install</NeomorphicButton>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">🔐</span>
                <div>
                  <h3 className="font-semibold text-gray-800">Auth0</h3>
                  <p className="text-sm text-gray-500">Identity Management</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">Enhanced security with multi-factor authentication.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">PREMIUM</span>
                <NeomorphicButton className="text-sm">Install</NeomorphicButton>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">📈</span>
                <div>
                  <h3 className="font-semibold text-gray-800">Google Analytics</h3>
                  <p className="text-sm text-gray-500">Web Analytics</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">Track website performance and user behavior.</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-medium">FREE</span>
                <NeomorphicButton className="text-sm">Install</NeomorphicButton>
              </div>
            </NeomorphicCard>
          </div>
        </div>
      )}

      {}
      <NeomorphicModal
        isOpen={showIntegrationModal}
        onClose={() => setShowIntegrationModal(false)}
        title="Add New Integration"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Integration Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Select integration type</option>
              <option>Payment Gateway</option>
              <option>Email Service</option>
              <option>Communication Platform</option>
              <option>Cloud Storage</option>
              <option>Analytics Service</option>
              <option>Custom API</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter service name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Endpoint</label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://api.example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Authentication</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>API Key</option>
              <option>OAuth 2.0</option>
              <option>Basic Auth</option>
              <option>Bearer Token</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <NeomorphicButton onClick={() => setShowIntegrationModal(false)}>
              Cancel
            </NeomorphicButton>
            <NeomorphicButton onClick={() => setShowIntegrationModal(false)}>
              Add Integration
            </NeomorphicButton>
          </div>
        </div>
      </NeomorphicModal>
    </div>
  );
};
