const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  // remaining amount outstanding (decreases when repayments happen)
  remaining: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String,
  // repayment status for this advance
  repaymentStatus: {
    type: String,
    enum: ['not_repaid', 'partial', 'paid'],
    default: 'not_repaid'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

advanceSchema.index({ staff: 1 });
advanceSchema.index({ branch: 1 });

module.exports = mongoose.model('Advance', advanceSchema);
