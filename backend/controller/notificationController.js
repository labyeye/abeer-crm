const Notification = require('../models/Notification');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');




const accessSmartLink = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  
  
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

  
  if (notification.smartLink.accessCount >= notification.smartLink.maxAccess) {
    return next(new ErrorResponse('Link access limit exceeded', 403));
  }

  
  notification.smartLink.accessCount += 1;
  notification.status = 'read';
  notification.readAt = new Date();
  await notification.save();

  
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




const getAllNotifications = asyncHandler(async (req, res, next) => {
  const { type, status, unreadOnly, limit = 20 } = req.query;
  
  let query = { isDeleted: false };
  
  
  if (req.user.role === 'client') {
    query['recipient.client'] = req.user.clientId;
  } else if (req.user.role === 'staff') {
    query['recipient.staff'] = req.user.staffId;
  } else {
    
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




const getNotificationStats = asyncHandler(async (req, res, next) => {
  let matchQuery = { isDeleted: false };
  
  
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




const sendManualNotification = asyncHandler(async (req, res, next) => {
  const {
    type,
    recipientType,
    recipientId,
    title,
    message,
    priority = 'medium'
  } = req.body;
  
  
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
