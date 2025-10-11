const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  type: { type: String, enum: ['bank', 'third_party'], required: true },
  // bank fields
  bankName: String,
  bankAccountNumber: String,
  bankBranch: String,
  // third party (client) reference
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

  amount: { type: Number, required: true },
  dateReceived: { type: Date, required: true },
  interestRate: { type: Number, default: 0 },
  interestPeriodUnit: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  tenure: { type: Number, default: 0 },
  tenureUnit: { type: String, enum: ['months', 'years'], default: 'months' },
  purpose: { type: String },

  remainingAmount: { type: Number, default: 0 },
  repayments: [
    {
      amount: { type: Number, required: true },
      date: { type: Date, required: true },
      note: String,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

loanSchema.index({ company: 1, branch: 1 });

module.exports = mongoose.model('Loan', loanSchema);
