const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  fatherName: {
    type: String,
    required: true
  },
  motherName: {
    type: String,
    required: true
  },
  aadharNumbers: {
    staff: {
      type: String,
      required: true
    },
    father: {
      type: String,
      required: true
    },
    mother: {
      type: String,
      required: true
    }
  },
  contacts: {
    staff: {
      type: String,
      required: true
    },
    father: {
      type: String,
      required: true
    },
    mother: {
      type: String,
      required: true
    }
  },
  referredBy: {
    type: String
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
    type: Number,
    required: true
  },
  // New fields added for staff information
  maritalStatus: {
    type: String,
    enum: ['married', 'unmarried'],
    default: 'unmarried'
  },
  children: {
    boys: {
      count: {
        type: Number,
        default: 0
      },
      names: [{
        type: String,
        trim: true
      }]
    },
    girls: {
      count: {
        type: Number,
        default: 0
      },
      names: [{
        type: String,
        trim: true
      }]
    }
  },
  grandfatherName: {
    type: String,
    trim: true
  },
  education: [{
    institution: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['school', 'college', 'university'],
      required: true
    },
    passingYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear()
    },
    marks: {
      type: Number,
      min: 0,
      max: 100
    },
    division: {
      type: String,
      enum: ['first', 'second', 'third', 'pass']
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
staffSchema.index({ branch: 1 });
staffSchema.index({ employeeId: 1 });
staffSchema.index({ userId: 1 });

module.exports = mongoose.model('Staff', staffSchema); 