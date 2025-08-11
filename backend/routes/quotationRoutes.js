const express = require('express');
const router = express.Router();
const {
  getAllQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertToBooking,
  sendFollowUp,
  getQuotationStats
} = require('../controller/quotationController');
const { protect, authorize } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Routes
router.route('/')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getAllQuotations)
  .post(authorize('chairman', 'company_admin', 'branch_admin'), createQuotation);

router.route('/stats')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getQuotationStats);

router.route('/:id')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getQuotation)
  .put(authorize('chairman', 'company_admin', 'branch_admin'), updateQuotation)
  .delete(authorize('chairman', 'company_admin'), deleteQuotation);

router.route('/:id/convert-to-booking')
  .post(authorize('chairman', 'company_admin', 'branch_admin'), convertToBooking);

router.route('/:id/follow-up')
  .post(authorize('chairman', 'company_admin', 'branch_admin'), sendFollowUp);

module.exports = router;
