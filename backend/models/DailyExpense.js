const mongoose = require('mongoose');

const DailyExpenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  notes: {
    type: String
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyExpense', DailyExpenseSchema);
