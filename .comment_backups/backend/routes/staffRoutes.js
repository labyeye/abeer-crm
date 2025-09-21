const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffAttendance,
  getStaffPerformance,
  updateStaffPerformance,
  getStaffSalary
} = require('../controller/staffController');
const { protect, authorize } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Routes

router.route('/')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getAllStaff)
  .post(authorize('chairman', 'admin', 'manager'), createStaff);


router.route('/:id')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getStaff)
  .put(authorize('chairman', 'admin', 'manager'), updateStaff)
  .delete(authorize('chairman', 'admin'), deleteStaff);

router.route('/:id/attendance')
  .get(authorize('chairman', 'admin', 'manager'), getStaffAttendance);

router.route('/:id/performance')
  .get(authorize('chairman', 'admin', 'manager'), getStaffPerformance)
  .put(authorize('chairman', 'admin', 'manager'), updateStaffPerformance);

router.route('/:id/salary')
  .get(authorize('chairman', 'admin', 'manager'), getStaffSalary);

module.exports = router; 