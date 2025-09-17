const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  quotationNumber: {
    type: String,
    required: true,
    unique: true
  },
  functionDetails: {
    type: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      start: String,
      end: String
    },
    venue: {
      name: String,
      address: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  services: [{
    service: {
      type: String,
      required: true
    },
    description: String,
    quantity: {
      type: Number,
      default: 1
    },
    rate: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  videoOutput: {
    type: String,
    default: ''
  },
  photoOutput: {
    type: String,
    default: ''
  },
  rawOutput: {
    type: String,
    default: ''
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    gstAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    }
  },
  terms: {
    validity: {
      type: Number,
      default: 30 // days
    },
    paymentTerms: String,
    cancellationPolicy: String,
    additionalTerms: String
  },
  template: {
    type: String,
    enum: ['template1', 'template2', 'template3', 'custom'],
    default: 'template1'
  },
  status: {
  type: String,
  enum: ['draft', 'pending', 'sent', 'viewed', 'approved', 'accepted', 'rejected', 'expired', 'converted'],
  default: 'draft'
  },
  followUp: {
    lastSent: Date,
    nextFollowUp: Date,
    followUpCount: {
      type: Number,
      default: 0
    },
    autoFollowUp: {
      type: Boolean,
      default: true
    }
  },
  sentVia: {
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      opened: {
        type: Boolean,
        default: false
      },
      openedAt: Date
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
      }
    }
  },
  notes: String,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
quotationSchema.index({ branch: 1 });
quotationSchema.index({ client: 1 });
quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ 'followUp.nextFollowUp': 1 });

module.exports = mongoose.model('Quotation', quotationSchema); 