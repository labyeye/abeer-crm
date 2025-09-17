const Branch = require("../models/Branch");
const asyncHandler = require("../utils/asyncHandler");
const {
  updateBranchStats,
  updateAllBranchesStats,
} = require("../utils/branchUtils");

// @desc    Get all branches (with company functionality)
// @route   GET /api/branches
// @access  Private (Chairman, Company Admin, Branch Head)
exports.getAllBranches = asyncHandler(async (req, res) => {
  const { company, status, search } = req.query;
  let query = {};

  if (company) query.companyName = { $regex: company, $options: "i" };
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
      { "address.city": { $regex: search, $options: "i" } },
    ];
  }

  const branches = await Branch.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  // Transform data to match frontend expectations
  const transformedBranches = branches.map((branch) => ({
    _id: branch._id,
    name: branch.name, // Use branch name for dropdown
    companyName: branch.companyName,
    code: branch.code,
    email: branch.companyEmail,
    phone: branch.companyPhone,
    address: branch.address,
    website: branch.companyWebsite,
    industry: branch.industry,
    foundedYear: branch.foundedYear,
    employeeCount: branch.employeeCount,
    revenue: branch.revenue,
    createdBy: branch.createdBy,
    status: branch.status,
    gstNumber: branch.gstNumber,
    panNumber: branch.panNumber,
    userId: branch.userId,
  }));

  res.status(200).json({
    success: true,
    count: transformedBranches.length,
    data: transformedBranches,
  });
});

// @desc    Get single branch
// @route   GET /api/branches/:id
// @access  Private (Chairman, Company Admin, Branch Head)
exports.getBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("admin", "name email");

  if (!branch) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }

  // Transform data to match frontend expectations
  const transformedBranch = {
    _id: branch._id,
    name: branch.companyName, // Frontend expects 'name' for company name
    code: branch.code,
    email: branch.companyEmail, // Frontend expects 'email' for company email
    phone: branch.companyPhone, // Frontend expects 'phone' for company phone
    address: branch.address,
    website: branch.companyWebsite, // Frontend expects 'website' for company website
    industry: branch.industry,
    foundedYear: branch.foundedYear,
    employeeCount: branch.employeeCount,
    revenue: branch.revenue,
    status: branch.status,
    gstNumber: branch.gstNumber,
    panNumber: branch.panNumber,
    userId: branch.userId,
    gstNumber: branch.gstNumber,
    panNumber: branch.panNumber,
    userId: branch.userId,
  };

  res.status(200).json({
    success: true,
    data: transformedBranch,
  });
});

// @desc    Create new branch (with company info)
// @route   POST /api/branches
// @access  Private (Chairman only)
exports.createBranch = asyncHandler(async (req, res) => {
  // Only chairman can create branches
  if (req.user.role !== "chairman") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only chairman can create branches.",
    });
  }

  // Map frontend fields to backend schema fields
  const branchData = {
    // Company information (mapped from frontend fields)
    companyName: req.body.name,
    companyEmail: req.body.email,
    companyPhone: req.body.phone,
    companyWebsite: req.body.website,
    companyDescription: req.body.description,
    industry: req.body.industry,
    foundedYear: req.body.foundedYear,

    // Branch information
    name: req.body.name, // Use same name for both company and branch
    code: req.body.code,
    address: req.body.address,
    gstNumber: req.body.gstNumber,
    panNumber: req.body.panNumber,
    userId: req.body.userId,
    password: req.body.password,

    // Default values
    employeeCount: 0,
    revenue: 0,
    createdBy: req.user.id,
  };

  // Create the branch
  const branch = await Branch.create(branchData);

  // Create a user account for the branch admin
  const User = require("../models/User");
  const bcrypt = require("bcryptjs");

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // Create user account
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    phone: req.body.phone,
    role: "admin", // Branch admin role
    branch: branch._id,
    isActive: true,
  });

  // Update branch with admin reference
  branch.admin = user._id;
  await branch.save();

  res.status(201).json({
    success: true,
    data: branch,
    message: "Branch created successfully with admin account",
  });
});

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Chairman, Company Admin)
exports.updateBranch = asyncHandler(async (req, res) => {
  // Check if user has permission
  if (!["chairman", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only chairman and admin can update branches.",
    });
  }

  let branch = await Branch.findById(req.params.id);

  if (!branch) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }

  // Map frontend fields to backend schema fields
  const updateData = {
    // Company information (mapped from frontend fields)
    companyName: req.body.name,
    companyEmail: req.body.email,
    companyPhone: req.body.phone,
    companyWebsite: req.body.website,
    companyDescription: req.body.description,
    industry: req.body.industry,
    foundedYear: req.body.foundedYear,

    // Branch information
    name: req.body.name, // Use same name for both company and branch
    code: req.body.code,
    address: req.body.address,
    gstNumber: req.body.gstNumber,
    panNumber: req.body.panNumber,
    userId: req.body.userId,
    password: req.body.password,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  branch = await Branch.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  // Update associated user account if email or password changed
  if (
    branch.admin &&
    (req.body.email || req.body.password || req.body.name || req.body.phone)
  ) {
    const User = require("../models/User");
    const userUpdateData = {};

    if (req.body.name) userUpdateData.name = req.body.name;
    if (req.body.email) userUpdateData.email = req.body.email;
    if (req.body.phone) userUpdateData.phone = req.body.phone;

    // Hash new password if provided
    if (req.body.password) {
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      userUpdateData.password = await bcrypt.hash(req.body.password, salt);
    }

    await User.findByIdAndUpdate(branch.admin, userUpdateData);
  }

  res.status(200).json({
    success: true,
    data: branch,
  });
});

