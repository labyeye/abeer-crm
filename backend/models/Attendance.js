const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
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
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    time: {
      type: Date,
      required: true
    },
    photo: {
      type: String,
      required: true
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
    type: Number, // in hours
    default: 0
  },
  overtime: {
    type: Number, // in hours
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
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ staff: 1, date: 1 });
attendanceSchema.index({ company: 1, branch: 1, date: 1 });
attendanceSchema.index({ date: 1 });

// Compound unique index to prevent duplicate attendance records
attendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema); 