const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  type: {
    type: String,
    enum: [
      'quotation_created',
      'quotation_followup_7days',
      'appointment_reminder',
      'appointment_missed',
      'booking_confirmed',
      'payment_reminder',
      'photo_selection_reminder',
      'work_delivery',
      'post_delivery_followup',
      'review_request',
      'task_assigned',
      'task_completed',
      'task_skipped',
      'expense_approved',
      'salary_paid',
      'attendance_alert',
      'staff_assignment',
      'equipment_assignment',
      'travel_details'
    ],
    required: true
  },
  recipient: {
    type: {
      type: String,
      enum: ['client', 'staff', 'admin'],
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    contact: {
      phone: String,
      email: String,
      whatsapp: String
    }
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  template: {
    type: String,
    enum: ['hindi', 'english', 'custom'],
    default: 'hindi'
  },
  relatedTo: {
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation'
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }
  },
  channels: {
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      delivered: {
        type: Boolean,
        default: false
      },
      opened: {
        type: Boolean,
        default: false
      },
      openedAt: Date,
      error: String
    },
    sms: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      delivered: {
        type: Boolean,
        default: false
      },
      error: String
    },
    whatsapp: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      delivered: {
        type: Boolean,
        default: false
      },
      read: {
        type: Boolean,
        default: false
      },
      readAt: Date,
      error: String
    },
    inApp: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      read: {
        type: Boolean,
        default: false
      },
      readAt: Date
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  smartLink: {
    token: {
      type: String,
      unique: true,
      sparse: true
    },
    url: String,
    expiresAt: Date,
    accessCount: {
      type: Number,
      default: 0
    },
    maxAccess: {
      type: Number,
      default: 10
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  automation: {
    isAutomated: {
      type: Boolean,
      default: false
    },
    trigger: {
      type: String,
      enum: [
        'quotation_created',
        'booking_confirmed', 
        'payment_due',
        'task_assigned',
        'followup_scheduled',
        'appointment_scheduled'
      ]
    },
    followUpDays: Number,
    nextFollowUp: Date
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  scheduledFor: Date,
  sentAt: Date,
  readAt: Date,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


notificationSchema.index({ company: 1, branch: 1 });
notificationSchema.index({ 'recipient.user': 1 });
notificationSchema.index({ 'recipient.client': 1 });
notificationSchema.index({ 'recipient.staff': 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema); 