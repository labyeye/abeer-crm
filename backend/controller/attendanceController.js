const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');




const getAllAttendance = asyncHandler(async (req, res) => {
  const { branch, staff, client, date, status, startDate, endDate } = req.query;

  let query = { isDeleted: false };
  // Scope queries based on authenticated user
  if (req.user.role === 'admin') {
    // branch admins only see their own branch
    if (req.user.branch) query.branch = req.user.branch;
  } else if (req.user.role === 'staff') {
    // staff can only see their own attendance
    const myStaff = await Staff.findOne({ user: req.user._id });
    if (!myStaff) {
      return res.status(404).json({ success: false, message: 'Staff record not found' });
    }
    query.staff = myStaff._id;
  } else {
    // chairman or other roles can pass filters
    if (branch) query.branch = branch;
    if (staff) query.staff = staff;
  }

  if (client) query.client = client;
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
    .populate('staff', 'employeeId designation name')
    .populate('client', 'name phone email')
    .populate('branch', 'name code')
    .sort({ date: -1, 'checkIn.time': -1 });

  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});




const getMyAttendance = asyncHandler(async (req, res) => {
  const { date, startDate, endDate, status } = req.query;

  
  const staff = await Staff.findOne({ user: req.user._id });
  if (!staff) {
    return res.status(404).json({
      success: false,
      message: 'Staff record not found'
    });
  }

  let query = { 
    staff: staff._id,
    isDeleted: false 
  };

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
    .populate('staff', 'employeeId designation name')
    .populate('client', 'name phone email')
    .populate('branch', 'name code')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});




const getAttendanceById = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate('staff', 'employeeId designation name user')
    .populate('client', 'name phone email')
    .populate('branch', 'name code');

  if (!attendance || attendance.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Attendance record not found'
    });
  }

  
  // Branch admins can only view attendance for their branch
  if (req.user.role === 'staff') {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff || attendance.staff.toString() !== staff._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this attendance record'
      });
    }
  }

  if (req.user.role === 'admin') {
    if (!req.user.branch || attendance.branch.toString() !== req.user.branch.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this attendance record' });
    }
  }

  res.status(200).json({
    success: true,
    data: attendance
  });
});




const checkIn = asyncHandler(async (req, res) => {
  const { staffId, photo, location, deviceInfo } = req.body;

  
  const staff = await Staff.findById(staffId);
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }

  // If the requester is a branch admin, ensure the staff belongs to their branch
  if (req.user.role === 'admin') {
    if (!req.user.branch || staff.branch.toString() !== req.user.branch.toString()) {
      return next(new ErrorResponse('Not authorized to perform check-in for this staff', 403));
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  
  const existingAttendance = await Attendance.findOne({
    staff: staffId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    },
    isDeleted: false
  });
  const checkInTime = new Date();
  let status = 'present';

  
  const lateThreshold = new Date(today);
  lateThreshold.setHours(9, 30, 0, 0);

  if (checkInTime > lateThreshold) {
    status = 'late';
  }

  const attendanceData = {
    staff: staffId,
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

  
  if (status === 'late') {
    // ensure performance subdocument exists (defensive for older records)
    if (!staff.performance) {
      staff.performance = {
        score: 100,
        lateArrivals: 0,
        completedTasks: 0
      };
    }

    staff.performance.lateArrivals = (staff.performance.lateArrivals || 0) + 1;
    staff.performance.score = Math.max(0, (staff.performance.score || 100) - 5);
    await staff.save();
  }

  res.status(201).json({
    success: true,
    data: attendance
  });
});


// Staff can request a leave for a date or range. If type is 'emergency' it is auto-approved.
const requestLeave = asyncHandler(async (req, res, next) => {
  const { staffId, fromDate, toDate, type, purpose } = req.body;

  // derive staff if not provided and requester is staff
  let targetStaffId = staffId;
  if (!targetStaffId && req.user.role === 'staff') {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) return next(new ErrorResponse('Staff record not found', 404));
    targetStaffId = staff._id;
  }

  if (!targetStaffId) return next(new ErrorResponse('staffId required', 400));
  if (!fromDate || !toDate) return next(new ErrorResponse('fromDate and toDate required', 400));

  const start = new Date(fromDate);
  const end = new Date(toDate);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  const created = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    const dateISO = new Date(d).toISOString();
    const notesPrefix = (type === 'emergency') ? 'EMERGENCY: ' : 'NORMAL: ';
    const notes = (purpose && purpose.trim()) ? `${notesPrefix}${purpose.trim()}` : `${notesPrefix}${type === 'emergency' ? 'Emergency Leave' : 'Normal Leave'}`;

    const attendanceData = {
      staff: targetStaffId,
      branch: (await Staff.findById(targetStaffId)).branch,
      date: dateISO,
      status: 'leave',
      notes,
      requestedBy: req.user._id,
      approved: type === 'emergency' ? true : false
    };

    try {
      const rec = await Attendance.create(attendanceData);
      created.push(rec);
    } catch (err) {
      // skip duplicates or errors
    }
  }

  res.status(201).json({ success: true, created });
});

const cancelLeave = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const attendance = await Attendance.findById(id);
  if (!attendance || attendance.isDeleted) return next(new ErrorResponse('Attendance record not found', 404));

  // only requester or admin/chairman can cancel
  if (req.user.role === 'staff') {
    if (!attendance.requestedBy || attendance.requestedBy.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to cancel this leave', 403));
    }
  }

  attendance.isDeleted = true;
  await attendance.save();
  res.status(200).json({ success: true });
});




const checkOut = asyncHandler(async (req, res) => {
  const { staffId, photo, location, deviceInfo } = req.body;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  
  const attendance = await Attendance.findOne({
    staff: staffId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    },
    isDeleted: false
  });
  const checkOutTime = new Date();

  
  const checkInTime = new Date(attendance.checkIn.time);
  const workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); 

  
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




const markAttendanceManually = asyncHandler(async (req, res, next) => {
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

  
  const staff = await Staff.findById(staffId);
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }

  if (req.user.role === 'admin') {
    if (!req.user.branch || staff.branch.toString() !== req.user.branch.toString()) {
      return next(new ErrorResponse('Not authorized to mark attendance for this staff', 403));
    }
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  
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




const updateAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance || attendance.isDeleted) {
    return next(new ErrorResponse('Attendance record not found', 404));
  }

  if (req.user.role === 'admin') {
    if (!req.user.branch || attendance.branch.toString() !== req.user.branch.toString()) {
      return next(new ErrorResponse('Not authorized to update this attendance record', 403));
    }
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




const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance || attendance.isDeleted) {
    return next(new ErrorResponse('Attendance record not found', 404));
  }

  if (req.user.role === 'admin') {
    if (!req.user.branch || attendance.branch.toString() !== req.user.branch.toString()) {
      return next(new ErrorResponse('Not authorized to delete this attendance record', 403));
    }
  }

  attendance.isDeleted = true;
  await attendance.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});




const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { branch, startDate, endDate } = req.query;

  let query = { isDeleted: false };
  if (req.user.role === 'admin') {
    if (req.user.branch) query.branch = req.user.branch;
  } else if (branch) {
    query.branch = branch;
  }

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
  getMyAttendance,
  getAttendanceById,
  checkIn,
  checkOut,
  markAttendanceManually,
  updateAttendance,
  deleteAttendance,
  requestLeave,
  cancelLeave,
  getAttendanceSummary
};