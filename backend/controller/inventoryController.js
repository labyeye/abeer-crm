const Inventory = require("../models/Inventory");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get all inventory items (for chairman, admin, manager)
// @route   GET /api/inventory
// @access  Private (Chairman, Admin, Manager)
exports.getInventory = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!["chairman", "admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman, admin, and manager can view inventory.",
    });
  }

  const {
    page = 1,
    limit = 10,
    search,
    category,
    status,
    lowStock,
  } = req.query;

  // Build query
  let query = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  if (lowStock === "true") {
    query.$expr = { $lte: ["$quantity", "$minQuantity"] };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: "createdBy", select: "name email" },
      { path: "company", select: "name" },
    ],
  };

  const inventory = await Inventory.paginate(query, options);

  res.status(200).json({
    success: true,
    data: inventory,
  });
});

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private (Chairman, Admin, Manager)
exports.getInventoryItem = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!["chairman", "admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman, admin, and manager can view inventory details.",
    });
  }

  const inventory = await Inventory.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("company", "name");

  if (!inventory) {
    return res.status(404).json({
      success: false,
      message: "Inventory item not found",
    });
  }

  res.status(200).json({
    success: true,
    data: inventory,
  });
});

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private (Chairman, Admin, Manager)
exports.createInventoryItem = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!["chairman", "admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman, admin, and manager can create inventory items.",
    });
  }

  // Add createdBy field
  req.body.createdBy = req.user.id;

  const inventory = await Inventory.create(req.body);

  res.status(201).json({
    success: true,
    data: inventory,
  });
});

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Chairman, Admin, Manager)
exports.updateInventoryItem = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!["chairman", "admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman, admin, and manager can update inventory items.",
    });
  }

  let inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return res.status(404).json({
      success: false,
      message: "Inventory item not found",
    });
  }

  inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: inventory,
  });
});

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Chairman, Admin)
exports.deleteInventoryItem = asyncHandler(async (req, res, next) => {
  // Only chairman and admin can delete
  if (!["chairman", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman and admin can delete inventory items.",
    });
  }

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return res.status(404).json({
      success: false,
      message: "Inventory item not found",
    });
  }

  await inventory.deleteOne();

  res.status(200).json({
    success: true,
    message: "Inventory item deleted successfully",
  });
});

// @desc    Update inventory quantity
// @route   PATCH /api/inventory/:id/quantity
// @access  Private (Chairman, Admin, Manager)
exports.updateQuantity = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!["chairman", "admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman, admin, and manager can update inventory quantities.",
    });
  }

  const { quantity, operation, reason } = req.body;

  if (!quantity || !operation) {
    return res.status(400).json({
      success: false,
      message: "Quantity and operation are required",
    });
  }

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return res.status(404).json({
      success: false,
      message: "Inventory item not found",
    });
  }

  let newQuantity = inventory.quantity;

  switch (operation) {
    case "add":
      newQuantity += quantity;
      break;
    case "subtract":
      newQuantity -= quantity;
      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot subtract more than available quantity",
        });
      }
      break;
    case "set":
      newQuantity = quantity;
      break;
    default:
      return res.status(400).json({
        success: false,
        message: "Invalid operation. Use add, subtract, or set",
      });
  }

  inventory.quantity = newQuantity;
  inventory.lastUpdated = Date.now();
  await inventory.save();

  res.status(200).json({
    success: true,
    data: inventory,
    message: `Quantity updated successfully. New quantity: ${newQuantity}`,
  });
});

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private (Chairman, Admin, Manager)
exports.getInventoryStats = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!["chairman", "admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman, admin, and manager can view inventory statistics.",
    });
  }

  const stats = await Inventory.aggregate([
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalValue: { $sum: { $multiply: ["$quantity", "$purchasePrice"] } },
        lowStockItems: {
          $sum: {
            $cond: [{ $lte: ["$quantity", "$minQuantity"] }, 1, 0],
          },
        },
        outOfStockItems: {
          $sum: {
            $cond: [{ $eq: ["$quantity", 0] }, 1, 0],
          },
        },
      },
    },
  ]);

  const categoryStats = await Inventory.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalValue: { $sum: { $multiply: ["$quantity", "$purchasePrice"] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const statusStats = await Inventory.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const lowStockItems = await Inventory.find({
    $expr: { $lte: ["$quantity", "$minQuantity"] },
  })
    .select("name sku quantity minQuantity category")
    .limit(10)
    .sort({ quantity: 1 });

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
      },
      categoryBreakdown: categoryStats,
      statusBreakdown: statusStats,
      lowStockItems,
    },
  });
});

// @desc    Search inventory
// @route   GET /api/inventory/search
// @access  Private (Chairman, Admin, Manager)
exports.searchInventory = asyncHandler(async (req, res, next) => {
  // Check if user has permission
  if (!["chairman", "admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman, admin, and manager can search inventory.",
    });
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  const inventory = await Inventory.find(
    { $text: { $search: q } },
    { score: { $meta: "textScore" } }
  )
    .populate("createdBy", "name email")
    .populate("company", "name")
    .sort({ score: { $meta: "textScore" } })
    .limit(20);

  res.status(200).json({
    success: true,
    count: inventory.length,
    data: inventory,
  });
});
