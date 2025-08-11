const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// @desc    Get advanced analytics data
// @route   GET /api/analytics
// @access  Private
router.get('/', protect, authorize(['chairman', 'company_admin', 'branch_head']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Mock analytics data - replace with actual database aggregation
    const analyticsData = {
      overview: {
        totalRevenue: 2850000,
        revenueGrowth: 12.5,
        totalBookings: 147,
        bookingsGrowth: 8.3,
        averageOrderValue: 19387,
        aovGrowth: 4.2,
        clientRetention: 78.5,
        retentionGrowth: 3.1
      },
      revenueAnalysis: {
        monthlyRevenue: [
          { month: 'Jul', revenue: 420000, bookings: 22 },
          { month: 'Aug', revenue: 380000, bookings: 19 },
          { month: 'Sep', revenue: 450000, bookings: 24 },
          { month: 'Oct', revenue: 520000, bookings: 26 },
          { month: 'Nov', revenue: 480000, bookings: 23 },
          { month: 'Dec', revenue: 600000, bookings: 33 }
        ],
        revenueByService: [
          { service: 'Wedding Photography', revenue: 1200000, percentage: 42.1 },
          { service: 'Corporate Events', revenue: 680000, percentage: 23.9 },
          { service: 'Pre-Wedding Shoots', revenue: 420000, percentage: 14.7 },
          { service: 'Product Photography', revenue: 350000, percentage: 12.3 },
          { service: 'Others', revenue: 200000, percentage: 7.0 }
        ],
        paymentStatus: {
          collected: 2400000,
          pending: 320000,
          overdue: 130000
        }
      },
      operationalMetrics: {
        productivity: {
          tasksCompleted: 1247,
          onTimeDelivery: 87.3,
          averageProjectDuration: 12.5,
          resourceUtilization: 82.1
        },
        qualityMetrics: {
          clientSatisfaction: 4.6,
          revisionsRequested: 2.3,
          complaintResolution: 94.2,
          qualityScore: 91.8
        }
      },
      clientAnalytics: {
        segmentation: [
          { segment: 'Premium Clients', count: 28, revenue: 1420000 },
          { segment: 'Regular Clients', count: 89, revenue: 1100000 },
          { segment: 'Budget Clients', count: 156, revenue: 330000 }
        ],
        acquisitionChannels: [
          { channel: 'Referrals', clients: 98, conversion: 34.2 },
          { channel: 'Social Media', clients: 67, conversion: 12.5 },
          { channel: 'Website', clients: 45, conversion: 8.7 },
          { channel: 'Events/Exhibitions', clients: 32, conversion: 18.9 }
        ],
        lifetimeValue: 45600,
        churnRate: 12.3
      },
      teamPerformance: {
        staffMetrics: [
          {
            staffId: '1',
            name: 'John Doe',
            designation: 'Lead Photographer',
            projectsCompleted: 34,
            efficiency: 92.5,
            clientRating: 4.8,
            revenue: 680000
          }
        ],
        departmentPerformance: [
          { department: 'Photography', efficiency: 91.2, revenue: 1680000, growth: 15.3 },
          { department: 'Video Production', efficiency: 87.8, revenue: 920000, growth: 8.7 },
          { department: 'Post-Production', efficiency: 89.5, revenue: 250000, growth: 22.1 }
        ]
      },
      marketingROI: {
        campaignPerformance: [
          { campaign: 'Wedding Season Campaign', spend: 45000, leads: 234, conversions: 56, roi: 3.2 }
        ],
        leadConversion: {
          totalLeads: 1247,
          qualifiedLeads: 456,
          conversions: 147,
          conversionRate: 32.2
        }
      },
      forecasting: {
        projectedRevenue: [
          { month: 'Jan 2025', projected: 520000, actual: undefined },
          { month: 'Feb 2025', projected: 480000, actual: undefined },
          { month: 'Mar 2025', projected: 650000, actual: undefined },
          { month: 'Apr 2025', projected: 720000, actual: undefined }
        ],
        seasonalTrends: [
          { season: 'Spring (Mar-May)', multiplier: 1.35 },
          { season: 'Summer (Jun-Aug)', multiplier: 0.85 },
          { season: 'Monsoon (Sep-Nov)', multiplier: 1.15 },
          { season: 'Winter (Dec-Feb)', multiplier: 1.65 }
        ],
        growthPrediction: {
          nextQuarter: 18.5,
          nextYear: 24.2,
          confidence: 87.3
        }
      }
    };

    res.status(200).json({
      success: true,
      data: analyticsData,
      params: { startDate, endDate }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// @desc    Export analytics report
// @route   GET /api/analytics/export
// @access  Private
router.get('/export', protect, authorize(['chairman', 'company_admin', 'branch_head']), async (req, res) => {
  try {
    const { format = 'pdf', type = 'comprehensive' } = req.query;

    // Mock export response - replace with actual export logic
    res.status(200).json({
      success: true,
      message: 'Export initiated',
      data: {
        format,
        type,
        downloadUrl: `/api/analytics/download/${Date.now()}.${format}`,
        estimatedTime: '2-3 minutes'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;
