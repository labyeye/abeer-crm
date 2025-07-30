const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
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
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  assignedTo: [{
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    role: String,
    assignedDate: {
      type: Date,
      default: Date.now
    }
  }],
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    start: String,
    end: String
  },
  location: {
    address: String,
    city: String,
    state: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  actualStartTime: Date,
  actualEndTime: Date,
  completionNotes: String,
  photos: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  expenses: [{
    description: String,
    amount: Number,
    receipt: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  rescheduleHistory: [{
    reason: String,
    oldDate: Date,
    newDate: Date,
    rescheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rescheduledAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
taskSchema.index({ company: 1, branch: 1 });
taskSchema.index({ booking: 1 });
taskSchema.index({ 'assignedTo.staff': 1 });
taskSchema.index({ scheduledDate: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model('Task', taskSchema); 