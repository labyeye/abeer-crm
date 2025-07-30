const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  contactInfo: {
    phone: String,
    email: String,
    whatsapp: String
  },
  gstNumber: String,
  panNumber: String,
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
branchSchema.index({ company: 1 });
branchSchema.index({ code: 1 });

module.exports = mongoose.model('Branch', branchSchema); 