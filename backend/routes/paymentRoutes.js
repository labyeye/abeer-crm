const express = require('express');
const router = express.Router();

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');

// Create a payment
router.post('/', asyncHandler(async (req, res) => {
  const { client, booking, invoice, amount, date, method, reference, notes, branch, company } = req.body;
  if (!client || !amount || !date) {
    return res.status(400).json({ message: 'client, amount and date are required' });
  }

  const payment = await Payment.create({ client, booking, invoice, amount, date, method, reference, notes, branch, company, createdBy: req.user && req.user._id });

  // If linked to an invoice, push to invoice.paymentHistory and update remaining/advance fields
  if (invoice) {
    const Invoice = require('../models/Invoice');
    const inv = await Invoice.findById(invoice);
    if (inv) {
      inv.paymentHistory = inv.paymentHistory || [];
      inv.paymentHistory.push({ amount, paymentDate: date, paymentMethod: method || 'cash', reference, notes });
      // update paid/remaining
      inv.pricing = inv.pricing || {};
      inv.pricing.advancePaid = (inv.pricing.advancePaid || 0) + Number(amount || 0);
      inv.pricing.remainingAmount = Math.max(0, (inv.pricing.remainingAmount || inv.pricing.finalAmount || 0) - Number(amount || 0));
      if (inv.pricing.remainingAmount === 0) inv.status = 'paid';
      await inv.save();
    }
  }

  res.status(201).json(payment);
}));

// List payments (optionally filter by client)
router.get('/', asyncHandler(async (req, res) => {
  const { client, limit = 100 } = req.query;
  const q = {};
  if (client) q.client = client;
  const payments = await Payment.find(q).sort({ date: -1 }).limit(Number(limit)).populate('client booking invoice');
  res.json(payments);
}));

// Helper: list bookings for a client (convenience endpoint)
router.get('/client/:id/bookings', asyncHandler(async (req, res) => {
  const clientId = req.params.id;
  const bookings = await Booking.find({ client: clientId, isDeleted: { $ne: true } }).sort({ date: -1 });
  res.json(bookings);
}));

module.exports = router;