// @desc    Delete branch
// @route   DELETE /api/branches/:id
// @access  Private (Chairman only)
exports.deleteBranch = asyncHandler(async (req, res) => {
  // Only chairman can delete branches
  if (req.user.role !== "chairman") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only chairman can delete branches.",
    });
  }

  const branch = await Branch.findById(req.params.id);

  if (!branch) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }

  // Hard delete the branch
  await Branch.findByIdAndDelete(req.params.id);

  // Delete associated user account completely
  if (branch.admin) {
    const User = require("../models/User");
    await User.findByIdAndDelete(branch.admin);
  }

  res.status(200).json({
    success: true,
    message: "Branch and associated user account deleted successfully",
  });
});

// @desc    Get branch statistics
// @route   GET /api/branches/stats
// @access  Private (Chairman, Admin)
exports.getBranchStats = asyncHandler(async (req, res) => {
  // Check if user has permission
  if (!["chairman", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman and admin can view branch statistics.",
    });
  }

  const stats = await Branch.aggregate([
    {
      $group: {
        _id: null,
        totalBranches: { $sum: 1 },
        activeBranches: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        inactiveBranches: {
          $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
        },
        totalRevenue: { $sum: "$revenue" },
        avgEmployeeCount: { $avg: "$employeeCount" },
      },
    },
  ]);

  const industryStats = await Branch.aggregate([
    {
      $group: {
        _id: "$industry",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalBranches: 0,
        activeBranches: 0,
        inactiveBranches: 0,
        totalRevenue: 0,
        avgEmployeeCount: 0,
      },
      industryBreakdown: industryStats,
    },
  });
});

// @desc    Update branch stats (employee count and revenue)
// @route   PUT /api/branches/:id/stats
// @access  Private (Chairman, Admin)
exports.updateBranchStats = asyncHandler(async (req, res) => {
  // Check if user has permission
  if (!["chairman", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman and admin can update branch statistics.",
    });
  }

  const branch = await Branch.findById(req.params.id);

  if (!branch) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }

  await updateBranchStats(branch._id);

  // Get updated branch data
  const updatedBranch = await Branch.findById(branch._id).populate(
    "createdBy",
    "name email"
  );

  res.status(200).json({
    success: true,
    message: "Branch statistics updated successfully",
    data: updatedBranch,
  });
});

// @desc    Update all branches stats
// @route   PUT /api/branches/stats/update-all
// @access  Private (Chairman only)
exports.updateAllBranchesStats = asyncHandler(async (req, res) => {
  // Only chairman can update all branches stats
  if (req.user.role !== "chairman") {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman can update all branches statistics.",
    });
  }

  await updateAllBranchesStats();

  res.status(200).json({
    success: true,
    message: "All branches statistics updated successfully",
  });
});

// Legacy function for backward compatibility
exports.getBranches = asyncHandler(async (req, res) => {
  const { company, status, search } = req.query;
  let query = {};

  if (company) query.companyName = { $regex: company, $options: "i" };
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
      { "address.city": { $regex: search, $options: "i" } },
    ];
  }

  const branches = await Branch.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: branches.length,
    data: branches,
  });
});
