const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Mock automation data
const mockRules = [
  {
    id: '1',
    name: 'Auto Invoice Generation',
    description: 'Automatically generate invoices when bookings are completed',
    trigger: 'Booking Status: Completed',
    action: 'Generate Invoice + Send Email',
    status: 'active',
    executions: 1247,
    successRate: 98.5,
    lastRun: '2024-01-15 14:30',
    category: 'Finance',
    complexity: 'simple'
  },
  {
    id: '2',
    name: 'Smart Staff Scheduling',
    description: 'Optimize staff schedules based on booking patterns and availability',
    trigger: 'New Booking + Staff Availability',
    action: 'Auto-assign Staff + Update Schedule',
    status: 'active',
    executions: 892,
    successRate: 94.2,
    lastRun: '2024-01-15 12:15',
    category: 'Operations',
    complexity: 'advanced'
  },
  {
    id: '3',
    name: 'Inventory Alert System',
    description: 'Monitor inventory levels and auto-reorder critical items',
    trigger: 'Stock Level < Threshold',
    action: 'Create Purchase Order + Notify Manager',
    status: 'active',
    executions: 156,
    successRate: 100,
    lastRun: '2024-01-15 09:45',
    category: 'Inventory',
    complexity: 'medium'
  }
];

const mockTemplates = [
  {
    id: '1',
    name: 'Event Management Workflow',
    description: 'Complete automation for event lifecycle management',
    steps: 12,
    category: 'Operations',
    popularity: 85,
    estimatedSavings: '15 hours/week',
    icon: '🎪'
  },
  {
    id: '2',
    name: 'Customer Onboarding',
    description: 'Automated client registration and setup process',
    steps: 8,
    category: 'Customer Service',
    popularity: 92,
    estimatedSavings: '8 hours/week',
    icon: '👋'
  }
];

// @desc    Get automation rules
// @route   GET /api/automation/rules
// @access  Private (Chairman, Company Admin, Branch Head)
router.get('/rules', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { status, category } = req.query;
    let filteredRules = [...mockRules];
    
    if (status) {
      filteredRules = filteredRules.filter(rule => rule.status === status);
    }
    
    if (category) {
      filteredRules = filteredRules.filter(rule => rule.category === category);
    }
    
    res.status(200).json({
      success: true,
      count: filteredRules.length,
      data: filteredRules
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Create automation rule
// @route   POST /api/automation/rules
// @access  Private (Chairman, Company Admin, Branch Head)
router.post('/rules', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { name, description, trigger, action, category } = req.body;
    
    const newRule = {
      id: Date.now().toString(),
      name,
      description,
      trigger,
      action,
      status: 'draft',
      executions: 0,
      successRate: 0,
      lastRun: 'Never',
      category,
      complexity: 'simple',
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    };
    
    mockRules.push(newRule);
    
    res.status(201).json({
      success: true,
      data: newRule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Update automation rule
// @route   PUT /api/automation/rules/:id
// @access  Private (Chairman, Company Admin, Branch Head)
router.put('/rules/:id', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const ruleIndex = mockRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    
    mockRules[ruleIndex] = { ...mockRules[ruleIndex], ...updates };
    
    res.status(200).json({
      success: true,
      data: mockRules[ruleIndex]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Toggle rule status
// @route   POST /api/automation/rules/:id/toggle
// @access  Private (Chairman, Company Admin, Branch Head)
router.post('/rules/:id/toggle', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const ruleIndex = mockRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    
    mockRules[ruleIndex].status = mockRules[ruleIndex].status === 'active' ? 'inactive' : 'active';
    
    res.status(200).json({
      success: true,
      data: mockRules[ruleIndex]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Get automation templates
// @route   GET /api/automation/templates
// @access  Private (Chairman, Company Admin, Branch Head)
router.get('/templates', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: mockTemplates.length,
      data: mockTemplates
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Install template
// @route   POST /api/automation/templates/:id/install
// @access  Private (Chairman, Company Admin, Branch Head)
router.post('/templates/:id/install', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = mockTemplates.find(t => t.id === id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    // Simulate template installation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const installedWorkflow = {
      id: Date.now().toString(),
      templateId: id,
      name: `${template.name} - Installed`,
      status: 'installed',
      installedAt: new Date().toISOString(),
      installedBy: req.user.id
    };
    
    res.status(201).json({
      success: true,
      data: installedWorkflow
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Get automation statistics
// @route   GET /api/automation/stats
// @access  Private (Chairman, Company Admin, Branch Head)
router.get('/stats', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const stats = {
      activeRules: mockRules.filter(r => r.status === 'active').length,
      totalExecutions: mockRules.reduce((sum, rule) => sum + rule.executions, 0),
      averageSuccessRate: mockRules.reduce((sum, rule) => sum + rule.successRate, 0) / mockRules.length,
      timeSaved: 127, // hours
      costReduction: 8450, // dollars
      efficiencyGain: 34 // percentage
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

// @desc    Get AI recommendations for automation
// @route   GET /api/automation/ai-recommendations
// @access  Private (Chairman, Company Admin, Branch Head)
router.get('/ai-recommendations', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const recommendations = [
      {
        id: '1',
        title: 'Optimize Invoice Timing',
        description: 'Sending invoices on Tuesdays increases payment speed by 23%',
        type: 'optimization',
        confidence: 87,
        estimatedImpact: 'high'
      },
      {
        id: '2',
        title: 'New Automation Opportunity',
        description: 'Automate client satisfaction surveys after event completion',
        type: 'new_automation',
        confidence: 92,
        estimatedImpact: 'medium'
      }
    ];
    
    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Execute rule manually
// @route   POST /api/automation/rules/:id/execute
// @access  Private (Chairman, Company Admin, Branch Head)
router.post('/rules/:id/execute', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const rule = mockRules.find(r => r.id === id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    
    // Simulate rule execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const execution = {
      id: Date.now().toString(),
      ruleId: id,
      status: 'success',
      executedAt: new Date().toISOString(),
      executedBy: req.user.id,
      duration: Math.floor(Math.random() * 2000) + 500 // 500-2500ms
    };
    
    res.status(200).json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
