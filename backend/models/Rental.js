const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  
  rentalType: {
    type: String,
    enum: ['outgoing', 'incoming'],
    required: true
  },
  rentalNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  equipmentName: {
    type: String,
    required: true
  },
  equipmentType: {
    type: String,
    required: true
  },
  
  
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  actualReturnDate: {
    type: Date
  },
  
  
  dailyRate: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  securityDeposit: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  
  
  renter: {
    name: String,
    email: String,
    phone: String,
    company: String,
    address: String
  },
  
  
  vendor: {
    name: String,
    email: String,
    phone: String,
    company: String,
    address: String
  },
  
  
  projectName: String,
  clientName: String,
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'returned', 'overdue', 'cancelled'],
    default: 'pending'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'excellent'
  },
  returnCondition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor']
  },
  
  
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  
  
  notes: String,
  terms: String,
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});


rentalSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      rentalType: this.rentalType,
      createdAt: { $gte: new Date(year, 0, 1) }
    });
    this.rentalNumber = `${this.rentalType.toUpperCase()}-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});


rentalSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.dailyRate) {
    const days = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
    this.totalAmount = days * this.dailyRate;
  }
  next();
});


rentalSchema.methods.isOverdue = function() {
  if (this.status === 'active' && this.endDate < new Date()) {
    return true;
  }
  return false;
};


rentalSchema.methods.getOverdueDays = function() {
  if (this.isOverdue()) {
    return Math.ceil((new Date() - this.endDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
};

module.exports = mongoose.model('Rental', rentalSchema); 