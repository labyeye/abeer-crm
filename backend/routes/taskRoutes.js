const express = require('express');
const router = express.Router();
const {
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
} = require('../controller/taskController');
const { protect, authorize } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Routes
router.route('/')
  .get(getAllTasks)
  .post(authorize('chairman', 'company_admin', 'branch_admin'), createTask);

router.route('/stats')
  .get(getTaskStats);

router.route('/my-tasks')
  .get(authorize('staff'), getMyTasks);

router.route('/auto-assign/:bookingId')
  .post(authorize('chairman', 'company_admin', 'branch_admin'), autoAssignTasks);

router.route('/:id')
  .get(getTask)
  .put(updateTask);

router.route('/:id/assign')
  .post(authorize('chairman', 'company_admin', 'branch_admin'), assignStaffToTask);

router.route('/:id/skip')
  .post(skipTask);

router.route('/:id/complete')
  .post(completeTask);

module.exports = router;
