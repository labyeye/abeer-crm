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


router.use(protect);


router.route('/')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getAllTasks)
  .post(authorize('chairman', 'admin', 'manager'), createTask);

router.route('/stats')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getTaskStats);

router.route('/my-tasks')
  .get(authorize('staff'), getMyTasks);

router.route('/auto-assign/:bookingId')
  .post(authorize('chairman', 'admin', 'manager'), autoAssignTasks);

router.route('/:id')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getTask)
  .put(authorize('chairman', 'admin', 'manager', 'staff'), updateTask);

router.route('/:id/assign')
  .post(authorize('chairman', 'admin', 'manager'), assignStaffToTask);

router.route('/:id/skip')
  .post(authorize('chairman', 'admin', 'manager', 'staff'), skipTask);

router.route('/:id/complete')
  .post(authorize('chairman', 'admin', 'manager', 'staff'), completeTask);

module.exports = router;
