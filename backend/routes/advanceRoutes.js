const express = require('express');
const router = express.Router();
const { createAdvance, listAdvances } = require('../controller/advanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/staff/:staffId')
  .post(authorize('chairman','admin','manager'), createAdvance)
  .get(authorize('chairman','admin','manager','staff'), listAdvances);

router.route('/')
  .get(authorize('chairman','admin','manager'), listAdvances);

module.exports = router;
