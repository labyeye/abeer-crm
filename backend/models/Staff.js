const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  staffType: {
    type: String,
    enum: ['monthly', 'per_day', 'per_task'],
    default: 'monthly'
  },
  designation: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  joiningDate: {
    type: Date,
    required: true
  },
  salary: {
    basic: {
      type: Number,
      required: true
    },
    allowances: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branchName: String
  },
  contactInfo: {
    emergencyContact: String,
    emergencyPhone: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  documents: {
    aadharNumber: String,
    panNumber: String,
    drivingLicense: String
  },
  performance: {
    score: {
      type: Number,
      default: 100
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    lateArrivals: {
      type: Number,
      default: 0
    },
    absences: {
      type: Number,
      default: 0
    }
  },
  loanDetails: {
    hasLoan: {
      type: Boolean,
      default: false
    },
    loanAmount: {
      type: Number,
      default: 0
    },
    emiAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    },
    financeCompany: String,
    startDate: Date,
    endDate: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
staffSchema.index({ company: 1, branch: 1 });
staffSchema.index({ employeeId: 1 });
staffSchema.index({ user: 1 });

module.exports = mongoose.model('Staff', staffSchema); 