const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');


const mockInsights = [
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
  }
];

const mockPredictions = {
  revenue: { current: 67000, predicted: 82410, change: 23 },
  bookings: { current: 67, predicted: 82, change: 22 },
  clientSatisfaction: { current: 4.2, predicted: 4.5, trend: 'up' },
  efficiency: { current: 78, predicted: 90, change: 15 }
};




router.get('/insights', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.status(200).json({
      success: true,
      count: mockInsights.length,
      data: mockInsights
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.get('/predictions', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    res.status(200).json({
      success: true,
      data: mockPredictions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.post('/generate', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { type, category } = req.body;
    
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newInsight = {
      id: Date.now().toString(),
      type: type || 'recommendation',
      title: 'AI Generated Insight',
      description: `New ${type} generated based on latest data analysis.`,
      confidence: Math.floor(Math.random() * 30) + 70, 
      impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      category: category || 'General',
      actionable: true,
      createdAt: new Date().toISOString(),
    };
    
    res.status(201).json({
      success: true,
      data: newInsight
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.get('/recommendations', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const recommendations = mockInsights.filter(insight => insight.type === 'recommendation');
    
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




router.post('/recommendations/:id/implement', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const { id } = req.params;
    
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.status(200).json({
      success: true,
      message: 'Recommendation implementation initiated',
      data: {
        id,
        status: 'implementing',
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.get('/analytics', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const analytics = {
      totalInsights: mockInsights.length,
      accuracy: 87.5,
      timesSaved: 127,
      costReduction: 8450,
      implementedRecommendations: 15,
      successRate: 94.2
    };
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
