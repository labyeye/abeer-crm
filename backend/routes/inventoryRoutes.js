const express = require('express');
const {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  updateQuantity,
  getInventoryStats,
  searchInventory
} = require('../controller/inventoryController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes
router.route('/')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getInventory)
  .post(authorize('chairman', 'admin', 'manager'), createInventoryItem);

router.route('/stats')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getInventoryStats);

router.route('/search')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), searchInventory);

router.route('/:id')
  .get(authorize('chairman', 'admin', 'manager', 'staff'), getInventoryItem)
  .put(authorize('chairman', 'admin', 'manager'), updateInventoryItem)
  .delete(authorize('chairman', 'admin', 'manager'), deleteInventoryItem);

router.route('/:id/quantity')
  .patch(authorize('chairman', 'admin', 'manager'), updateQuantity);

module.exports = router; 