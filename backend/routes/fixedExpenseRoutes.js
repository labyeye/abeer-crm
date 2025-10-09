const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createFixedExpense,
  listFixedExpenses,
  updateFixedExpense,
  deleteFixedExpense,
  createFromInventory,
  getMonthlyFixedExpensesTotal,
  markPaymentStatus,
  getMonthlyFixedExpensesStatus,
} = require('../controller/fixedExpenseController');

router.use(protect);

router.route('/')
  .get(authorize('chairman','admin','manager'), listFixedExpenses)
  .post(authorize('chairman','admin','manager'), createFixedExpense);

router.route('/:id')
  .put(authorize('chairman','admin','manager'), updateFixedExpense)
  .delete(authorize('chairman','admin'), deleteFixedExpense);

router.route('/from-inventory/:inventoryId')
  .post(authorize('chairman','admin','manager'), createFromInventory);

router.route('/monthly/total')
  .get(authorize('chairman','admin','manager','staff'), getMonthlyFixedExpensesTotal);

// mark payment for a fixed expense month
router.route('/:id/payment')
  .post(authorize('chairman','admin','manager'), markPaymentStatus);

// get paid / unpaid totals for current month
router.route('/monthly/status')
  .get(authorize('chairman','admin','manager','staff'), getMonthlyFixedExpensesStatus);

module.exports = router;
