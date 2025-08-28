const express = require('express');
const {
  getAllBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchStats,
  updateBranchStats,
  updateAllBranchesStats,
  getBranches
} = require('../controller/branchController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes
router.route('/')
  .get(authorize('chairman', 'admin', 'manager'), getAllBranches)
  .post(authorize('chairman'), createBranch);

router.route('/stats')
  .get(authorize('chairman', 'admin'), getBranchStats);

router.route('/stats/update-all')
  .put(authorize('chairman'), updateAllBranchesStats);

router.route('/:id')
  .get(authorize('chairman', 'admin', 'manager'), getBranch)
  .put(authorize('chairman', 'admin'), updateBranch)
  .delete(authorize('chairman'), deleteBranch);

router.route('/:id/stats')
  .put(authorize('chairman', 'admin'), updateBranchStats);

module.exports = router;


