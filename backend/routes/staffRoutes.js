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
  getStaffSalary,
  createStaffSalary
} = require('../controller/staffController');
const { protect, authorize } = require('../middleware/auth');


router.use(protect);



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
  .get(authorize('chairman', 'admin', 'manager'), getStaffSalary)
  .post(authorize('chairman', 'admin', 'manager'), createStaffSalary);

module.exports = router; 