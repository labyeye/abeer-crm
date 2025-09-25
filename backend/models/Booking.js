const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  bookingNumber: {
    type: String,
    required: true,
    unique: true
  },
  functionDetails: {
    type: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: false
    },
    endDate: {
      type: Date,
      required: false
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
  
  functionDetailsList: [{
    type: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: false
    },
    endDate: {
      type: Date,
      required: false
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
    },
    
    assignedStaff: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    }],
    inventorySelection: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    }]
  }],
  services: [{
    service: {
      type: String,
      required: true
    },
    // optional normalized category and type fields (allow multiple types)
    serviceType: {
      type: [String],
      default: []
    },
    serviceCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory'
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
  serviceNeeded: {
    type: String,
    required: true
  },
  inventorySelection: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  }],
  assignedStaff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }],
  bookingBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
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
    advanceAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      required: true
    }
  },
  staffAssignment: [{
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    role: String,
    assignedDate: {
      type: Date,
      default: Date.now
    }
  }],
  equipmentAssignment: [{
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    quantity: {
      type: Number,
      default: 1
    },
    assignedDate: {
      type: Date,
      default: Date.now
    }
  }],
  travelDetails: {
    method: {
      type: String,
      enum: ['bus', 'train', 'bike', 'car', 'other'],
      default: 'bike'
    },
    budget: {
      type: Number,
      default: 0
    },
    givenCash: {
      type: Number,
      default: 0
    },
    remainingCash: {
      type: Number,
      default: 0
    },
    travelNotes: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  quotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  notes: String,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


bookingSchema.index({ company: 1, branch: 1 });
bookingSchema.index({ client: 1 });
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ 'functionDetails.date': 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema); 