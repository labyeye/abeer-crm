const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  },
  
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    time: {
      type: Date
    },
    photo: {
      type: String
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    deviceInfo: {
      deviceId: String,
      deviceType: String,
      ipAddress: String
    }
  },
  checkOut: {
    time: Date,
    photo: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    deviceInfo: {
      deviceId: String,
      deviceType: String,
      ipAddress: String
    }
  },
  workingHours: {
    type: Number, 
    default: 0
  },
  overtime: {
    type: Number, 
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'late', 'leave'],
    default: 'present'
  },
  tasks: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    startTime: Date,
    endTime: Date,
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'assigned'
    }
  }],
  notes: String,
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  approved: {
    type: Boolean,
    default: true
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: {}
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// compound index to speed up queries by company/branch/date (company optional)
attendanceSchema.index({ company: 1, branch: 1, date: 1 });

attendanceSchema.index({ date: 1 });

// ensure uniqueness of staff+date only for non-deleted records so soft-deletes don't block new entries
attendanceSchema.index({ staff: 1, date: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

module.exports = mongoose.model('Attendance', attendanceSchema); 