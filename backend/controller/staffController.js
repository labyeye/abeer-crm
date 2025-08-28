const Staff = require('../models/Staff');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Attendance = require('../models/Attendance');
const Salary = require('../models/Salary');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const { updateBranchEmployeeCount } = require('../utils/branchUtils');

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private
const getAllStaff = asyncHandler(async (req, res) => {
  const { branch, status, department, search } = req.query;
  
  let query = {};
  
  // Role-based filtering
  if (req.user.role === 'admin') {
    // Branch admin can only see staff from their branch
    const userBranch = await Branch.findOne({ admin: req.user.id });
    if (userBranch) {
      query.branch = userBranch._id;
      console.log('Branch admin filtering staff for branch:', userBranch._id);
    }
  } else if (req.user.role === 'manager') {
    // Manager can only see staff from their branch
    query.branch = req.user.branch;
    console.log('Manager filtering staff for branch:', req.user.branch);
  }
  // Chairman can see all staff (no additional filtering)
  
  // Additional filters from query params
  if (branch && req.user.role === 'chairman') {
    query.branch = branch; // Only chairman can filter by specific branch
  }
  if (status) query.status = status;
  if (department) query.department = department;
  
  if (search) {
    query.$or = [
      { employeeId: { $regex: search, $options: 'i' } },
      { designation: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
  }
  
  const staff = await Staff.find(query)
    .populate('user', 'name email phone')
    .populate('branch', 'name code companyName')
    .sort({ createdAt: -1 });
  console.log('Fetched staff documents:', staff.length, 'for user role:', req.user.role);
  
  res.status(200).json({
    success: true,
    count: staff.length,
    data: staff
  });
});

// @desc    Get single staff
// @route   GET /api/staff/:id
// @access  Private
const getStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('branch', 'name code companyName');
  
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: staff
  });
});

// @desc    Create staff
// @route   POST /api/staff
// @access  Private
const createStaff = asyncHandler(async (req, res, next) => {
  const {
    employeeId,
    staffType,
    designation,
    department,
    joiningDate,
    salary,
    bankDetails,
    contactInfo,
    documents,
    maritalStatus,
    children,
    grandfatherName,
    education,
    branch,
    name,
    email,
    phone,
    password,
    address,
    fatherName,
    motherName,
    aadharNumbers,
    contacts,
    referredBy
  } = req.body;
  
  // Check if employee ID is unique
  const existingEmployeeId = await Staff.findOne({ employeeId, isDeleted: false });
  if (existingEmployeeId) {
    return next(new ErrorResponse('Employee ID already exists', 400));
  }

  // Check if user email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User email already exists', 400));
  }

  // Create new user for staff
  const newUser = await User.create({
    name,
    email,
    phone,
    password,
    role: 'staff',
    company: req.user.company // Ensure company is set
  });

  let branchId = branch;
  
  // Auto-assign branch based on user role
  if (req.user.role === 'admin') {
    // Branch admin can only add staff to their own branch
    const userBranch = await Branch.findOne({ admin: req.user.id });
    if (userBranch) {
      branchId = userBranch._id;
      console.log('Branch admin auto-assigning staff to branch:', userBranch._id);
    } else {
      return next(new ErrorResponse('Branch not found for admin user', 400));
    }
  } else if (req.user.role === 'manager') {
    // Manager can only add staff to their branch
    branchId = req.user.branch;
    console.log('Manager auto-assigning staff to branch:', req.user.branch);
  } else if (req.user.role === 'chairman') {
    // Chairman can specify branch or it will be auto-assigned
    if (!branchId) {
      return next(new ErrorResponse('Branch is required for chairman to create staff', 400));
    }
    // If branch is not a valid ObjectId, treat it as branch code
    if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
      const branchDoc = await Branch.findOne({ code: branchId });
      if (!branchDoc) {
        return next(new ErrorResponse('Branch code not found', 400));
      }
      branchId = branchDoc._id;
    }
  }

  const staffData = {
    user: newUser._id,
    branch: branchId,
    employeeId,
    staffType,
    designation,
    department,
    joiningDate,
    salary: salary.basic + (salary.allowances || 0),
    bankDetails,
    contactInfo,
    documents,
    maritalStatus,
    children,
    grandfatherName,
    education,
    name,
    phone,
    address,
    fatherName,
    motherName,
    aadharNumbers,
    contacts,
    referredBy
  };

  const staff = await Staff.create(staffData);

  // Update branch employee count
  await updateBranchEmployeeCount(staff.branch);

  res.status(201).json({
    success: true,
    data: staff
  });
});

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Private
const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }

  // Role-based access control
  if (req.user.role === 'admin') {
    // Branch admin can only update staff in their branch
    const userBranch = await Branch.findOne({ admin: req.user.id });
    if (!userBranch || staff.branch.toString() !== userBranch._id.toString()) {
      return next(new ErrorResponse('Access denied. Can only update staff in your branch.', 403));
    }
    // Remove branch from update data to prevent branch changes
    delete req.body.branch;
  } else if (req.user.role === 'manager') {
    // Manager can only update staff in their branch
    if (staff.branch.toString() !== req.user.branch.toString()) {
      return next(new ErrorResponse('Access denied. Can only update staff in your branch.', 403));
    }
    // Remove branch from update data to prevent branch changes
    delete req.body.branch;
  }
  // Chairman can update any staff and change branches
  
  // Update salary total if basic or allowances changed
  if (req.body.salary) {
    const { basic, allowances } = req.body.salary;
    req.body.salary.total = basic + (allowances || 0);
  }
  
  const updatedStaff = await Staff.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  // Update employee count for both old and new branch if branch changed
  if (req.body.branch && req.body.branch !== staff.branch.toString()) {
    await Promise.all([
      updateBranchEmployeeCount(staff.branch), // Update old branch
      updateBranchEmployeeCount(req.body.branch) // Update new branch
    ]);
  } else {
    // Update current branch employee count
    await updateBranchEmployeeCount(updatedStaff.branch);
  }
  
  res.status(200).json({
    success: true,
    data: updatedStaff
  });
});

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Private
const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }
  
  staff.isDeleted = true;
  await staff.save();
  
  // Update branch employee count
  await updateBranchEmployeeCount(staff.branch);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get staff attendance
