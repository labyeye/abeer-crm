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
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'skipped'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['equipment_prep', 'travel', 'main_function', 'data_backup', 'manual', 'other'],
    default: 'manual'
  },
  estimatedDuration: {
    type: Number, 
    default: 240
  },
  actualStartTime: Date,
  actualEndTime: Date,
  completedAt: Date,
  completionNotes: String,
  completionPhotos: [String],
  skipReason: String,
  skippedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  skippedAt: Date,
  requirements: {
    equipment: [{
      equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory'
      },
      quantity: Number
    }],
    skills: [String],
    transport: Boolean,
    specialRequirements: String
  },
  progress: {
    type: Number, 
    min: 0,
    max: 100,
    default: 0
  },
  notes: String,
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


taskSchema.index({ company: 1, branch: 1 });
taskSchema.index({ booking: 1 });
taskSchema.index({ 'assignedTo.staff': 1 });
taskSchema.index({ scheduledDate: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model('Task', taskSchema);
