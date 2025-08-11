const express = require('express');
const router = express.Router();
const {
  accessSmartLink,
  getAllNotifications,
  markAsRead,
  getNotificationStats,
  sendManualNotification,
  previewSmartLink
} = require('../controller/notificationController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (for smart links)
router.route('/link/:token')
  .get(accessSmartLink);

router.route('/preview/:token')
  .get(previewSmartLink);

// Protected routes
router.use(protect);

router.route('/')
  .get(getAllNotifications);

router.route('/stats')
  .get(getNotificationStats);

router.route('/send')
  .post(authorize('chairman', 'company_admin', 'branch_admin'), sendManualNotification);

router.route('/:id/read')
  .put(markAsRead);

module.exports = router;
