const Expense = require('../models/Expense');
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

  
  const bookingMatch = { isDeleted: false };
  if (company) bookingMatch.company = company;

  
  const dateFilter = (startDate && endDate) ? { $gte: new Date(startDate), $lte: new Date(endDate) } : null;

  const matchStage = { $match: bookingMatch };
  const addMatchStage = dateFilter ? { $match: { $or: [ { 'functionDetails.date': dateFilter }, { 'functionDetailsList.date': dateFilter } ] } } : null;

  const pipeline = [ matchStage ];
  if (addMatchStage) pipeline.push(addMatchStage);
  pipeline.push({ $group: { _id: '$branch', totalRevenue: { $sum: '$pricing.totalAmount' } } });

  const bookingsAgg = await Booking.aggregate(pipeline);

  res.status(200).json({ success: true, data: { expenses: expensesAgg, revenue: bookingsAgg } });
});
