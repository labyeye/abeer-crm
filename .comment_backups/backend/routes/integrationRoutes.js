const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Mock integration data
const mockIntegrations = [
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
    name: 'Stripe',
    description: 'Payment processing and subscription management',
    category: 'Finance',
    status: 'connected',
    lastSync: '2024-01-15 15:20',
    dataFlow: 'bidirectional',
    icon: '💳',
    provider: 'Stripe Inc.',
    version: '2024.1.0'
  }
];

const mockApiEndpoints = [
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
  }
];

const mockWebhooks = [
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
  }
];

// @desc    Get all integrations
// @route   GET /api/integrations
// @access  Private (Chairman, Company Admin, Branch Head)
router.get('/', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { status, category } = req.query;
    let filteredIntegrations = [...mockIntegrations];
    
    if (status) {
      filteredIntegrations = filteredIntegrations.filter(integration => integration.status === status);
    }
    
    if (category) {
      filteredIntegrations = filteredIntegrations.filter(integration => integration.category === category);
    }
    
    res.status(200).json({
      success: true,
      count: filteredIntegrations.length,
      data: filteredIntegrations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Create new integration
// @route   POST /api/integrations
// @access  Private (Chairman, Company Admin, Branch Head)
router.post('/', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { name, description, category, provider, apiEndpoint, authType } = req.body;
    
    const newIntegration = {
      id: Date.now().toString(),
      name,
      description,
      category,
      status: 'configuring',
      lastSync: 'Never',
      dataFlow: 'bidirectional',
      icon: '🔗',
      provider,
      version: '1.0.0',
      apiEndpoint,
      authType,
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    };
    
    mockIntegrations.push(newIntegration);
    
    res.status(201).json({
      success: true,
      data: newIntegration
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Update integration
// @route   PUT /api/integrations/:id
// @access  Private (Chairman, Company Admin, Branch Head)
router.put('/:id', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const integrationIndex = mockIntegrations.findIndex(integration => integration.id === id);
    if (integrationIndex === -1) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }
    
    mockIntegrations[integrationIndex] = { ...mockIntegrations[integrationIndex], ...updates };
    
    res.status(200).json({
      success: true,
      data: mockIntegrations[integrationIndex]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Toggle integration status
// @route   POST /api/integrations/:id/toggle
// @access  Private (Chairman, Company Admin, Branch Head)
router.post('/:id/toggle', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const integrationIndex = mockIntegrations.findIndex(integration => integration.id === id);
    if (integrationIndex === -1) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }
    
    const currentStatus = mockIntegrations[integrationIndex].status;
    mockIntegrations[integrationIndex].status = currentStatus === 'connected' ? 'disconnected' : 'connected';
    
    if (mockIntegrations[integrationIndex].status === 'connected') {
      mockIntegrations[integrationIndex].lastSync = new Date().toISOString();
    }
    
    res.status(200).json({
      success: true,
      data: mockIntegrations[integrationIndex]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Sync integration
// @route   POST /api/integrations/:id/sync
// @access  Private (Chairman, Company Admin, Branch Head)
router.post('/:id/sync', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = mockIntegrations.find(integration => integration.id === id);
    if (!integration) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }
    
    if (integration.status !== 'connected') {
      return res.status(400).json({ success: false, message: 'Integration is not connected' });
    }
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    integration.lastSync = new Date().toISOString();
    
    const syncResult = {
      id: Date.now().toString(),
      integrationId: id,
      status: 'success',
      recordsSynced: Math.floor(Math.random() * 500) + 100,
      syncedAt: integration.lastSync,
      duration: Math.floor(Math.random() * 5000) + 1000 // 1-6 seconds
    };
    
    res.status(200).json({
      success: true,
      data: syncResult
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Get API endpoints
// @route   GET /api/integrations/api/endpoints
// @access  Private (Chairman, Company Admin, Branch Head)
router.get('/api/endpoints', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: mockApiEndpoints.length,
      data: mockApiEndpoints
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Get API statistics
// @route   GET /api/integrations/api/stats
// @access  Private (Chairman, Company Admin, Branch Head)
router.get('/api/stats', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const stats = {
      totalRequests: mockApiEndpoints.reduce((sum, endpoint) => sum + endpoint.calls, 0),
      successRate: 99.2,
      avgResponseTime: mockApiEndpoints.reduce((sum, endpoint) => sum + endpoint.avgResponseTime, 0) / mockApiEndpoints.length,
      activeEndpoints: mockApiEndpoints.filter(endpoint => endpoint.status === 'active').length
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Test API endpoint
// @route   POST /api/integrations/api/endpoints/:id/test
// @access  Private (Chairman, Company Admin, Branch Head)
router.post('/api/endpoints/:id/test', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const endpoint = mockApiEndpoints.find(endpoint => endpoint.id === id);
    if (!endpoint) {
      return res.status(404).json({ success: false, message: 'Endpoint not found' });
    }
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const testResult = {
      endpointId: id,
      status: 'success',
      responseTime: Math.floor(Math.random() * 500) + 100,
      statusCode: 200,
      testedAt: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Get webhooks
// @route   GET /api/integrations/webhooks
// @access  Private (Chairman, Company Admin, Branch Head)
router.get('/webhooks', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: mockWebhooks.length,
      data: mockWebhooks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Test webhook
// @route   POST /api/integrations/webhooks/:id/test
// @access  Private (Chairman, Company Admin, Branch Head)
router.post('/webhooks/:id/test', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const webhook = mockWebhooks.find(webhook => webhook.id === id);
    if (!webhook) {
      return res.status(404).json({ success: false, message: 'Webhook not found' });
    }
    
    // Simulate webhook test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const testResult = {
      webhookId: id,
      status: 'success',
      responseTime: Math.floor(Math.random() * 300) + 50,
      testedAt: new Date().toISOString(),
      payload: { test: true, timestamp: new Date().toISOString() }
    };
    
    res.status(200).json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Get integration statistics
// @route   GET /api/integrations/stats
// @access  Private (Chairman, Company Admin, Branch Head)
router.get('/stats', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const stats = {
      totalIntegrations: mockIntegrations.length,
      activeIntegrations: mockIntegrations.filter(i => i.status === 'connected').length,
      totalApiCalls: 27785,
      webhookDeliveries: 8900,
      systemHealth: 99.8
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
