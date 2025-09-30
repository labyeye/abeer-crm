const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Camera', 'Lens', 'Lighting', 'Audio', 'Tripod', 'Accessories', 'Props', 'Backdrop', 'Software', 'Other']
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  specifications: {
    type: Map,
    of: String
  },
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Excellent', 'Good', 'Fair', 'Poor'],
    default: 'New'
  },
  location: {
    warehouse: {
      type: String,
      required: [true, 'Warehouse location is required']
    },
    shelf: {
      type: String,
      trim: true
    },
    bin: {
      type: String,
      trim: true
    }
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  buyingMethod: {
    type: String,
    enum: ['cash', 'emi'],
    required: true
  },
  emiDetails: {
    months: {
      type: Number,
      required: function() { return this.buyingMethod === 'emi'; }
    },
    downPayment: {
      type: Number,
      required: function() { return this.buyingMethod === 'emi'; }
    },
    monthlyAmount: {
      type: Number,
      required: function() { return this.buyingMethod === 'emi'; }
    }
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  minQuantity: {
    type: Number,
    min: [0, 'Minimum quantity cannot be negative'],
    default: 0
  },
  maxQuantity: {
    type: Number,
    min: [0, 'Maximum quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['Piece', 'Set', 'Box', 'Case', 'Roll', 'Meter', 'Foot', 'Other'],
    default: 'Piece'
  },
  // whether this inventory item should appear in booking equipment pickers
  forBooking: {
    type: Boolean,
    default: true,
  },
  purchasePrice: {
    type: Number,
    min: [0, 'Purchase price cannot be negative'],
    required: [true, 'Purchase price is required']
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price cannot be negative']
  },
  supplier: {
    name: {
      type: String,
      required: [true, 'Supplier name is required']
    },
    contact: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  warrantyExpiry: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discontinued', 'Under Maintenance'],
    default: 'Active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


inventorySchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});


inventorySchema.index({ name: 'text', sku: 'text', brand: 'text', category: 'text' });


inventorySchema.plugin(require('mongoose-paginate-v2'));

module.exports = mongoose.model('Inventory', inventorySchema); 