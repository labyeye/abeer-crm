const Inventory = require("../models/Inventory");
const asyncHandler = require("../utils/asyncHandler");




exports.getInventory = asyncHandler(async (req, res, next) => {
  
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
    branch
  } = req.query;

  
  let query = {};

  // normalize user's branch id
  const userBranch = req.user && (req.user.branchId || req.user.branch) ? String(req.user.branchId || req.user.branch) : null;

  // If user is not chairman, restrict inventory to their branch
  if (req.user.role !== 'chairman') {
    if (userBranch) query.branch = userBranch;
  } else {
    // chairman may pass a branch query param to filter
    if (branch) {
      console.log('Chairman filtering by branch:', branch);
      query.branch = branch;
    }
  }
  
  console.log('Final inventory query:', JSON.stringify(query));

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
      { path: "branch", select: "name code" },
    ],
  };

  const inventory = await Inventory.paginate(query, options);

  res.status(200).json({
    success: true,
    data: inventory,
  });
});




exports.getInventoryItem = asyncHandler(async (req, res, next) => {
  
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




exports.createInventoryItem = asyncHandler(async (req, res, next) => {
  
  if (!["chairman", "admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman, admin, and manager can create inventory items.",
    });
  }

  
  req.body.createdBy = req.user.id;

  // If requester is admin/manager (branch-scoped), ensure the inventory is tied to their branch
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    if (!req.user.branch) {
      return res.status(400).json({ success: false, message: 'Branch not found for user' });
    }
    req.body.branch = req.user.branch;
  } else if (req.user.role === 'chairman') {
    // chairman may pass branch id or branch code
    if (req.body.branch && req.body.branch.length && !require('mongoose').Types.ObjectId.isValid(req.body.branch)) {
      const Branch = require('../models/Branch');
      const branchDoc = await Branch.findOne({ code: req.body.branch });
      if (!branchDoc) return res.status(400).json({ success: false, message: 'Branch not found for provided code' });
      req.body.branch = branchDoc._id;
    }
  } else if (!req.body.branch) {
    // For unexpected roles, require explicit branch or fail
    return res.status(400).json({ success: false, message: 'Branch is required' });
  }

  const inventory = await Inventory.create(req.body);

  res.status(201).json({
    success: true,
    data: inventory,
  });
});




exports.updateInventoryItem = asyncHandler(async (req, res, next) => {
  
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

  // Build sanitized payload
  const payload = {};
  Object.keys(req.body || {}).forEach((k) => {
    const v = req.body[k];
    if (v === '' || v === undefined) return; // skip empty values which often cause cast errors
    payload[k] = v;
  });

  // Prevent non-chairman from changing branch
  if (req.user.role !== 'chairman' && payload.branch) delete payload.branch;

  // Coerce numeric fields if present
  if (payload.quantity !== undefined) payload.quantity = Number(payload.quantity);
  if (payload.minQuantity !== undefined) payload.minQuantity = Number(payload.minQuantity);
  if (payload.maxQuantity !== undefined) payload.maxQuantity = Number(payload.maxQuantity);
  if (payload.purchasePrice !== undefined) payload.purchasePrice = Number(payload.purchasePrice);
  if (payload.sellingPrice !== undefined) payload.sellingPrice = Number(payload.sellingPrice);

  // Apply to document and save (runs schema validators and pre-save hooks)
  Object.assign(inventory, payload);
  inventory = await inventory.save();

  res.status(200).json({
    success: true,
    data: inventory,
  });
});




exports.deleteInventoryItem = asyncHandler(async (req, res, next) => {
  
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




exports.updateQuantity = asyncHandler(async (req, res, next) => {
  
  if (!["chairman", "admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only chairman, admin, and manager can update inventory quantities.",
    });
  }

  let { quantity, operation, reason } = req.body;

  // coerce quantity to number
  quantity = Number(quantity);

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

  let newQuantity = Number(inventory.quantity || 0);

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




exports.getInventoryStats = asyncHandler(async (req, res, next) => {
  
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




exports.searchInventory = asyncHandler(async (req, res, next) => {
  
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
