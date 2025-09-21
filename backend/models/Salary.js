const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
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
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  allowances: {
    type: Number,
    default: 0
  },
  overtime: {
    hours: {
      type: Number,
      default: 0
    },
    rate: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  deductions: {
    loan: {
      type: Number,
      default: 0
    },
    emi: {
      type: Number,
      default: 0
    },
    advance: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  attendance: {
    totalDays: {
      type: Number,
      default: 0
    },
    presentDays: {
      type: Number,
      default: 0
    },
    absentDays: {
      type: Number,
      default: 0
    },
    lateDays: {
      type: Number,
      default: 0
    },
    halfDays: {
      type: Number,
      default: 0
    }
  },
  performance: {
    score: {
      type: Number,
      default: 100
    },
    bonus: {
      type: Number,
      default: 0
    },
    penalty: {
      type: Number,
      default: 0
    }
  },
  netSalary: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending'
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'other'],
    default: 'bank_transfer'
  },
  paymentReference: String,
  notes: String,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


salarySchema.index({ company: 1, branch: 1 });
salarySchema.index({ staff: 1 });
salarySchema.index({ month: 1, year: 1 });
salarySchema.index({ paymentStatus: 1 });


salarySchema.index({ staff: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Salary', salarySchema); 