const Company = require('../models/Company');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all companies (only for chairman and admin)
// @route   GET /api/companies
// @access  Private (Chairman, Admin)
exports.getCompanies = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!['chairman', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only chairman and admin can view companies.'
    });
  }

  const companies = await Company.find()
    .populate('createdBy', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: companies.length,
    data: companies
  });
});

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Private (Chairman, Admin)
exports.getCompany = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!['chairman', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only chairman and admin can view company details.'
    });
  }

  const company = await Company.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'Company not found'
    });
  }

  res.status(200).json({
    success: true,
    data: company
  });
});

// @desc    Create new company
// @route   POST /api/companies
// @access  Private (Chairman only)
exports.createCompany = asyncHandler(async (req, res, next) => {
  // Only chairman can create companies
  if (req.user.role !== 'chairman') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only chairman can create companies.'
    });
  }

  // Add createdBy field
  req.body.createdBy = req.user.id;

  const company = await Company.create(req.body);

  res.status(201).json({
    success: true,
    data: company
  });
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (Chairman, Admin)
exports.updateCompany = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!['chairman', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only chairman and admin can update companies.'
    });
  }

  let company = await Company.findById(req.params.id);

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'Company not found'
    });
  }

  company = await Company.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: company
  });
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (Chairman only)
exports.deleteCompany = asyncHandler(async (req, res, next) => {
  // Only chairman can delete companies
  if (req.user.role !== 'chairman') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only chairman can delete companies.'
    });
  }

  const company = await Company.findById(req.params.id);

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'Company not found'
    });
  }

  await company.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Company deleted successfully'
  });
});

// @desc    Get company statistics
// @route   GET /api/companies/stats
// @access  Private (Chairman, Admin)
exports.getCompanyStats = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!['chairman', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only chairman and admin can view company statistics.'
    });
  }

  const stats = await Company.aggregate([
    {
      $group: {
        _id: null,
        totalCompanies: { $sum: 1 },
        activeCompanies: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        inactiveCompanies: {
          $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
        },
        suspendedCompanies: {
          $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
        },
        totalRevenue: { $sum: '$revenue' },
        avgEmployeeCount: { $avg: '$employeeCount' }
      }
    }
  ]);

  const industryStats = await Company.aggregate([
    {
      $group: {
        _id: '$industry',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalCompanies: 0,
        activeCompanies: 0,
        inactiveCompanies: 0,
        suspendedCompanies: 0,
        totalRevenue: 0,
        avgEmployeeCount: 0
      },
      industryBreakdown: industryStats
    }
  });
}); 