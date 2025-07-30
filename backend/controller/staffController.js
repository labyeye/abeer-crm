const Staff = require('../models/Staff');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Salary = require('../models/Salary');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private
const getAllStaff = asyncHandler(async (req, res) => {
  const { company, branch, status, department, search } = req.query;
  
  let query = { isDeleted: false };
  
  if (company) query.company = company;
  if (branch) query.branch = branch;
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
    .populate('company', 'name')
    .populate('branch', 'name code')
    .sort({ createdAt: -1 });
  
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
    .populate('company', 'name')
    .populate('branch', 'name code');
  
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
const createStaff = asyncHandler(async (req, res) => {
  const {
    userId,
    employeeId,
    staffType,
    designation,
    department,
    joiningDate,
    salary,
    bankDetails,
    contactInfo,
    documents
  } = req.body;
  
  // Check if user exists and is not already a staff
  const existingStaff = await Staff.findOne({ user: userId, isDeleted: false });
  if (existingStaff) {
    return next(new ErrorResponse('User is already a staff member', 400));
  }
  
  // Check if employee ID is unique
  const existingEmployeeId = await Staff.findOne({ employeeId, isDeleted: false });
  if (existingEmployeeId) {
    return next(new ErrorResponse('Employee ID already exists', 400));
  }
  
  const staffData = {
    user: userId,
    company: req.user.companyId,
    branch: req.user.branchId,
    employeeId,
    staffType,
    designation,
    department,
    joiningDate,
    salary: {
      basic: salary.basic,
      allowances: salary.allowances || 0,
      total: salary.basic + (salary.allowances || 0)
    },
    bankDetails,
    contactInfo,
    documents
  };
  
  const staff = await Staff.create(staffData);
  
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