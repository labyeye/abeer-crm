const FixedExpense = require('../models/FixedExpense');
const Inventory = require('../models/Inventory');
const asyncHandler = require('../utils/asyncHandler');

exports.createFixedExpense = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  // attach company/branch from user if present
  if (req.user) {
    if (!payload.branch && req.user.branch) payload.branch = req.user.branch;
    if (!payload.company && req.user.company) payload.company = req.user.company;
  }
  const fx = await FixedExpense.create(payload);
  res.status(201).json({ success: true, data: fx });
});

exports.listFixedExpenses = asyncHandler(async (req, res) => {
  const { company, branch, active } = req.query;
  const q = {};
  if (company) q.company = company;
  if (branch) q.branch = branch;
  if (active !== undefined) q.isActive = active === 'true';
  const list = await FixedExpense.find(q).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: list });
});

exports.updateFixedExpense = asyncHandler(async (req, res) => {
  const fx = await FixedExpense.findById(req.params.id);
  if (!fx) return res.status(404).json({ success: false, message: 'Fixed expense not found' });
  Object.assign(fx, req.body || {});
  await fx.save();
  res.status(200).json({ success: true, data: fx });
});

exports.deleteFixedExpense = asyncHandler(async (req, res) => {
  const fx = await FixedExpense.findById(req.params.id);
  if (!fx) return res.status(404).json({ success: false, message: 'Fixed expense not found' });
  await fx.deleteOne();
  res.status(200).json({ success: true, message: 'Deleted' });
});

// Helper: create fixed expense automatically when an inventory item bought on EMI exists
exports.createFromInventoryIfEMI = asyncHandler(async (inventoryId) => {
  if (!inventoryId) return null;
  const inv = await Inventory.findById(inventoryId);
  if (!inv) return null;
  if (inv.buyingMethod === 'emi' && inv.emiDetails && inv.emiDetails.monthlyAmount) {
    // check if a fixed expense already exists for this inventory
    const exists = await FixedExpense.findOne({ inventory: inv._id, source: 'inventory' });
    if (exists) return exists;
    const fx = await FixedExpense.create({
      title: `EMI - ${inv.name}`,
      amount: inv.emiDetails.monthlyAmount,
      currency: 'INR',
      recurrence: 'monthly',
      startDate: inv.purchaseDate || new Date(),
      source: 'inventory',
      inventory: inv._id,
      emiDetails: {
        months: inv.emiDetails.months,
        downPayment: inv.emiDetails.downPayment,
        monthlyAmount: inv.emiDetails.monthlyAmount
      }
    });
    return fx;
  }
  return null;
});

// HTTP endpoint wrapper: create fixed expense from an inventory id (if EMI)
exports.createFromInventory = asyncHandler(async (req, res) => {
  const { inventoryId } = req.params;
  if (!inventoryId) return res.status(400).json({ success: false, message: 'inventoryId required' });
  const { startDate, months, monthlyAmount } = req.body || {};
  // Try to create using helper; if startDate or overrides provided, handle explicitly
  const inv = await Inventory.findById(inventoryId);
  if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

  // If not EMI and overrides are not provided, bail
  const isEMI = (inv.buyingMethod || '').toString().toLowerCase() === 'emi';
  if (!isEMI && !months && !monthlyAmount) {
    return res.status(200).json({ success: true, message: 'No EMI details and no overrides provided' });
  }

  // If a fixed expense already exists for this inventory, return it
  const exists = await FixedExpense.findOne({ inventory: inv._id, source: 'inventory' });
  if (exists && !startDate && !months && !monthlyAmount) return res.status(200).json({ success: true, data: exists, message: 'Already exists' });

  const payload = {
    title: `EMI - ${inv.name}`,
    amount: Number(monthlyAmount || inv.emiDetails?.monthlyAmount || 0) || 0,
    currency: 'INR',
    recurrence: 'monthly',
    startDate: startDate ? new Date(startDate) : (inv.purchaseDate || new Date()),
    source: 'inventory',
    inventory: inv._id,
    emiDetails: {
      months: Number(months || inv.emiDetails?.months || 0) || 0,
      downPayment: Number(inv.emiDetails?.downPayment || 0) || 0,
      monthlyAmount: Number(monthlyAmount || inv.emiDetails?.monthlyAmount || 0) || 0
    }
  };

  // create or update existing
  let fx;
  if (exists) {
    Object.assign(exists, payload);
    fx = await exists.save();
  } else {
    fx = await FixedExpense.create(payload);
  }

  res.status(201).json({ success: true, data: fx });
});

// Endpoint: compute this month's fixed expense total (for dashboard card)
exports.getMonthlyFixedExpensesTotal = asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Find active fixed expenses that started on or before end and either have no endDate or endDate >= start
  const q = { isActive: true, startDate: { $lte: end }, $or: [{ endDate: { $exists: false } }, { endDate: { $gte: start } }] };
  const list = await FixedExpense.find(q);
  const total = list.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  res.status(200).json({ success: true, data: { total, count: list.length } });
});

// Mark a specific fixed expense month's paid/unpaid
exports.markPaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { month, paid, amount } = req.body || {};
  if (!id || !month) return res.status(400).json({ success: false, message: 'id and month required' });
  const fx = await FixedExpense.findById(id);
  if (!fx) return res.status(404).json({ success: false, message: 'Fixed expense not found' });

  const monthStart = new Date(month);
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);

  // find existing payment entry
  let p = (fx.payments || []).find(pp => pp.month && new Date(pp.month).getTime() === monthStart.getTime());
  if (p) {
    p.paid = !!paid;
    if (typeof amount !== 'undefined') p.amount = Number(amount) || p.amount;
    p.paidAt = paid ? new Date() : undefined;
  } else {
    fx.payments = fx.payments || [];
    fx.payments.push({ month: monthStart, amount: Number(amount || fx.amount || 0), paid: !!paid, paidAt: paid ? new Date() : undefined });
  }

  await fx.save();
  res.status(200).json({ success: true, data: fx });
});

// Return this month's fixed expense totals split by paid/unpaid
exports.getMonthlyFixedExpensesStatus = asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const q = { isActive: true, startDate: { $lte: end }, $or: [{ endDate: { $exists: false } }, { endDate: { $gte: start } }] };
  const list = await FixedExpense.find(q);

  let paidTotal = 0;
  let unpaidTotal = 0;

  list.forEach(f => {
    const monthStart = start.getTime();
    const payment = (f.payments || []).find(pp => pp.month && new Date(pp.month).getTime() === monthStart);
    if (payment && payment.paid) paidTotal += Number(payment.amount || f.amount || 0);
    else unpaidTotal += Number(f.amount || 0);
  });

  res.status(200).json({ success: true, data: { paidTotal, unpaidTotal, count: list.length } });
});
