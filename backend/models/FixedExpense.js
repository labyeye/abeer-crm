const mongoose = require('mongoose');

const FixedExpenseSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  recurrence: { type: String, enum: ['monthly', 'yearly', 'one-time'], default: 'monthly' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  source: { type: String, enum: ['manual', 'inventory'], default: 'manual' },
  inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  emiDetails: {
    months: Number,
    downPayment: Number,
    monthlyAmount: Number,
    createdAt: { type: Date, default: Date.now }
  }
  ,
  // payments: store per-month payment status and amount
  payments: [
    {
      month: { type: Date }, // store as month start
      amount: { type: Number, default: 0 },
      paid: { type: Boolean, default: false },
      paidAt: { type: Date }
    }
  ]
}, { timestamps: true });

FixedExpenseSchema.index({ company: 1, branch: 1 });

module.exports = mongoose.model('FixedExpense', FixedExpenseSchema);
