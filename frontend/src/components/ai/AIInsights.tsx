import React, { useState, useEffect } from 'react';
import NeomorphicCard from '../ui/NeomorphicCard';
import NeomorphicButton from '../ui/NeomorphicButton';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'anomaly' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  actionable: boolean;
  createdAt: string;
}

interface PredictionData {
  revenue: { current: number; predicted: number; change: number };
  bookings: { current: number; predicted: number; change: number };
  clientSatisfaction: { current: number; predicted: number; trend: 'up' | 'down' | 'stable' };
  efficiency: { current: number; predicted: number; change: number };
}

export const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions' | 'recommendations'>('insights');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setInsights([
        {
          id: '1',
          type: 'prediction',
          title: 'Revenue Growth Prediction',
          description: 'Based on current trends, revenue is expected to increase by 23% next quarter.',
          confidence: 87,
          impact: 'high',
          category: 'Financial',
          actionable: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'anomaly',
          title: 'Unusual Booking Pattern Detected',
          description: 'Event bookings have decreased by 15% in the last 2 weeks, unusual for this time of year.',
          confidence: 92,
          impact: 'medium',
          category: 'Operations',
          actionable: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          type: 'recommendation',
          title: 'Staff Optimization Opportunity',
          description: 'Consider redistributing 3 staff members to high-demand periods to increase efficiency.',
          confidence: 78,
          impact: 'medium',
          category: 'Human Resources',
          actionable: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          type: 'trend',
          title: 'Client Retention Improving',
          description: 'Client retention rate has improved by 8% over the last quarter.',
          confidence: 95,
          impact: 'high',
          category: 'Customer',
          actionable: false,
          createdAt: new Date().toISOString(),
        },
      ]);

      setPredictions({
        revenue: { current: 67000, predicted: 82410, change: 23 },
        bookings: { current: 67, predicted: 82, change: 22 },
        clientSatisfaction: { current: 4.2, predicted: 4.5, trend: 'up' },
        efficiency: { current: 78, predicted: 90, change: 15 }
      });
    } catch (error) {
      console.error('Failed to load AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshInsights = async () => {
    setRefreshing(true);
    await loadAIData();
    setRefreshing(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return '🔮';
      case 'recommendation': return '💡';
      case 'anomaly': return '⚠️';
      case 'trend': return '📈';
      default: return '🤖';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
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
          <h1 className="text-3xl font-bold text-gray-800">AI Insights & Predictions</h1>
          <p className="text-gray-600 mt-2">AI-powered business intelligence and forecasting</p>
        </div>
        <NeomorphicButton
          onClick={refreshInsights}
          disabled={refreshing}
          className="flex items-center space-x-2"
        >
          <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
          <span>Refresh</span>
        </NeomorphicButton>
      </div>

      {}
      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
        {[
          { key: 'insights' as const, label: 'AI Insights', icon: '🤖' },
          { key: 'predictions' as const, label: 'Predictions', icon: '🔮' },
          { key: 'recommendations' as const, label: 'Recommendations', icon: '💡' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight) => (
            <NeomorphicCard key={insight.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{insight.title}</h3>
                    <span className="text-sm text-gray-500 capitalize">{insight.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${getImpactColor(insight.impact)}`}>
                    {insight.impact.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500">{insight.confidence}% confidence</div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{insight.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${insight.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">{insight.confidence}%</span>
                </div>
                {insight.actionable && (
                  <NeomorphicButton className="text-sm px-3 py-1">
                    Take Action
                  </NeomorphicButton>
                )}
              </div>
            </NeomorphicCard>
          ))}
        </div>
      )}

      {activeTab === 'predictions' && predictions && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Revenue</h3>
                <span className="text-2xl">💰</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current</span>
                  <span className="font-semibold">${predictions.revenue.current.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Predicted</span>
                  <span className="font-semibold text-green-600">${predictions.revenue.predicted.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Change</span>
                  <span className="font-semibold text-green-600">+{predictions.revenue.change}%</span>
                </div>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Bookings</h3>
                <span className="text-2xl">📅</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current</span>
                  <span className="font-semibold">{predictions.bookings.current}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Predicted</span>
                  <span className="font-semibold text-green-600">{predictions.bookings.predicted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Change</span>
                  <span className="font-semibold text-green-600">+{predictions.bookings.change}%</span>
                </div>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Satisfaction</h3>
                <span className="text-2xl">😊</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current</span>
                  <span className="font-semibold">{predictions.clientSatisfaction.current}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Predicted</span>
                  <span className="font-semibold text-green-600">{predictions.clientSatisfaction.predicted}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trend</span>
                  <span className="font-semibold text-green-600">
                    {predictions.clientSatisfaction.trend === 'up' ? '↗️ Up' : 
                     predictions.clientSatisfaction.trend === 'down' ? '↘️ Down' : '→ Stable'}
                  </span>
                </div>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Efficiency</h3>
                <span className="text-2xl">⚡</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current</span>
                  <span className="font-semibold">{predictions.efficiency.current}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Predicted</span>
                  <span className="font-semibold text-green-600">{predictions.efficiency.predicted}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Change</span>
                  <span className="font-semibold text-green-600">+{predictions.efficiency.change}%</span>
                </div>
              </div>
            </NeomorphicCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Assessment</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Market Risk</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Low</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Operational Risk</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Very Low</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Financial Risk</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Medium</span>
                  </div>
                </div>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Confidence Scores</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Revenue Prediction</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">87%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Booking Forecast</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">92%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Client Analysis</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">78%</span>
                  </div>
                </div>
              </div>
            </NeomorphicCard>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.filter(insight => insight.type === 'recommendation').map((recommendation) => (
              <NeomorphicCard key={recommendation.id} className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl">💡</span>
                  <h3 className="font-semibold text-gray-800">{recommendation.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{recommendation.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${getImpactColor(recommendation.impact)}`}>
                    {recommendation.impact.toUpperCase()} IMPACT
                  </span>
                  <NeomorphicButton className="text-sm px-3 py-1">
                    Implement
                  </NeomorphicButton>
                </div>
              </NeomorphicCard>
            ))}

            {}
            <NeomorphicCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">🎯</span>
                <h3 className="font-semibold text-gray-800">Marketing Optimization</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Focus marketing efforts on corporate events which show 34% higher conversion rates.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600">HIGH IMPACT</span>
                <NeomorphicButton className="text-sm px-3 py-1">Implement</NeomorphicButton>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">⚡</span>
                <h3 className="font-semibold text-gray-800">Process Automation</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Automate invoice generation to reduce processing time by 67% and eliminate errors.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600">HIGH IMPACT</span>
                <NeomorphicButton className="text-sm px-3 py-1">Implement</NeomorphicButton>
              </div>
            </NeomorphicCard>

            <NeomorphicCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">📊</span>
                <h3 className="font-semibold text-gray-800">Inventory Optimization</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Adjust inventory levels based on seasonal patterns to reduce holding costs by 25%.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-600">MEDIUM IMPACT</span>
                <NeomorphicButton className="text-sm px-3 py-1">Implement</NeomorphicButton>
              </div>
            </NeomorphicCard>
          </div>
        </div>
      )}
    </div>
  );
};
