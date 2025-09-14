const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getExpenses, getFinanceAnalytics } = require('../controller/expenseController');

router.use(protect);

router.route('/')
  .get(authorize('chairman', 'admin', 'manager'), getExpenses);

router.route('/analytics')
  .get(authorize('chairman', 'admin'), getFinanceAnalytics);

module.exports = router;
