const Task = require('../models/Task');
const Booking = require('../models/Booking');
const Staff = require('../models/Staff');
const taskAutoAssignment = require('../services/taskAutoAssignment');
const automatedMessaging = require('../services/automatedMessaging');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');




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
  
  
  if (assignedStaff.length > 0) {
    const assignmentData = assignedStaff.map(staffId => ({
      staff: staffId,
      role: 'staff',
      assignedDate: new Date()
    }));
    
    task.assignedTo = assignmentData;
    task.status = 'assigned';
    await task.save();
    
    
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




const updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);
  
  if (!task || task.isDeleted) {
    return next(new ErrorResponse('Task not found', 404));
  }
  
  
  if (req.user.role === 'staff') {
    
    const isAssigned = task.assignedTo.some(assignment => 
      assignment.staff.toString() === req.user.staffId
    );
    if (!isAssigned) {
      return next(new ErrorResponse('Not authorized to update this task', 403));
    }
    
    
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




const assignStaffToTask = asyncHandler(async (req, res, next) => {
  const { staffId, role = 'staff' } = req.body;
  
  const task = await Task.findById(req.params.id);
  if (!task || task.isDeleted) {
    return next(new ErrorResponse('Task not found', 404));
  }
  
  
  const alreadyAssigned = task.assignedTo.some(assignment => 
    assignment.staff.toString() === staffId
  );
  
  if (alreadyAssigned) {
    return next(new ErrorResponse('Staff already assigned to this task', 400));
  }
  
  
  task.assignedTo.push({
    staff: staffId,
    role,
    assignedDate: new Date()
  });
  
  task.status = 'assigned';
  await task.save();
  
  
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




const completeTask = asyncHandler(async (req, res, next) => {
  const { notes, completionPhotos = [] } = req.body;
  
  const task = await Task.findById(req.params.id)
    .populate('booking')
    .populate('assignedTo.staff');
  
  if (!task || task.isDeleted) {
    return next(new ErrorResponse('Task not found', 404));
  }
  
  
  if (req.user.role === 'staff') {
    const isAssigned = task.assignedTo.some(assignment => 
      assignment.staff._id.toString() === req.user.staffId
    );
    if (!isAssigned) {
      return next(new ErrorResponse('Not authorized to complete this task', 403));
    }
  }
  
  
  task.status = 'completed';
  task.completedAt = new Date();
  task.completionNotes = notes;
  task.completionPhotos = completionPhotos;
  task.actualEndTime = new Date();
  
  await task.save();
  
  
  for (const assignment of task.assignedTo) {
    const staff = await Staff.findById(assignment.staff._id);
    if (staff) {
      staff.performance.completedTasks += 1;
      staff.performance.score = Math.min(100, staff.performance.score + 2); 
      await staff.save();
    }
  }
  
  res.status(200).json({
    success: true,
    data: task
  });
});




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




const getTaskStats = asyncHandler(async (req, res, next) => {
  let matchQuery = { isDeleted: false };
  
  
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