// @route   GET /api/staff/:id/attendance
// @access  Private
const getStaffAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = { staff: req.params.id, isDeleted: false };
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const attendance = await Attendance.find(query)
    .sort({ date: -1 });
  
  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});

// @desc    Get staff performance
// @route   GET /api/staff/:id/performance
// @access  Private
const getStaffPerformance = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
  const staff = await Staff.findById(req.params.id);
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }
  
  let attendanceQuery = { staff: req.params.id, isDeleted: false };
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    attendanceQuery.date = { $gte: startDate, $lte: endDate };
  }
  
  const attendance = await Attendance.find(attendanceQuery);
  
  const performance = {
    totalDays: attendance.length,
    presentDays: attendance.filter(a => a.status === 'present').length,
    absentDays: attendance.filter(a => a.status === 'absent').length,
    lateDays: attendance.filter(a => a.status === 'late').length,
    halfDays: attendance.filter(a => a.status === 'half_day').length,
    totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
    totalOvertime: attendance.reduce((sum, a) => sum + (a.overtime || 0), 0),
    currentScore: staff.performance.score
  };
  
  res.status(200).json({
    success: true,
    data: performance
  });
});

// @desc    Update staff performance score
// @route   PUT /api/staff/:id/performance
// @access  Private
const updateStaffPerformance = asyncHandler(async (req, res) => {
  const { score, reason } = req.body;
  
  const staff = await Staff.findById(req.params.id);
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }
  
  staff.performance.score = score;
  if (reason) {
    staff.performance.notes = reason;
  }
  
  await staff.save();
  
  res.status(200).json({
    success: true,
    data: staff.performance
  });
});

// @desc    Get staff salary history
// @route   GET /api/staff/:id/salary
// @access  Private
const getStaffSalary = asyncHandler(async (req, res) => {
  const { year } = req.query;
  
  let query = { staff: req.params.id, isDeleted: false };
  if (year) {
    query.year = parseInt(year);
  }
  
  const salary = await Salary.find(query)
    .sort({ year: -1, month: -1 });
  
  res.status(200).json({
    success: true,
    count: salary.length,
    data: salary
  });
});

module.exports = {
  getAllStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffAttendance,
  getStaffPerformance,
  updateStaffPerformance,
  getStaffSalary
}; 