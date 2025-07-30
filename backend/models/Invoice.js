const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
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
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  quotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
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
    venue: {
      name: String,
      address: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  items: [{
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
    },
    gstRate: {
      type: Number,
      default: 0
    },
    gstAmount: {
      type: Number,
      default: 0
    }
  }],
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
    },
    advancePaid: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      required: true
    }
  },
  gstDetails: {
    gstNumber: String,
    panNumber: String,
    placeOfSupply: String,
    reverseCharge: {
      type: Boolean,
      default: false
    }
  },
  paymentTerms: {
    dueDays: {
      type: Number,
      default: 30
    },
    lateFeePercentage: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  paymentHistory: [{
    amount: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'],
      required: true
    },
    reference: String,
    notes: String
  }],
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
invoiceSchema.index({ company: 1, branch: 1 });
invoiceSchema.index({ client: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema); 