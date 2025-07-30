const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
const getAllAttendance = asyncHandler(async (req, res) => {
  const { company, branch, staff, date, status, startDate, endDate } = req.query;
  
  let query = { isDeleted: false };
  
  if (company) query.company = company;
  if (branch) query.branch = branch;
  if (staff) query.staff = staff;
  if (status) query.status = status;
  
  if (date) {
    const searchDate = new Date(date);
    query.date = {
      $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
      $lt: new Date(searchDate.setHours(23, 59, 59, 999))
    };
  }
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const attendance = await Attendance.find(query)
    .populate('staff', 'employeeId designation')
    .populate('company', 'name')
    .populate('branch', 'name code')
    .sort({ date: -1, 'checkIn.time': -1 });
  
  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
// @access  Private
const getAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate('staff', 'employeeId designation')
    .populate('company', 'name')
    .populate('branch', 'name code');
  
  if (!attendance || attendance.isDeleted) {
    return next(new ErrorResponse('Attendance record not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: attendance
  });
});

// @desc    Check in staff
// @route   POST /api/attendance/checkin
// @access  Private
const checkIn = asyncHandler(async (req, res) => {
  const { staffId, photo, location, deviceInfo } = req.body;
  
  // Check if staff exists
  const staff = await Staff.findById(staffId);
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if already checked in today
  const existingAttendance = await Attendance.findOne({
    staff: staffId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    },
    isDeleted: false
  });
  
  if (existingAttendance) {
    return next(new ErrorResponse('Already checked in today', 400));
  }
  
  const checkInTime = new Date();
  let status = 'present';
  
  // Check if late (after 9:30 AM)
  const lateThreshold = new Date(today);
  lateThreshold.setHours(9, 30, 0, 0);
  
  if (checkInTime > lateThreshold) {
    status = 'late';
  }
  
  const attendanceData = {
    staff: staffId,
    company: staff.company,
    branch: staff.branch,
    date: today,
    checkIn: {
      time: checkInTime,
      photo,
      location,
      deviceInfo
    },
    status
  };
  
  const attendance = await Attendance.create(attendanceData);
  
  // Update staff performance score
  if (status === 'late') {
    staff.performance.lateArrivals += 1;
    staff.performance.score = Math.max(0, staff.performance.score - 5);
    await staff.save();
  }
  
  res.status(201).json({
    success: true,
    data: attendance
  });
});

// @desc    Check out staff
// @route   POST /api/attendance/checkout
// @access  Private
const checkOut = asyncHandler(async (req, res) => {
  const { staffId, photo, location, deviceInfo } = req.body;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find today's attendance record
  const attendance = await Attendance.findOne({
    staff: staffId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    },
    isDeleted: false
  });
  
  if (!attendance) {
    return next(new ErrorResponse('No check-in record found for today', 404));
  }
  
  if (attendance.checkOut && attendance.checkOut.time) {
    return next(new ErrorResponse('Already checked out today', 400));
  }
  
  const checkOutTime = new Date();
  
  // Calculate working hours
  const checkInTime = new Date(attendance.checkIn.time);
  const workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours
  
  // Calculate overtime (if working more than 8 hours)
  const overtime = Math.max(0, workingHours - 8);
  
  attendance.checkOut = {
    time: checkOutTime,
    photo,
    location,
    deviceInfo
  };
  
  attendance.workingHours = Math.round(workingHours * 100) / 100;
  attendance.overtime = Math.round(overtime * 100) / 100;
  
  await attendance.save();
  
  res.status(200).json({
    success: true,
    data: attendance
  });
});

// @desc    Mark attendance manually
// @route   POST /api/attendance/manual
// @access  Private
const markAttendanceManually = asyncHandler(async (req, res) => {
  const {
    staffId,
    date,
    status,
    checkInTime,
    checkOutTime,
    workingHours,
    overtime,
    notes
  } = req.body;
  
  // Check if staff exists
  const staff = await Staff.findById(staffId);
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }
  
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  
  // Check if attendance already exists for this date
  const existingAttendance = await Attendance.findOne({
    staff: staffId,
    date: attendanceDate,
    isDeleted: false
  });
  
  if (existingAttendance) {
    return next(new ErrorResponse('Attendance already marked for this date', 400));
  }
  
  const attendanceData = {
    staff: staffId,
    company: staff.company,
    branch: staff.branch,
    date: attendanceDate,
    status,
    notes
  };
  
  if (checkInTime) {
    attendanceData.checkIn = {
      time: new Date(checkInTime),
      photo: '',
      location: {},
      deviceInfo: {}
    };
  }
  
  if (checkOutTime) {
    attendanceData.checkOut = {
      time: new Date(checkOutTime),
      photo: '',
      location: {},
      deviceInfo: {}
    };
  }
  
  if (workingHours) attendanceData.workingHours = workingHours;
  if (overtime) attendanceData.overtime = overtime;
  
  const attendance = await Attendance.create(attendanceData);
  
  res.status(201).json({
    success: true,
    data: attendance
  });
});

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private
const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  
  if (!attendance || attendance.isDeleted) {
    return next(new ErrorResponse('Attendance record not found', 404));
  }
  
  const updatedAttendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: updatedAttendance
  });
});

// @desc    Delete attendance
// @route   DELETE /api/attendance/:id
// @access  Private
const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  
  if (!attendance || attendance.isDeleted) {
    return next(new ErrorResponse('Attendance record not found', 404));
  }
  
  attendance.isDeleted = true;
  await attendance.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get attendance summary
// @route   GET /api/attendance/summary
// @access  Private
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { company, branch, startDate, endDate } = req.query;
  
  let query = { isDeleted: false };
  
  if (company) query.company = company;
  if (branch) query.branch = branch;
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const attendance = await Attendance.find(query);
  
  const summary = {
    totalRecords: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    halfDay: attendance.filter(a => a.status === 'half_day').length,
    leave: attendance.filter(a => a.status === 'leave').length,
    totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
    totalOvertime: attendance.reduce((sum, a) => sum + (a.overtime || 0), 0)
  };
  
  res.status(200).json({
    success: true,
    data: summary
  });
});

module.exports = {
  getAllAttendance,
  getAttendance,
  checkIn,
  checkOut,
  markAttendanceManually,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary
}; 