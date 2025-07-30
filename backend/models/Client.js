const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: String,
  whatsapp: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  reference: {
    source: String,
    name: String,
    phone: String
  },
  gstStatus: {
    type: String,
    enum: ['with_gst', 'without_gst'],
    default: 'without_gst'
  },
  gstNumber: String,
  category: {
    type: String,
    enum: ['individual', 'corporate', 'government'],
    default: 'individual'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted'],
    default: 'active'
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastBookingDate: Date,
  notes: String,
  tags: [String],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
clientSchema.index({ company: 1, branch: 1 });
clientSchema.index({ phone: 1 });
clientSchema.index({ email: 1 });

module.exports = mongoose.model('Client', clientSchema); 