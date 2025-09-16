const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  getMyAttendance,
  getAttendanceById,
  checkIn,
  checkOut,
  markAttendanceManually,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary
} = require('../controller/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Routes
router.route('/')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getAllAttendance);

router.route('/summary')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getAttendanceSummary);

router.route('/my-attendance')
  .get(authorize('staff'), getMyAttendance);

router.route('/checkin')
  .post(authorize('staff', 'chairman', 'admin', 'manager'), checkIn);

router.route('/checkout')
  .post(authorize('staff', 'chairman', 'admin', 'manager'), checkOut);

router.route('/manual')
  .post(authorize('chairman', 'admin', 'manager'), markAttendanceManually);

router.route('/:id')
  .get(getAttendanceById)
  .put(authorize('chairman', 'admin', 'manager'), updateAttendance)
  .delete(authorize('chairman', 'admin'), deleteAttendance);

module.exports = router; 