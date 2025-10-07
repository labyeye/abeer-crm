const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const DailyExpense = require('../models/DailyExpense');
const DailyExpensePurpose = require('../models/DailyExpensePurpose');
const { updateBranchStats } = require('../utils/branchUtils');





router.get(
  "/",
  protect,
  authorize(["chairman", "company_admin", "branch_head", "branch_staff"]),
  async (req, res) => {
    try {
        const query = {};
        // branch scoping: non-chairman users see only their branch; chairman can pass branch in query
        if (!(req.user && req.user.role === 'chairman')) {
          if (req.user.branchId) query.branch = req.user.branchId;
        } else if (req.query.branch) {
          query.branch = req.query.branch;
        }

        // optional date range filtering (frontend sends startDate/endDate for month views)
        const { startDate, endDate } = req.query || {};
        if (startDate && endDate) {
          // use the DailyExpense.date field for filtering
          query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const expenses = await DailyExpense.find(query)
          .populate('paidBy', 'name')
          .populate('branch', 'name code')
          .sort({ date: -1 });

        res.status(200).json({ success: true, data: expenses });
      } catch (error) {
        console.error("Daily expenses fetch error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
      }
  }
);


// Purposes list endpoints
router.get(
  "/purposes",
  protect,
  authorize(["chairman", "company_admin", "branch_head", "branch_staff"]),
  async (req, res) => {
    try {
      const purposes = await DailyExpensePurpose.find({}).sort({ name: 1 });
      res.status(200).json({ success: true, data: purposes });
    } catch (error) {
      console.error('Failed to fetch daily expense purposes', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
);

router.post(
  "/purposes",
  protect,
  authorize(["chairman", "company_admin", "branch_head", "branch_staff"]),
  async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Purpose name is required' });
      }

      const existing = await DailyExpensePurpose.findOne({ name: String(name).trim() });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Purpose already exists' });
      }

      const created = await DailyExpensePurpose.create({ name: String(name).trim(), createdBy: req.user._id });
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      console.error('Failed to create daily expense purpose', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
);

router.put(
  "/purposes/:id",
  protect,
  authorize(["chairman", "company_admin", "branch_head", "branch_staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Purpose name is required' });
      }

      const existing = await DailyExpensePurpose.findOne({ name: String(name).trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Purpose with this name already exists' });
      }

      const updated = await DailyExpensePurpose.findByIdAndUpdate(id, { name: String(name).trim() }, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Purpose not found' });

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Failed to update daily expense purpose', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
);




router.post(
  "/",
  protect,
  authorize(["chairman", "company_admin", "branch_head", "branch_staff"]),
  async (req, res) => {
    try {
      const { date, purpose, amount, paidBy, notes, branch } = req.body;
      
      if (!purpose || !amount) {
        return res
          .status(400)
          .json({ success: false, message: "Purpose and amount are required" });
      }

      
      let expenseBranch = null;
      if (req.user && req.user.role === 'chairman') {
        expenseBranch = branch || null;
      } else {
        expenseBranch = req.user.branchId || null;
      }

      const created = await DailyExpense.create({
        date: date || new Date(),
        purpose,
        amount: Number(amount),
        notes: notes || '',
        paidBy: paidBy || req.user._id,
        branch: expenseBranch,
        createdBy: req.user._id
      });

      const populated = await DailyExpense.findById(created._id).populate('paidBy', 'name').populate('branch', 'name code');

      // Update branch stats (revenue/employeeCount) after expense is recorded
      try {
        if (expenseBranch) await updateBranchStats(expenseBranch);
      } catch (err) {
        console.error('Failed to update branch stats after creating expense', err);
      }

      res.status(201).json({ success: true, data: populated });
    } catch (error) {
      console.error("Daily expenses create error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);




router.put(
  "/:id",
  protect,
  authorize(["chairman", "company_admin", "branch_head", "branch_staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updated = await DailyExpense.findByIdAndUpdate(id, updates, { new: true }).populate('paidBy', 'name').populate('branch', 'name code');

      // Update branch stats after expense update
      try {
        if (updated && updated.branch) await updateBranchStats(updated.branch._id || updated.branch);
      } catch (err) {
        console.error('Failed to update branch stats after updating expense', err);
      }

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error("Daily expenses update error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);




router.delete(
  "/:id",
  protect,
  authorize(["chairman", "company_admin", "branch_head"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const expense = await DailyExpense.findById(id);
      const branchId = expense ? expense.branch : null;
      await DailyExpense.findByIdAndDelete(id);

      // Update branch stats after expense deletion
      try {
        if (branchId) await updateBranchStats(branchId);
      } catch (err) {
        console.error('Failed to update branch stats after deleting expense', err);
      }

      res.status(200).json({ success: true, message: "Expense deleted" });
    } catch (error) {
      console.error("Daily expenses delete error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);




router.get(
  "/stats",
  protect,
  authorize(["chairman", "company_admin", "branch_head"]),
  async (req, res) => {
    try {
      const stats = {
        totalExpenses: 1200,
        averagePerDay: 80,
        topPurposes: [
          { purpose: "Tea", amount: 400 },
          { purpose: "Stationery", amount: 300 },
        ],
      };

      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      console.error("Daily expenses stats error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);

module.exports = router;
