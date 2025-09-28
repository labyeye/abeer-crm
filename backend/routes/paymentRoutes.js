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

  // If linked to a booking, update booking.pricing.remainingAmount and paymentStatus
  if (booking) {
    try {
      const b = await Booking.findById(booking);
      if (b && b.pricing) {
        // reduce remaining amount by the payment amount
        b.pricing.remainingAmount = Math.max(0, (b.pricing.remainingAmount || b.pricing.totalAmount || 0) - Number(amount || 0));
        // update advanceAmount (treat payments towards advance)
        b.pricing.advanceAmount = (b.pricing.advanceAmount || 0) + Number(amount || 0);
        // set paymentStatus based on remainingAmount
        if (b.pricing.remainingAmount === 0) {
          b.paymentStatus = 'completed';
        } else if (b.pricing.advanceAmount > 0) {
          b.paymentStatus = 'partial';
        } else {
          b.paymentStatus = 'pending';
        }
        await b.save();
      }
    } catch (e) {
      console.error('Failed to update booking after payment:', e);
    }
  }

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

// Update a payment
router.put('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });

  // store previous values to adjust booking/invoice if needed
  const prevAmount = payment.amount;
  const prevBooking = payment.booking ? String(payment.booking) : null;
  const prevInvoice = payment.invoice ? String(payment.invoice) : null;

  Object.assign(payment, updates);
  await payment.save();

  // If booking changed or amount changed, try to reconcile booking pricing
  try {
    // if booking was previously linked, revert its pricing by adding back prevAmount
    if (prevBooking) {
      const bPrev = await Booking.findById(prevBooking);
      if (bPrev && bPrev.pricing) {
        bPrev.pricing.remainingAmount = (bPrev.pricing.remainingAmount || bPrev.pricing.totalAmount || 0) + Number(prevAmount || 0);
        bPrev.pricing.advanceAmount = Math.max(0, (bPrev.pricing.advanceAmount || 0) - Number(prevAmount || 0));
        await bPrev.save();
      }
    }

    // apply to the new booking if present
    if (payment.booking) {
      const b = await Booking.findById(payment.booking);
      if (b && b.pricing) {
        b.pricing.remainingAmount = Math.max(0, (b.pricing.remainingAmount || b.pricing.totalAmount || 0) - Number(payment.amount || 0));
        b.pricing.advanceAmount = (b.pricing.advanceAmount || 0) + Number(payment.amount || 0);
        if (b.pricing.remainingAmount === 0) b.paymentStatus = 'completed';
        else if (b.pricing.advanceAmount > 0) b.paymentStatus = 'partial';
        else b.paymentStatus = 'pending';
        await b.save();
      }
    }
  } catch (e) {
    console.error('Failed to reconcile booking after payment update', e);
  }

  // If invoice linked, update invoice pricing by recalculating paymentHistory roughly
  if (prevInvoice || payment.invoice) {
    try {
      const Invoice = require('../models/Invoice');
      if (prevInvoice) {
        const invPrev = await Invoice.findById(prevInvoice);
        if (invPrev && invPrev.pricing) {
          invPrev.pricing.advancePaid = Math.max(0, (invPrev.pricing.advancePaid || 0) - Number(prevAmount || 0));
          invPrev.pricing.remainingAmount = Math.max(0, (invPrev.pricing.remainingAmount || invPrev.pricing.finalAmount || 0) + Number(prevAmount || 0));
          invPrev.status = invPrev.pricing.remainingAmount === 0 ? 'paid' : invPrev.status;
          await invPrev.save();
        }
      }
      if (payment.invoice) {
        const inv = await Invoice.findById(payment.invoice);
        if (inv && inv.pricing) {
          inv.pricing.advancePaid = (inv.pricing.advancePaid || 0) + Number(payment.amount || 0);
          inv.pricing.remainingAmount = Math.max(0, (inv.pricing.remainingAmount || inv.pricing.finalAmount || 0) - Number(payment.amount || 0));
          if (inv.pricing.remainingAmount === 0) inv.status = 'paid';
          await inv.save();
        }
      }
    } catch (e) {
      console.error('Failed to reconcile invoice after payment update', e);
    }
  }

  res.json(payment);
}));

// Delete a payment
router.delete('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });

  // Before deleting, revert booking/invoice pricing
  try {
    if (payment.booking) {
      const b = await Booking.findById(payment.booking);
      if (b && b.pricing) {
        b.pricing.remainingAmount = (b.pricing.remainingAmount || b.pricing.totalAmount || 0) + Number(payment.amount || 0);
        b.pricing.advanceAmount = Math.max(0, (b.pricing.advanceAmount || 0) - Number(payment.amount || 0));
        // adjust paymentStatus
        if (b.pricing.remainingAmount === 0) b.paymentStatus = 'completed';
        else if (b.pricing.advanceAmount > 0) b.paymentStatus = 'partial';
        else b.paymentStatus = 'pending';
        await b.save();
      }
    }

    if (payment.invoice) {
      const Invoice = require('../models/Invoice');
      const inv = await Invoice.findById(payment.invoice);
      if (inv && inv.pricing) {
        inv.pricing.advancePaid = Math.max(0, (inv.pricing.advancePaid || 0) - Number(payment.amount || 0));
        inv.pricing.remainingAmount = Math.max(0, (inv.pricing.remainingAmount || inv.pricing.finalAmount || 0) + Number(payment.amount || 0));
        if (inv.pricing.remainingAmount > 0 && inv.status === 'paid') inv.status = 'partially_paid';
        await inv.save();
      }
    }
  } catch (e) {
    console.error('Failed to revert linked booking/invoice during payment deletion', e);
  }

  await payment.remove();
  res.json({ success: true });
}));

module.exports = router;

