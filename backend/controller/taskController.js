const Task = require('../models/Task');
const Booking = require('../models/Booking');
const Staff = require('../models/Staff');
const taskAutoAssignment = require('../services/taskAutoAssignment');
const automatedMessaging = require('../services/automatedMessaging');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getAllTasks = asyncHandler(async (req, res, next) => {
  const { 
    company, 
    branch, 
    staff, 
    booking, 
    status, 
    type, 
    date, 
    startDate, 
    endDate 
  } = req.query;
  
  let query = { isDeleted: false };
  
  // Filter by user permissions
  if (req.user.role === 'staff') {
    query['assignedTo.staff'] = req.user.staffId;
  } else {
    if (company) query.company = company;
    if (branch) query.branch = branch;
    if (req.user.role !== 'chairman' && req.user.branchId) {
      query.branch = req.user.branchId;
    }
  }
  
  if (staff) query['assignedTo.staff'] = staff;
  if (booking) query.booking = booking;
  if (status) query.status = status;
  if (type) query.type = type;
  
  if (date) {
    const searchDate = new Date(date);
    query.scheduledDate = {
      $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
      $lt: new Date(searchDate.setHours(23, 59, 59, 999))
    };
  }
  
  if (startDate && endDate) {
    query.scheduledDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const tasks = await Task.find(query)
    .populate('booking', 'bookingNumber functionDetails client')
    .populate('assignedTo.staff', 'employeeId designation')
    .populate('company', 'name')
    .populate('branch', 'name')
    .sort({ scheduledDate: 1, 'scheduledTime.start': 1 });
  
  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('booking')
    .populate('assignedTo.staff')
    .populate('company')
    .populate('branch')
    .populate('createdBy', 'name email');
  
  if (!task || task.isDeleted) {
    return next(new ErrorResponse('Task not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Create task manually
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    type,
    bookingId,
    scheduledDate,
    scheduledTime,
    location,
    priority = 'medium',
    estimatedDuration,
    requirements,
    assignedStaff = []
  } = req.body;
  
  // Verify booking exists
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new ErrorResponse('Booking not found', 404));
  }
  
  const taskData = {
    title,
    description,
    type: type || 'manual',
    booking: bookingId,
    company: req.user.companyId,
    branch: req.user.branchId,
    scheduledDate,
    scheduledTime,
    location,
    priority,
    estimatedDuration,
    requirements,
    createdBy: req.user.id,
    status: 'pending'
  };
  
  const task = await Task.create(taskData);
  
  // Auto-assign if staff specified
  if (assignedStaff.length > 0) {
    const assignmentData = assignedStaff.map(staffId => ({
      staff: staffId,
      role: 'staff',
      assignedDate: new Date()
    }));
    
    task.assignedTo = assignmentData;
    task.status = 'assigned';
    await task.save();
    
    // Send notifications to assigned staff
    const staffMembers = await Staff.find({ _id: { $in: assignedStaff } });
    await automatedMessaging.sendTaskAssigned({
      staff: staffMembers,
      task: task,
      booking: booking,
      company: booking.company,
      branch: booking.branch
    });
  }
  
  res.status(201).json({
    success: true,
    data: task
  });
});

// @desc    Auto-assign tasks for booking
// @route   POST /api/tasks/auto-assign/:bookingId
// @access  Private
const autoAssignTasks = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.params;
  
  try {
    const assignmentResults = await taskAutoAssignment.autoAssignTasks(bookingId);
    
    res.status(200).json({
      success: true,
      message: 'Tasks auto-assigned successfully',
      data: assignmentResults
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);
  
  if (!task || task.isDeleted) {
    return next(new ErrorResponse('Task not found', 404));
  }
  
  // Check permissions
  if (req.user.role === 'staff') {
    // Staff can only update tasks assigned to them
    const isAssigned = task.assignedTo.some(assignment => 
      assignment.staff.toString() === req.user.staffId
    );
    if (!isAssigned) {
      return next(new ErrorResponse('Not authorized to update this task', 403));
    }
    
    // Staff can only update certain fields
    const allowedFields = ['status', 'progress', 'notes', 'actualStartTime', 'actualEndTime'];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    req.body = updateData;
  }
  
  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('assignedTo.staff');
  
  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Assign staff to task
// @route   POST /api/tasks/:id/assign
// @access  Private
const assignStaffToTask = asyncHandler(async (req, res, next) => {
  const { staffId, role = 'staff' } = req.body;
  
  const task = await Task.findById(req.params.id);
  if (!task || task.isDeleted) {
    return next(new ErrorResponse('Task not found', 404));
  }
  
  // Check if staff is already assigned
  const alreadyAssigned = task.assignedTo.some(assignment => 
    assignment.staff.toString() === staffId
  );
  
  if (alreadyAssigned) {
    return next(new ErrorResponse('Staff already assigned to this task', 400));
  }
  
  // Add staff assignment
  task.assignedTo.push({
    staff: staffId,
    role,
    assignedDate: new Date()
  });
  
  task.status = 'assigned';
  await task.save();
  
  // Send notification to newly assigned staff
  const staff = await Staff.findById(staffId).populate('user');
  const booking = await Booking.findById(task.booking).populate('client company branch');
  
  await automatedMessaging.sendTaskAssigned({
    staff: [staff],
    task: task,
    booking: booking,
    company: booking.company,
    branch: booking.branch
  });
  
  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Skip task with reason
// @route   POST /api/tasks/:id/skip
// @access  Private
const skipTask = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  
  if (!reason) {
    return next(new ErrorResponse('Reason is required for skipping task', 400));
  }
  
  try {
    const result = await taskAutoAssignment.skipTask(
      req.params.id, 
      reason, 
      req.user.id
    );
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});

// @desc    Complete task
// @route   POST /api/tasks/:id/complete
// @access  Private
const completeTask = asyncHandler(async (req, res, next) => {
  const { notes, completionPhotos = [] } = req.body;
  
  const task = await Task.findById(req.params.id)
    .populate('booking')
    .populate('assignedTo.staff');
  
  if (!task || task.isDeleted) {
    return next(new ErrorResponse('Task not found', 404));
  }
  
  // Check if user is assigned to this task (for staff)
  if (req.user.role === 'staff') {
    const isAssigned = task.assignedTo.some(assignment => 
      assignment.staff._id.toString() === req.user.staffId
    );
    if (!isAssigned) {
      return next(new ErrorResponse('Not authorized to complete this task', 403));
    }
  }
  
  // Update task status
  task.status = 'completed';
  task.completedAt = new Date();
  task.completionNotes = notes;
  task.completionPhotos = completionPhotos;
  task.actualEndTime = new Date();
  
  await task.save();
  
  // Update staff performance scores
  for (const assignment of task.assignedTo) {
    const staff = await Staff.findById(assignment.staff._id);
    if (staff) {
      staff.performance.completedTasks += 1;
      staff.performance.score = Math.min(100, staff.performance.score + 2); // Increase score for completion
      await staff.save();
    }
  }
  
  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Get tasks for staff dashboard
// @route   GET /api/tasks/my-tasks
// @access  Private (Staff)
const getMyTasks = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'staff') {
    return next(new ErrorResponse('This endpoint is for staff only', 403));
  }
  
  const { status, date } = req.query;
  let query = {
    'assignedTo.staff': req.user.staffId,
    isDeleted: false
  };
  
  if (status) query.status = status;
  
  if (date) {
    const searchDate = new Date(date);
    query.scheduledDate = {
      $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
      $lt: new Date(searchDate.setHours(23, 59, 59, 999))
    };
  } else {
    // Default to today's and upcoming tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query.scheduledDate = { $gte: today };
  }
  
  const tasks = await Task.find(query)
    .populate('booking', 'bookingNumber functionDetails client')
    .populate('booking.client', 'name phone')
    .sort({ scheduledDate: 1, 'scheduledTime.start': 1 });
  
  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = asyncHandler(async (req, res, next) => {
  let matchQuery = { isDeleted: false };
  
  // Filter by user permissions
  if (req.user.role === 'staff') {
    matchQuery['assignedTo.staff'] = req.user.staffId;
  } else {
    matchQuery.company = req.user.companyId;
    if (req.user.role !== 'chairman' && req.user.branchId) {
      matchQuery.branch = req.user.branchId;
    }
  }
  
  const stats = await Task.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        assigned: {
          $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        skipped: {
          $sum: { $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0] }
        }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: stats[0] || { total: 0, pending: 0, assigned: 0, inProgress: 0, completed: 0, skipped: 0 }
  });
});

module.exports = {
  getAllTasks,
  getTask,
  createTask,
  autoAssignTasks,
  updateTask,
  assignStaffToTask,
  skipTask,
  completeTask,
  getMyTasks,
  getTaskStats
};
