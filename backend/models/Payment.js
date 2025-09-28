const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  // support multiple bookings paid in a single payment
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  // allocations store amount applied per booking when using multiple bookings
  allocations: [{ booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, amount: Number }],
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  method: { type: String, enum: ['cash','cheque','bank_transfer','upi','card','other'], default: 'cash' },
  reference: String,
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

paymentSchema.index({ client: 1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ invoice: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
