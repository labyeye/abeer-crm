const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');


const mockFeatures = [
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
  }
];

const mockAnalytics = {
  downloads: 12500,
  activeUsers: 8900,
  retention: 78,
  rating: 4.6,
  crashes: 12,
  revenue: 15400
};




router.get('/features', protect, authorize('chairman', 'admin', 'manager'), async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: mockFeatures.length,
      data: mockFeatures
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.get('/analytics', protect, authorize('chairman', 'admin', 'manager'), async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: mockAnalytics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.put('/features/:id', protect, authorize('chairman', 'admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const featureIndex = mockFeatures.findIndex(f => f.id === id);
    if (featureIndex === -1) {
      return res.status(404).json({ success: false, message: 'Feature not found' });
    }
    
    mockFeatures[featureIndex].status = status;
    mockFeatures[featureIndex].lastUpdated = new Date().toISOString().split('T')[0];
    
    res.status(200).json({
      success: true,
      data: mockFeatures[featureIndex]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.get('/device-stats', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const deviceStats = {
      ios: 58,
      android: 42,
      tablets: 15,
      phones: 85
    };
    
    res.status(200).json({
      success: true,
      data: deviceStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.post('/generate-qr', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const qrData = {
      id: Date.now().toString(),
      url: 'https://app.abeer-crm.com/download',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
    };
    
    res.status(201).json({
      success: true,
      data: qrData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.post('/deploy', protect, authorize('chairman', 'company_admin'), async (req, res) => {
  try {
    const { version, platform, releaseNotes } = req.body;
    
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const deployment = {
      id: Date.now().toString(),
      version,
      platform,
      releaseNotes,
      status: 'deploying',
      startedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000).toISOString() 
    };
    
    res.status(201).json({
      success: true,
      data: deployment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.get('/feedback', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const feedback = [
      {
        id: '1',
        user: 'John D.',
        rating: 5,
        comment: 'Great app! The inventory scanner feature saves us so much time.',
        date: '2024-01-13',
        platform: 'iOS'
      },
      {
        id: '2',
        user: 'Sarah M.',
        rating: 4,
        comment: 'Love the real-time notifications. Could use better offline support.',
        date: '2024-01-08',
        platform: 'Android'
      }
    ];
    
    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});




router.get('/performance', protect, authorize('chairman', 'company_admin', 'branch_head'), async (req, res) => {
  try {
    const performance = {
      crashRate: 0.1,
      loadTime: 2.3,
      batteryUsage: 'Low',
      dataUsage: '3.2MB/day',
      sessionLength: 8.5,
      dailySessions: 3.2,
      featureAdoption: 76,
      pushCTR: 12.5
    };
    
    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
