const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  getAttendance,
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
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getAllAttendance);

router.route('/summary')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getAttendanceSummary);

router.route('/checkin')
  .post(authorize('staff', 'chairman', 'company_admin', 'branch_admin'), checkIn);

router.route('/checkout')
  .post(authorize('staff', 'chairman', 'company_admin', 'branch_admin'), checkOut);

router.route('/manual')
  .post(authorize('chairman', 'company_admin', 'branch_admin'), markAttendanceManually);

router.route('/:id')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getAttendance)
  .put(authorize('chairman', 'company_admin', 'branch_admin'), updateAttendance)
  .delete(authorize('chairman', 'company_admin'), deleteAttendance);

module.exports = router; 