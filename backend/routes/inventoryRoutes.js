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

const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes
router.route('/')
  .get(getInventory)
  .post(createInventoryItem);

router.route('/stats')
  .get(getInventoryStats);

router.route('/search')
  .get(searchInventory);

router.route('/:id')
  .get(getInventoryItem)
  .put(updateInventoryItem)
  .delete(deleteInventoryItem);

router.route('/:id/quantity')
  .patch(updateQuantity);

module.exports = router; 