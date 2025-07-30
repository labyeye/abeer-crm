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
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getAllStaff)
  .post(authorize('chairman', 'company_admin', 'branch_admin'), createStaff);

router.route('/:id')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getStaff)
  .put(authorize('chairman', 'company_admin', 'branch_admin'), updateStaff)
  .delete(authorize('chairman', 'company_admin'), deleteStaff);

router.route('/:id/attendance')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getStaffAttendance);

router.route('/:id/performance')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getStaffPerformance)
  .put(authorize('chairman', 'company_admin', 'branch_admin'), updateStaffPerformance);

router.route('/:id/salary')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getStaffSalary);

module.exports = router; 