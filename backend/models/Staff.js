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
    // subject-wise marks for the qualification
    subjects: [{
      name: { type: String, trim: true },
      marks: { type: Number, min: 0, max: 100 }
    }],
    division: {
      type: String,
      enum: ['first', 'second', 'third', 'pass']
    }
  }],
  educationClassSubject: {
    type: String,
    trim: true,
    default: ''
  },
  experience: [{
    company: { type: String, trim: true },
    role: { type: String, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, trim: true }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
  ,
  performance: {
    score: {
      type: Number,
      default: 100
    },
    lateArrivals: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    }
  }
});


staffSchema.index({ branch: 1 });
staffSchema.index({ employeeId: 1 });
staffSchema.index({ userId: 1 });

module.exports = mongoose.model('Staff', staffSchema); 