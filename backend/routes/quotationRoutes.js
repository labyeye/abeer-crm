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
  , getQuotationPdf
} = require('../controller/quotationController');
const { protect, authorize } = require('../middleware/auth');


router.use(protect);


router.route('/')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getAllQuotations)
  .post(authorize('chairman', 'admin', 'manager'), createQuotation);

router.route('/stats')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getQuotationStats);

router.route('/:id')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getQuotation)
  .put(authorize('chairman', 'admin', 'manager'), updateQuotation)
  .delete(authorize('chairman', 'admin'), deleteQuotation);

router.route('/:id/pdf')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getQuotationPdf);

router.route('/:id/convert-to-booking')
  .post(authorize('chairman', 'admin', 'manager'), convertToBooking);

router.route('/:id/follow-up')
  .post(authorize('chairman', 'admin', 'manager'), sendFollowUp);

module.exports = router;
