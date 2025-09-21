const Branch = require("../models/Branch");
const asyncHandler = require("../utils/asyncHandler");
const {
  updateBranchStats,
  updateAllBranchesStats,
} = require("../utils/branchUtils");

const { computeBranchRevenueBreakdown } = require('../utils/branchUtils');




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

  
  const transformedBranches = branches.map((branch) => ({
    _id: branch._id,
    name: branch.name, 
    companyName: branch.companyName,
    code: branch.code,
    email: branch.companyEmail,
    phone: branch.companyPhone,
    address: branch.address,
    website: branch.companyWebsite,
    industry: branch.industry,
    foundedYear: branch.foundedYear,
    employeeCount: branch.employeeCount,
  // keep backward compatibility if revenue stored as number
  revenue: typeof branch.revenue === 'number' ? branch.revenue : (branch.revenue?.total ?? 0),
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

  
  const transformedBranch = {
    _id: branch._id,
    name: branch.companyName, 
    code: branch.code,
    email: branch.companyEmail, 
    phone: branch.companyPhone, 
    address: branch.address,
    website: branch.companyWebsite, 
    industry: branch.industry,
    foundedYear: branch.foundedYear,
    employeeCount: branch.employeeCount,
  revenue: typeof branch.revenue === 'number' ? branch.revenue : (branch.revenue?.total ?? 0),
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




exports.createBranch = asyncHandler(async (req, res) => {
  
  if (req.user.role !== "chairman") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only chairman can create branches.",
    });
  }

  
  const branchData = {
    
    companyName: req.body.name,
    companyEmail: req.body.email,
    companyPhone: req.body.phone,
    companyWebsite: req.body.website,
    companyDescription: req.body.description,
    industry: req.body.industry,
    foundedYear: req.body.foundedYear,

    
    name: req.body.name, 
    code: req.body.code,
    address: req.body.address,
    gstNumber: req.body.gstNumber,
    panNumber: req.body.panNumber,
    userId: req.body.userId,
    password: req.body.password,

    
    employeeCount: 0,
    revenue: 0,
    createdBy: req.user.id,
  };

  
  const branch = await Branch.create(branchData);

  
  const User = require("../models/User");
  const bcrypt = require("bcryptjs");

  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    phone: req.body.phone,
    role: "admin", 
    branch: branch._id,
    isActive: true,
  });

  
  branch.admin = user._id;
  await branch.save();

  res.status(201).json({
    success: true,
    data: branch,
    message: "Branch created successfully with admin account",
  });
});




exports.updateBranch = asyncHandler(async (req, res) => {
  
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

  
  const updateData = {
    
    companyName: req.body.name,
    companyEmail: req.body.email,
    companyPhone: req.body.phone,
    companyWebsite: req.body.website,
    companyDescription: req.body.description,
    industry: req.body.industry,
    foundedYear: req.body.foundedYear,

    
    name: req.body.name, 
    code: req.body.code,
    address: req.body.address,
    gstNumber: req.body.gstNumber,
    panNumber: req.body.panNumber,
    userId: req.body.userId,
    password: req.body.password,
  };

  
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  branch = await Branch.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  
  if (
    branch.admin &&
    (req.body.email || req.body.password || req.body.name || req.body.phone)
  ) {
    const User = require("../models/User");
    const userUpdateData = {};

    if (req.body.name) userUpdateData.name = req.body.name;
    if (req.body.email) userUpdateData.email = req.body.email;
    if (req.body.phone) userUpdateData.phone = req.body.phone;

    
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




exports.deleteBranch = asyncHandler(async (req, res) => {
  
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

  
  await Branch.findByIdAndDelete(req.params.id);

  
  if (branch.admin) {
    const User = require("../models/User");
    await User.findByIdAndDelete(branch.admin);
  }

  res.status(200).json({
    success: true,
    message: "Branch and associated user account deleted successfully",
  });
});




exports.getBranchStats = asyncHandler(async (req, res) => {
  
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
  // revenue may be an object { total, invoices, ... } or legacy number
  totalRevenue: { $sum: { $ifNull: ["$revenue.total", "$revenue"] } },
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




exports.updateBranchStats = asyncHandler(async (req, res) => {
  
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


exports.forceUpdateBranchStats = asyncHandler(async (req, res) => {
  if (!["chairman", "admin"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const branchId = req.params.id;
  const breakdown = await computeBranchRevenueBreakdown(branchId);

  const updatedBranch = await Branch.findById(branchId).populate('createdBy', 'name email');

  res.status(200).json({ success: true, data: { breakdown, branch: updatedBranch } });
});




exports.updateAllBranchesStats = asyncHandler(async (req, res) => {
  
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
