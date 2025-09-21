const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const DailyExpense = require('../models/DailyExpense');


// @desc    Get all daily expenses
// @route   GET /api/daily-expenses
// @access  Private
router.get(
  "/",
  protect,
  authorize(["chairman", "company_admin", "branch_head", "branch_staff"]),
  async (req, res) => {
    try {
        // Fetch expenses scoped by branch for non-chairman users
        const query = {};
        if (!(req.user && req.user.role === 'chairman')) {
          if (req.user.branchId) query.branch = req.user.branchId;
        } else if (req.query.branch) {
          query.branch = req.query.branch;
        }

        const expenses = await DailyExpense.find(query).populate('paidBy', 'name').populate('branch', 'name code');

        res.status(200).json({ success: true, data: expenses });
      } catch (error) {
        console.error("Daily expenses fetch error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
      }
  }
);

// @desc    Create a daily expense
// @route   POST /api/daily-expenses
// @access  Private
router.post(
  "/",
  protect,
  authorize(["chairman", "company_admin", "branch_head", "branch_staff"]),
  async (req, res) => {
    try {
      const { date, purpose, amount, paidBy, notes, branch } = req.body;
      // Minimal validation
      if (!purpose || !amount) {
        return res
          .status(400)
          .json({ success: false, message: "Purpose and amount are required" });
      }

      // Determine branch: chairman may pass a branch explicitly; others use their assigned branch
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

      res.status(201).json({ success: true, data: populated });
    } catch (error) {
      console.error("Daily expenses create error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);

// @desc    Update an expense
// @route   PUT /api/daily-expenses/:id
// @access  Private
router.put(
  "/:id",
  protect,
  authorize(["chairman", "company_admin", "branch_head", "branch_staff"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updated = await DailyExpense.findByIdAndUpdate(id, updates, { new: true }).populate('paidBy', 'name').populate('branch', 'name code');

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error("Daily expenses update error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);

// @desc    Delete an expense
// @route   DELETE /api/daily-expenses/:id
// @access  Private
router.delete(
  "/:id",
  protect,
  authorize(["chairman", "company_admin", "branch_head"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      await DailyExpense.findByIdAndDelete(id);

      res.status(200).json({ success: true, message: "Expense deleted" });
    } catch (error) {
      console.error("Daily expenses delete error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);

// @desc    Get daily expenses stats
// @route   GET /api/daily-expenses/stats
// @access  Private
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
