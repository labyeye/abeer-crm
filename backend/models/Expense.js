const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  expenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: [
      'travel', 'equipment', 'maintenance', 'utilities', 
      'rent', 'salary', 'marketing', 'office_supplies',
      'food', 'transport', 'other'
    ],
    required: true
  },
  subCategory: String,
  title: {
    type: String,
    required: true
  },
  description: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  expenseDate: {
    type: Date,
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'],
    default: 'cash'
  },
  paymentDate: Date,
  receipt: {
    url: String,
    fileName: String,
    uploadedAt: Date
  },
  vendor: {
    name: String,
    contact: String,
    gstNumber: String
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  notes: String,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


expenseSchema.index({ company: 1, branch: 1 });
expenseSchema.index({ submittedBy: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ expenseDate: 1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema); 