const Expense = require('../models/Expense');
const DailyExpense = require('../models/DailyExpense');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');


exports.getExpenses = asyncHandler(async (req, res) => {
  const { company, branch, startDate, endDate } = req.query;
  let query = { isDeleted: false };
  if (company) query.company = company;
  if (branch) query.branch = branch;
  if (startDate && endDate) {
    query.expenseDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  const expenses = await Expense.find(query).sort({ expenseDate: -1 });
  res.status(200).json({ success: true, count: expenses.length, data: expenses });
});



exports.getFinanceAnalytics = asyncHandler(async (req, res) => {
  const { company, startDate, endDate } = req.query;

  
  const expenseMatch = { isDeleted: false };
  if (company) expenseMatch.company = company;
  if (startDate && endDate) expenseMatch.expenseDate = { $gte: new Date(startDate), $lte: new Date(endDate) };

  const expensesAgg = await Expense.aggregate([
    { $match: expenseMatch },
    { $group: { _id: '$branch', totalExpenses: { $sum: '$amount' } } }
  ]);

  // also aggregate DailyExpense (small daily expenses) by branch for the same date window
  // Note: DailyExpense schema does not use isDeleted/company fields like Expense, so avoid those filters.
  const dailyMatch = {};
  // If a date window is provided, filter by DailyExpense.date
  if (startDate && endDate) dailyMatch.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  // If a company-level filter was provided, we don't map it directly for DailyExpense (no company field).
  // Branch scoping is handled later when merging (Expense._id and DailyExpense._id correspond to branch ids).

  const dailyAgg = await DailyExpense.aggregate([
    { $match: dailyMatch },
    { $group: { _id: '$branch', totalDailyExpenses: { $sum: '$amount' } } }
  ]);

  // Merge expensesAgg and dailyAgg into a single per-branch total
  const mergedMap = new Map();
  (expensesAgg || []).forEach((e) => {
    const key = e._id ? String(e._id) : 'null';
    mergedMap.set(key, { _id: e._id, totalExpenses: Number(e.totalExpenses || 0), totalDailyExpenses: 0 });
  });
  (dailyAgg || []).forEach((d) => {
    const key = d._id ? String(d._id) : 'null';
    const existing = mergedMap.get(key);
    if (existing) {
      existing.totalDailyExpenses = Number(d.totalDailyExpenses || 0);
    } else {
      mergedMap.set(key, { _id: d._id, totalExpenses: 0, totalDailyExpenses: Number(d.totalDailyExpenses || 0) });
    }
  });

  const combinedExpensesAgg = Array.from(mergedMap.values()).map((v) => ({
    _id: v._id,
    totalExpenses: Number(v.totalExpenses || 0) + Number(v.totalDailyExpenses || 0),
    breakdown: { expenses: Number(v.totalExpenses || 0), dailyExpenses: Number(v.totalDailyExpenses || 0) }
  }));

  
  const bookingMatch = { isDeleted: false };
  if (company) bookingMatch.company = company;

  
  const dateFilter = (startDate && endDate) ? { $gte: new Date(startDate), $lte: new Date(endDate) } : null;

  const matchStage = { $match: bookingMatch };
  const addMatchStage = dateFilter ? { $match: { $or: [ { 'functionDetails.date': dateFilter }, { 'functionDetailsList.date': dateFilter } ] } } : null;

  const pipeline = [ matchStage ];
  if (addMatchStage) pipeline.push(addMatchStage);
  pipeline.push({ $group: { _id: '$branch', totalRevenue: { $sum: '$pricing.totalAmount' } } });

  const bookingsAgg = await Booking.aggregate(pipeline);

  res.status(200).json({ success: true, data: { expenses: combinedExpensesAgg, revenue: bookingsAgg } });
});
