const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking
} = require('../controller/bookingController');
router.route('/')
  .get(protect, getBookings)
  .post(protect, authorize('chairman', 'admin'), createBooking);

router.route('/:id')
  .get(protect, getBooking)
  .put(protect, authorize('chairman', 'admin'), updateBooking)
  .delete(protect, authorize('chairman', 'admin'), deleteBooking);

module.exports = router;
