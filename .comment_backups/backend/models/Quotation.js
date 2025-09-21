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
    // what service will be given at this function (new requested field)
    serviceGiven: String,
    venue: {
      name: String,
      address: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  // Backward-compatible list of function details (support multiple service dates)
  functionDetailsList: [{
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
    serviceGiven: String,
    venue: {
      name: String,
      address: String,
      city: String,
      state: String,
      pincode: String
    }
  }],
  services: [{
    service: {
      type: String,
      required: true
    },
    // new field: service type/category (e.g., Photography, Videography)
    serviceType: String,
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

// Normalize incoming data: support frontend sending services as {name:...}
quotationSchema.pre('validate', function(next) {
  try {
    if (Array.isArray(this.services)) {
        this.services = this.services.map(s => {
          if (!s.service && s.name) s.service = s.name;
          // normalize serviceType from multiple possible incoming keys
          if (!s.serviceType) s.serviceType = s.type || s.category || '';
          // ensure numeric fields are numbers (allow 0)
          s.quantity = s.quantity !== undefined ? Number(s.quantity) : s.quantity;
          s.rate = s.rate !== undefined ? Number(s.rate) : s.rate;
          s.amount = s.amount !== undefined ? Number(s.amount) : s.amount;
          return s;
        });
    }

    // If functionDetailsList provided and functionDetails missing, populate functionDetails from first entry
    if ((!this.functionDetails || !this.functionDetails.type) && Array.isArray(this.functionDetailsList) && this.functionDetailsList.length > 0) {
      const fd = this.functionDetailsList[0];
      this.functionDetails = {
        type: fd.type,
        date: fd.date,
        time: fd.time || {},
        venue: fd.venue || {},
        serviceGiven: fd.serviceGiven
      };
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Index for efficient queries
quotationSchema.index({ branch: 1 });
quotationSchema.index({ client: 1 });
quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ 'followUp.nextFollowUp': 1 });

module.exports = mongoose.model('Quotation', quotationSchema); 