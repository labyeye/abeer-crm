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
  forceUpdateBranchStats,
  getBranches
} = require('../controller/branchController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();


router.use(protect);



router.route('/')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getAllBranches)
  .post(authorize('chairman'), createBranch);

router.route('/stats')
  .get(authorize('chairman', 'admin'), getBranchStats);

router.route('/stats/update-all')
  .put(authorize('chairman'), updateAllBranchesStats);


router.route('/:id')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getBranch)
  .put(authorize('chairman', 'admin'), updateBranch)
  .delete(authorize('chairman'), deleteBranch);

router.route('/:id/stats')
  .put(authorize('chairman', 'admin'), updateBranchStats);

router.route('/:id/stats/force')
  .put(authorize('chairman', 'admin'), forceUpdateBranchStats);

module.exports = router;


