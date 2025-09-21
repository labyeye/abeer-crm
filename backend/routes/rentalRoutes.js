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


router.use(protect);


router.use(authorize('chairman', 'admin', 'manager', 'staff'));

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