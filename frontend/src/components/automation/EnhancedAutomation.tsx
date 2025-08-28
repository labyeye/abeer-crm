import React, { useState, useEffect } from 'react';
import NeomorphicCard from '../ui/NeomorphicCard';
import NeomorphicButton from '../ui/NeomorphicButton';
import NeomorphicModal from '../ui/NeomorphicModal';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  status: 'active' | 'inactive' | 'draft';
  executions: number;
  successRate: number;
  lastRun: string;
  category: string;
  complexity: 'simple' | 'medium' | 'advanced';
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: number;
  category: string;
  popularity: number;
  estimatedSavings: string;
  icon: string;
}

export const EnhancedAutomation: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'workflows' | 'insights'>('rules');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, setSelectedRule] = useState<AutomationRule | null>(null);

  useEffect(() => {
    loadAutomationData();
  }, []);

  const loadAutomationData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRules([
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
        },
        {
          id: '4',
          name: 'Client Follow-up Automation',
          description: 'Automatically send follow-up messages based on client interaction',
          trigger: 'Event Completion + Time Delay',
          action: 'Send Personalized Follow-up + Survey',
          status: 'active',
          executions: 2341,
          successRate: 87.6,
          lastRun: '2024-01-15 16:20',
          category: 'Marketing',
          complexity: 'medium'
        },
        {
          id: '5',
          name: 'Dynamic Pricing Engine',
          description: 'Adjust pricing based on demand, season, and competition',
          trigger: 'Market Conditions + Demand Analysis',
          action: 'Update Pricing + Notify Sales Team',
          status: 'draft',
          executions: 0,
          successRate: 0,
          lastRun: 'Never',
          category: 'Finance',
          complexity: 'advanced'
        }
      ]);

      setTemplates([
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
        },
        {
          id: '3',
          name: 'Financial Reporting Suite',
          description: 'Automated financial reports and analytics generation',
          steps: 6,
          category: 'Finance',
          popularity: 78,
          estimatedSavings: '12 hours/week',
          icon: '📊'
        },
        {
          id: '4',
          name: 'Quality Assurance Pipeline',
          description: 'Automated quality checks and compliance monitoring',
          steps: 10,
          category: 'Quality',
          popularity: 65,
          estimatedSavings: '20 hours/week',
          icon: '✅'
        }
      ]);
    } catch (error) {
      console.error('Failed to load automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const toggleRuleStatus = (ruleId: string) => {
    setRules(prevRules => 
      prevRules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive' }
          : rule
      )
    );
  };

  const createNewRule = () => {
    setShowCreateModal(true);
  };

  const installTemplate = (templateId: string) => {
    alert(`Installing template: ${templates.find(t => t.id === templateId)?.name}`);
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
          <h1 className="text-3xl font-bold text-gray-800">Enhanced Automation</h1>
          <p className="text-gray-600 mt-2">Advanced workflow automation and intelligent process optimization</p>
        </div>
        <div className="flex space-x-3">
          <NeomorphicButton onClick={createNewRule} className="flex items-center space-x-2">
            <span>➕</span>
            <span>Create Rule</span>
          </NeomorphicButton>
          <NeomorphicButton className="flex items-center space-x-2">
            <span>🤖</span>
            <span>AI Assistant</span>
          </NeomorphicButton>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <NeomorphicCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Rules</p>
              <p className="text-2xl font-bold text-gray-800">{rules.filter(r => r.status === 'active').length}</p>
              <p className="text-green-600 text-sm">+2 this week</p>
            </div>
            <span className="text-3xl">⚙️</span>
          </div>
        </NeomorphicCard>

        <NeomorphicCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Executions</p>
              <p className="text-2xl font-bold text-gray-800">{rules.reduce((sum, rule) => sum + rule.executions, 0).toLocaleString()}</p>
              <p className="text-green-600 text-sm">+15% this month</p>
            </div>
            <span className="text-3xl">🔄</span>
          </div>
        </NeomorphicCard>

        <NeomorphicCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-gray-800">
                {(rules.reduce((sum, rule) => sum + rule.successRate, 0) / rules.filter(r => r.executions > 0).length).toFixed(1)}%
              </p>
              <p className="text-green-600 text-sm">+2.3% this month</p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </NeomorphicCard>

        <NeomorphicCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Time Saved</p>
              <p className="text-2xl font-bold text-gray-800">127h</p>
              <p className="text-green-600 text-sm">This month</p>
            </div>
            <span className="text-3xl">⏰</span>
          </div>
        </NeomorphicCard>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
        {[
          { key: 'rules', label: 'Automation Rules', icon: '⚙️' },
          { key: 'templates', label: 'Templates', icon: '📋' },
          { key: 'workflows', label: 'Workflows', icon: '🔄' },
          { key: 'insights', label: 'AI Insights', icon: '🤖' }
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
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {rules.map((rule) => (
              <NeomorphicCard key={rule.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-800">{rule.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rule.status)}`}>
                        {rule.status.toUpperCase()}
                      </span>
                      <span className={`text-xs font-medium ${getComplexityColor(rule.complexity)}`}>
                        {rule.complexity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{rule.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Trigger: </span>
                        <span className="text-gray-700">{rule.trigger}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Action: </span>
                        <span className="text-gray-700">{rule.action}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <NeomorphicButton
                      onClick={() => toggleRuleStatus(rule.id)}
                      className={`text-sm px-3 py-1 ${rule.status === 'active' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                    >
                      {rule.status === 'active' ? 'Pause' : 'Activate'}
                    </NeomorphicButton>
                    <NeomorphicButton onClick={() => setSelectedRule(rule)} className="text-sm px-3 py-1">
                      Edit
                    </NeomorphicButton>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{rule.executions.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Executions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{rule.successRate}%</p>
                    <p className="text-sm text-gray-500">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-800">{rule.lastRun}</p>
                    <p className="text-sm text-gray-500">Last Run</p>
                  </div>
                </div>
              </NeomorphicCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <NeomorphicCard key={template.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{template.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">{template.popularity}%</p>
                    <p className="text-xs text-gray-500">Popularity</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{template.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Steps</p>
                    <p className="font-medium text-gray-800">{template.steps}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Est. Savings</p>
                    <p className="font-medium text-green-600">{template.estimatedSavings}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <NeomorphicButton 
                    onClick={() => installTemplate(template.id)}
                    className="flex-1"
                  >
                    Install Template
                  </NeomorphicButton>
                  <NeomorphicButton className="px-3">
                    👁️
                  </NeomorphicButton>
                </div>
              </NeomorphicCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Visual Workflow Builder</h3>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <span className="text-6xl mb-4 block">🔧</span>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Drag & Drop Workflow Builder</h4>
              <p className="text-gray-600 mb-4">Create complex automation workflows with our visual builder</p>
              <NeomorphicButton>Launch Builder</NeomorphicButton>
            </div>
          </NeomorphicCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Workflows</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Event Planning Workflow</h4>
                    <p className="text-sm text-gray-500">12 steps • Running</p>
                  </div>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Customer Support Pipeline</h4>
                    <p className="text-sm text-gray-500">8 steps • Running</p>
                  </div>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Invoice Processing</h4>
                    <p className="text-sm text-gray-500">6 steps • Paused</p>
                  </div>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                </div>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Workflow Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Workflows</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active</span>
                  <span className="font-semibold text-green-600">9</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg. Execution Time</span>
                  <span className="font-semibold">2.3s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">98.2%</span>
                </div>
              </div>
            </NeomorphicCard>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Recommendations</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">🤖</span>
                    <h4 className="font-medium">Optimize Invoice Timing</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Sending invoices on Tuesdays increases payment speed by 23%
                  </p>
                  <NeomorphicButton className="text-sm">Apply Suggestion</NeomorphicButton>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">💡</span>
                    <h4 className="font-medium">New Automation Opportunity</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Automate client satisfaction surveys after event completion
                  </p>
                  <NeomorphicButton className="text-sm">Create Rule</NeomorphicButton>
                </div>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Automation Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">System Performance</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">95%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rule Efficiency</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">88%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Error Rate</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '3%' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">3%</span>
                  </div>
                </div>
              </div>
            </NeomorphicCard>
          </div>

          <NeomorphicCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Automation Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">⏱️</div>
                <h4 className="font-semibold text-gray-800">Time Saved</h4>
                <p className="text-2xl font-bold text-green-600">127 hours</p>
                <p className="text-sm text-gray-500">This month</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">💰</div>
                <h4 className="font-semibold text-gray-800">Cost Reduction</h4>
                <p className="text-2xl font-bold text-green-600">$8,450</p>
                <p className="text-sm text-gray-500">This month</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📈</div>
                <h4 className="font-semibold text-gray-800">Efficiency Gain</h4>
                <p className="text-2xl font-bold text-blue-600">34%</p>
                <p className="text-sm text-gray-500">Overall improvement</p>
              </div>
            </div>
          </NeomorphicCard>
        </div>
      )}

      {/* Create Rule Modal */}
      <NeomorphicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Automation Rule"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter rule name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe what this rule does"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trigger</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Select trigger type</option>
                <option>Booking Created</option>
                <option>Payment Received</option>
                <option>Staff Check-in</option>
                <option>Inventory Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Select action type</option>
                <option>Send Email</option>
                <option>Create Task</option>
                <option>Update Record</option>
                <option>Generate Document</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <NeomorphicButton onClick={() => setShowCreateModal(false)}>
              Cancel
            </NeomorphicButton>
            <NeomorphicButton onClick={() => setShowCreateModal(false)}>
              Create Rule
            </NeomorphicButton>
          </div>
        </div>
      </NeomorphicModal>
    </div>
  );
};
