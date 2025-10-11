const Loan = require('../models/Loan');
const Branch = require('../models/Branch');
const Client = require('../models/Client');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// Create a loan record
const createLoan = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const { type, branch, amount, dateReceived } = payload;
  if (!type || !['bank', 'third_party'].includes(type)) return res.status(400).json({ success: false, message: 'type must be bank or third_party' });
  if (!branch) return res.status(400).json({ success: false, message: 'branch required' });
  if (!amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: 'amount required' });
  if (!dateReceived) return res.status(400).json({ success: false, message: 'dateReceived required' });

  const loanData = {
    company: req.user.company || req.user.companyId,
    branch,
    type,
    amount: Number(amount),
    remainingAmount: Number(amount),
    dateReceived: new Date(dateReceived),
    interestRate: Number(payload.interestRate || 0),
    interestPeriodUnit: payload.interestPeriodUnit || 'monthly',
    tenure: Number(payload.tenure || 0),
    tenureUnit: payload.tenureUnit || 'months',
    purpose: payload.purpose || '',
    createdBy: req.user.id
  };

  if (type === 'bank') {
    loanData.bankName = payload.bankName || '';
    loanData.bankAccountNumber = payload.bankAccountNumber || '';
    loanData.bankBranch = payload.bankBranch || '';
  } else {
    // third_party
    if (!payload.client) return res.status(400).json({ success: false, message: 'client required for third_party loan' });
    loanData.client = payload.client;
  }

  const loan = await Loan.create(loanData);
  res.status(201).json({ success: true, data: loan });
});

// List loans (optionally by branch)
const listLoans = asyncHandler(async (req, res) => {
  const query = { isDeleted: false };
  if (req.query.branch) query.branch = req.query.branch;
  if (req.query.type) query.type = req.query.type;
  const loans = await Loan.find(query).populate('client', 'name phone email').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: loans.length, data: loans });
});

// Repay a loan (record repayment)
const repayLoan = asyncHandler(async (req, res) => {
  const loanId = req.params.id;
  let { amount, date, note, full } = req.body;
  const loan = await Loan.findById(loanId);
  if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

  const paidAt = date ? new Date(date) : new Date();

  // compute early payment: if paid within 5 days of receipt, no interest
  const msDiff = paidAt.getTime() - new Date(loan.dateReceived).getTime();
  const daysSince = Math.floor(msDiff / (1000 * 60 * 60 * 24));

  let appliedInterest = 0;
  let paidAmount = Number(amount || 0);

  // if caller requested full payment, compute remaining + interest unless early
  if (full === true || full === 'true') {
    const principal = Number(loan.remainingAmount || loan.amount || 0);
    if (daysSince <= 5) {
      appliedInterest = 0;
    } else {
      // calculate interest depending on interestPeriodUnit
      const rate = Number(loan.interestRate || 0) / 100; // as decimal
      if (loan.interestPeriodUnit === 'yearly') {
        // approximate days/365
        appliedInterest = principal * rate * (daysSince / 365);
      } else {
        // monthly: convert to annual then prorate by days
        appliedInterest = principal * rate * (daysSince / 365);
      }
      appliedInterest = Math.round(appliedInterest * 100) / 100;
    }
    paidAmount = Math.round((principal + appliedInterest) * 100) / 100;
  } else {
    // custom partial amount provided by user
    if (!amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: 'amount required' });
    // for partial payments we do not auto-calculate interest here; interest accrues until full repayment
    paidAmount = Number(amount);
    appliedInterest = 0;
  }

  loan.repayments = loan.repayments || [];
  loan.repayments.push({ amount: paidAmount, date: paidAt, note: note || '', createdBy: req.user.id });
  loan.remainingAmount = Math.max(0, Number(loan.remainingAmount || 0) - paidAmount + appliedInterest);
  // if fully paid or overpaid, clamp
  if (loan.remainingAmount <= 0) loan.remainingAmount = 0;
  await loan.save();

  res.status(200).json({ success: true, data: loan, appliedInterest, paidAmount });
});

// Update a loan (edit details)
const updateLoan = asyncHandler(async (req, res) => {
  const loanId = req.params.id;
  const payload = req.body || {};
  const loan = await Loan.findById(loanId);
  if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

  // allowed fields to update
  const updatable = ['type','branch','bankName','bankAccountNumber','bankBranch','client','amount','dateReceived','interestRate','interestPeriodUnit','tenure','tenureUnit','purpose'];
  updatable.forEach(f => {
    if (payload[f] !== undefined) loan[f] = payload[f];
  });

  // if amount changed, recompute remainingAmount = max(0, newAmount - sum(repayments))
  if (payload.amount !== undefined) {
    const newAmount = Number(payload.amount || 0);
    const paidSoFar = (loan.repayments || []).reduce((s, r) => s + (r.amount || 0), 0);
    loan.remainingAmount = Math.max(0, newAmount - paidSoFar);
  }

  await loan.save();
  res.status(200).json({ success: true, data: loan });
});

// Delete (soft) a loan
const deleteLoan = asyncHandler(async (req, res) => {
  const loanId = req.params.id;
  const loan = await Loan.findById(loanId);
  if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
  loan.isDeleted = true;
  await loan.save();
  res.status(200).json({ success: true, message: 'Loan deleted' });
});

// Get loan summary (total taken, total remaining, by branch)
const getLoanSummary = asyncHandler(async (req, res) => {
  const branch = req.query.branch;
  const match = { isDeleted: false };
  if (branch) match.branch = branch;
  const loans = await Loan.find(match);
  const totalTaken = loans.reduce((s, l) => s + (l.amount || 0), 0);
  const totalRemaining = loans.reduce((s, l) => s + (l.remainingAmount || 0), 0);
  res.status(200).json({ success: true, data: { totalTaken, totalRemaining, count: loans.length } });
});

module.exports = { createLoan, listLoans, repayLoan, getLoanSummary, updateLoan, deleteLoan };
