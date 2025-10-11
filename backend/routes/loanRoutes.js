const express = require('express');
const router = express.Router();
const { createLoan, listLoans, repayLoan, getLoanSummary, updateLoan, deleteLoan } = require('../controller/loanController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(authorize('chairman','admin','manager'), listLoans)
  .post(authorize('chairman','admin','manager'), createLoan);

router.route('/summary')
  .get(authorize('chairman','admin','manager'), getLoanSummary);

router.route('/:id/repay')
  .post(authorize('chairman','admin','manager'), repayLoan);

router.route('/:id')
  .put(authorize('chairman','admin','manager'), updateLoan)
  .delete(authorize('chairman','admin','manager'), deleteLoan);

module.exports = router;
