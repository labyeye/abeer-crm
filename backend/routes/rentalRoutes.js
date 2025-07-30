const express = require('express');
const {
  getAllRentals,
  getRental,
  createRental,
  updateRental,
  deleteRental,
  getRentalStats,
  getOverdueRentals
} = require('../controller/rentalController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Authorize specific roles
router.use(authorize('chairman', 'company_admin', 'branch_admin', 'staff'));

router.route('/')
  .get(getAllRentals)
  .post(createRental);

router.route('/stats')
  .get(getRentalStats);

router.route('/overdue')
  .get(getOverdueRentals);

router.route('/:id')
  .get(getRental)
  .put(updateRental)
  .delete(deleteRental);

module.exports = router; 