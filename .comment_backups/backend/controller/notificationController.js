const Notification = require('../models/Notification');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Access smart link and get notification details
// @route   GET /api/notifications/link/:token
// @access  Public
const accessSmartLink = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  
  // Find notification by token
  const notification = await Notification.findOne({
    'smartLink.token': token,
    'smartLink.isActive': true,
    'smartLink.expiresAt': { $gt: new Date() }
  })
  .populate('relatedTo.quotation')
  .populate('relatedTo.booking')
  .populate('relatedTo.invoice')
  .populate('relatedTo.task')
  .populate('recipient.client')
  .populate('recipient.staff')
  .populate('company')
  .populate('branch');

  if (!notification) {
    return next(new ErrorResponse('Invalid or expired link', 404));
  }

  // Check access limits
  if (notification.smartLink.accessCount >= notification.smartLink.maxAccess) {
    return next(new ErrorResponse('Link access limit exceeded', 403));
  }

  // Increment access count and mark as read
  notification.smartLink.accessCount += 1;
  notification.status = 'read';
  notification.readAt = new Date();
  await notification.save();

  // Prepare response data based on notification type
  let responseData = {
    notification: {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
      company: notification.company,
      branch: notification.branch
    }
  };

  // Add specific data based on related entity
  if (notification.relatedTo.quotation) {
    responseData.quotation = notification.relatedTo.quotation;
    responseData.viewType = 'quotation';
  }

  if (notification.relatedTo.booking) {
    responseData.booking = notification.relatedTo.booking;
    responseData.viewType = 'booking';
  }

  if (notification.relatedTo.invoice) {
    responseData.invoice = notification.relatedTo.invoice;
    responseData.viewType = 'invoice';
  }

  if (notification.relatedTo.task) {
    responseData.task = notification.relatedTo.task;
    responseData.viewType = 'task';
  }

  // Add recipient info
  if (notification.recipient.client) {
    responseData.recipient = {
      type: 'client',
      details: notification.recipient.client
    };
  } else if (notification.recipient.staff) {
    responseData.recipient = {
      type: 'staff',
      details: notification.recipient.staff
    };
  }

  res.status(200).json({
    success: true,
    data: responseData
  });
});

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
const getAllNotifications = asyncHandler(async (req, res, next) => {
  const { type, status, unreadOnly, limit = 20 } = req.query;
  
  let query = { isDeleted: false };
  
  // Filter by user role and permissions
  if (req.user.role === 'client') {
    query['recipient.client'] = req.user.clientId;
  } else if (req.user.role === 'staff') {
    query['recipient.staff'] = req.user.staffId;
  } else {
    // Admin/Manager can see company/branch notifications
    query.company = req.user.companyId;
    if (req.user.role !== 'chairman' && req.user.branchId) {
      query.branch = req.user.branchId;
    }
  }
  
  if (type) query.type = type;
  if (status) query.status = status;
  if (unreadOnly === 'true') query.status = { $ne: 'read' };
  
  const notifications = await Notification.find(query)
    .populate('recipient.client', 'name phone email')
    .populate('recipient.staff', 'employeeId designation')
    .populate('company', 'name')
    .populate('branch', 'name')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
  
  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }
  
  notification.status = 'read';
  notification.readAt = new Date();
  await notification.save();
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = asyncHandler(async (req, res, next) => {
  let matchQuery = { isDeleted: false };
  
  // Filter by user permissions
  if (req.user.role === 'client') {
    matchQuery['recipient.client'] = req.user.clientId;
  } else if (req.user.role === 'staff') {
    matchQuery['recipient.staff'] = req.user.staffId;
  } else {
    matchQuery.company = req.user.companyId;
    if (req.user.role !== 'chairman' && req.user.branchId) {
      matchQuery.branch = req.user.branchId;
    }
  }
  
  const stats = await Notification.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $ne: ['$status', 'read'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        sent: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  const typeStats = await Notification.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || { total: 0, unread: 0, pending: 0, sent: 0, failed: 0 },
      byType: typeStats
    }
  });
});

// @desc    Send manual notification
// @route   POST /api/notifications/send
// @access  Private (Admin/Manager)
const sendManualNotification = asyncHandler(async (req, res, next) => {
  const {
    type,
    recipientType,
    recipientId,
    title,
    message,
    priority = 'medium'
  } = req.body;
  
  // Check permissions
  if (!['chairman', 'admin', 'manager'].includes(req.user.role)) {
    return next(new ErrorResponse('Not authorized to send notifications', 403));
  }
  
  const notificationData = {
    company: req.user.companyId,
    branch: req.user.branchId,
    type,
    recipient: {
      type: recipientType
    },
    title,
    message,
    priority,
    automation: {
      isAutomated: false
    }
  };
  
  // Set recipient details
  if (recipientType === 'client') {
    notificationData.recipient.client = recipientId;
  } else if (recipientType === 'staff') {
    notificationData.recipient.staff = recipientId;
  }
  
  const notification = await Notification.create(notificationData);
  
  res.status(201).json({
    success: true,
    data: notification
  });
});

// @desc    Get smart link details for preview
// @route   GET /api/notifications/preview/:token
// @access  Public
const previewSmartLink = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  
  const notification = await Notification.findOne({
    'smartLink.token': token,
    'smartLink.isActive': true
  })
  .populate('company', 'name')
  .populate('branch', 'name');
  
  if (!notification) {
    return next(new ErrorResponse('Invalid link', 404));
  }
  
  // Return basic info without incrementing access count
  res.status(200).json({
    success: true,
    data: {
      title: notification.title,
      type: notification.type,
      company: notification.company?.name,
      branch: notification.branch?.name,
      createdAt: notification.createdAt,
      isExpired: notification.smartLink.expiresAt < new Date(),
      accessCount: notification.smartLink.accessCount,
      maxAccess: notification.smartLink.maxAccess
    }
  });
});

module.exports = {
  accessSmartLink,
  getAllNotifications,
  markAsRead,
  getNotificationStats,
  sendManualNotification,
  previewSmartLink
};
