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
  requestLeave,
  cancelLeave,
  getAttendanceSummary
} = require('../controller/attendanceController');
const { protect, authorize } = require('../middleware/auth');


router.use(protect);


router.route('/')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getAllAttendance);

router.route('/summary')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getAttendanceSummary);

router.route('/my-attendance')
  .get(authorize('staff'), getMyAttendance);

router.route('/checkin')
  .post(authorize('chairman', 'admin', 'manager'), checkIn);

router.route('/checkout')
  .post(authorize('chairman', 'admin', 'manager'), checkOut);

router.route('/request')
  .post(authorize('staff', 'chairman', 'admin', 'manager'), requestLeave);

router.route('/:id/cancel')
  .post(authorize('staff', 'chairman', 'admin', 'manager'), cancelLeave);

router.route('/manual')
  .post(authorize('chairman', 'admin', 'manager'), markAttendanceManually);

router.route('/:id')
  .get(getAttendanceById)
  .put(authorize('chairman', 'admin', 'manager'), updateAttendance)
  .delete(authorize('chairman', 'admin'), deleteAttendance);

module.exports = router; 