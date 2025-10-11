const Advance = require('../models/Advance');
const Staff = require('../models/Staff');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// Create an advance record for a staff member
const createAdvance = asyncHandler(async (req, res) => {
  const staffId = req.params.staffId || req.body.staff;
  if (!staffId) return res.status(400).json({ success: false, message: 'Staff id required' });

  const staff = await Staff.findById(staffId);
  if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

  const amount = Number(req.body.amount || req.body.advance || 0);
  if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Amount must be > 0' });

  const adv = await Advance.create({
    company: req.user.company || req.user.companyId,
    branch: staff.branch,
    staff: staffId,
    amount,
    remaining: amount,
    notes: req.body.notes || '',
    createdBy: req.user.id
  });

  // Optionally apply the advance to a salary for a given month/year
  // For safety: do NOT create or modify Salary records by default when an advance is recorded.
  // Older behavior auto-applied advance to salary when `applyToSalary` was truthy. That caused
  // advances to appear in salary history immediately. To avoid that, we only apply to a salary
  // when the caller explicitly passes `createSalary: true` alongside `applyToSalary`.
  const applyTo = req.body.applyToSalary;
  const createSalary = req.body.createSalary === true || req.body.createSalary === 'true';
  let appliedSalary = null;
  if (applyTo && createSalary) {
    const targetMonth = Number(req.body.targetMonth || (new Date().getMonth() + 1));
    const targetYear = Number(req.body.targetYear || new Date().getFullYear());

    // Find existing salary or create a pending one
    const salary = await require('../models/Salary').findOne({ staff: staffId, month: targetMonth, year: targetYear, isDeleted: false });
    if (salary) {
      // update deductions and netSalary
      const prevAdvance = Number(salary.deductions?.advance || 0);
      const newAdvance = prevAdvance + amount;
      const prevTotal = Number(salary.deductions?.total || 0);
      const newTotal = prevTotal + amount;
      salary.deductions = { ...salary.deductions, advance: newAdvance, total: newTotal };
      salary.netSalary = Number(salary.basicSalary || 0) + Number(salary.allowances || 0) - newTotal + Number(salary.performance?.bonus || 0) - Number(salary.performance?.penalty || 0);
      try {
        await salary.save();
        appliedSalary = salary;
      } catch (err) {
        console.error('Failed to apply advance to existing salary:', err);
        return res.status(500).json({ success: false, message: 'Failed to apply advance to salary', error: err.message });
      }
    } else {
      // Create a minimal salary doc with this advance applied
      const basic = Number(req.body.basicSalary ?? staff.salary ?? 0);
      const allowances = Number(req.body.allowances ?? 0);
      const totalDeductions = Number(amount);
      const net = basic + allowances - totalDeductions;
      const Salary = require('../models/Salary');
      try {
        appliedSalary = await Salary.create({
          company: req.user.company || req.user.companyId,
          branch: staff.branch,
          staff: staffId,
          month: targetMonth,
          year: targetYear,
          basicSalary: basic,
          allowances,
          deductions: { advance: amount, total: totalDeductions },
          netSalary: net,
          paymentStatus: 'partial',
          period: `${new Date(Number(targetYear), Number(targetMonth) - 1).toLocaleString('default', { month: 'long' })} ${targetYear}`
        });
      } catch (err) {
        console.error('Failed to create salary when applying advance:', err);
        return res.status(500).json({ success: false, message: 'Failed to create salary when applying advance', error: err.message });
      }
    }
  }

  res.status(201).json({ success: true, data: adv, appliedSalary });
});

// List advances for a staff member
const listAdvances = asyncHandler(async (req, res) => {
  const staffId = req.params.staffId;
  const query = { isDeleted: false };
  if (staffId) query.staff = staffId;
  if (req.query.branch) query.branch = req.query.branch;

  const advs = await Advance.find(query).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: advs.length, data: advs });
});

module.exports = { createAdvance, listAdvances };
