const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
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
  category: {
    type: String,
    enum: ['individual', 'professional'],
    default: 'individual'
  },
  userId: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
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
  
  aadharNumber: String,
  panNumber: String,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


clientSchema.index({ branch: 1 });
clientSchema.index({ phone: 1 });
clientSchema.index({ email: 1 });

module.exports = mongoose.model('Client', clientSchema); 