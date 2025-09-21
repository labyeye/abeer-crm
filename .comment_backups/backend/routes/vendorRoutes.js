const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
router.get('/', protect, authorize(['chairman', 'admin', 'manager']), async (req, res) => {
  try {
    // Mock data for now - replace with actual database query
    const vendors = [
      {
        _id: '1',
        companyName: 'ProLens Equipment Rentals',
        contactPerson: {
          name: 'Rajesh Kumar',
          designation: 'Manager',
          phone: '+91-9876543210',
          email: 'rajesh@prolens.com'
        },
        address: {
          street: '123 Business Park',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        businessInfo: {
          gstNumber: '27ABCDE1234F1Z5',
          panNumber: 'ABCDE1234F',
          businessType: 'equipment_rental',
          establishedYear: 2018,
          website: 'www.prolens.com'
        },
        services: [
          {
            category: 'Professional Cameras',
            description: 'Canon EOS R5, Sony A7IV, Nikon Z9',
            priceRange: { min: 2000, max: 5000, unit: 'per day' },
            availability: 'always'
          }
        ],
        ratings: {
          overall: 4.5,
          reliability: 4.7,
          quality: 4.6,
          pricing: 4.2,
          communication: 4.4,
          totalReviews: 38
        },
        financials: {
          totalTransactions: 127,
          totalValue: 485000,
          outstandingAmount: 15000,
          creditLimit: 50000,
          paymentTerms: 'Net 30',
          lastPayment: '2024-12-15'
        },
        contractInfo: {
          contractType: 'annual',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          autoRenewal: true,
          terms: ['30-day payment terms', 'Equipment insurance required']
        },
        performance: {
          onTimeDelivery: 92,
          qualityScore: 88,
          responsiveness: 2.5,
          issueResolutionTime: 4.2
        },
        status: 'active',
        documents: [
          { type: 'contract', fileName: 'annual_contract_2024.pdf', uploadedDate: '2024-01-01', verified: true }
        ],
        recentOrders: [
          { orderId: 'ORD-001', date: '2024-12-15', amount: 12000, status: 'completed', description: 'Wedding equipment rental' }
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-12-18'
      }
    ];

    res.status(200).json({
      success: true,
      data: vendors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// @desc    Get vendor statistics
// @route   GET /api/vendors/stats
// @access  Private
router.get('/stats', protect, authorize(['chairman', 'admin', 'manager']), async (req, res) => {
  try {
    const stats = {
      totalVendors: 45,
      activeVendors: 38,
      pendingVerification: 4,
      blacklistedVendors: 3,
      totalSpend: 2850000,
      avgRating: 4.2,
      topCategories: [
        { category: 'Equipment Rental', count: 15, spend: 1200000 },
        { category: 'Printing', count: 12, spend: 850000 },
        { category: 'Transportation', count: 8, spend: 450000 }
      ],
      performanceMetrics: {
        avgOnTimeDelivery: 88,
        avgQualityScore: 91,
        avgResponseTime: 3.2
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// @desc    Add new vendor
// @route   POST /api/vendors
// @access  Private
router.post('/', protect, authorize(['chairman', 'admin', 'manager']), async (req, res) => {
  try {
    const vendorData = req.body;

    // Mock response - replace with actual database creation
    const newVendor = {
      _id: Date.now().toString(),
      ...vendorData,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Vendor added successfully',
      data: newVendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
router.put('/:id', protect, authorize(['chairman', 'admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Mock response - replace with actual database update
    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully',
      data: { id, updates }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;
