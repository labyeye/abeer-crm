const express = require('express');
const router = express.Router();

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');

// Create a payment
router.post('/', asyncHandler(async (req, res) => {
  const { client, booking, bookings: bookingArray, amount, date, method, notes, allocations, invoice, useAdvance, advanceAmount } = req.body;
  let parsedAllocations;
  try {
    parsedAllocations = typeof allocations === 'string' ? JSON.parse(allocations) : allocations;
  } catch (e) {
    parsedAllocations = allocations;
  }

  // If using advance, deduct from client's advance balance first
  if (useAdvance && advanceAmount && client) {
    const Client = require('../models/Client');
    const clientDoc = await Client.findById(client);
    if (clientDoc) {
      const amountToDeduct = Math.min(Number(advanceAmount), clientDoc.advanceBalance || 0);
      if (amountToDeduct > 0) {
        clientDoc.advanceBalance = Math.max(0, (clientDoc.advanceBalance || 0) - amountToDeduct);
        await clientDoc.save();
      }
    }
  }

  const payment = await Payment.create({
    client,
    booking,
    bookings: bookingArray || [],
    invoice,
    amount: Number(amount || 0),
    date: date || new Date(),
    method: method || 'cash',
    notes: notes || '',
    allocations: parsedAllocations || [],
    advanceCredit: 0 // Will be updated below if there's excess
  });

  let advanceCreditAmount = 0;

  try {
    if (bookingArray && bookingArray.length > 0) {
      let allocs = parsedAllocations || allocations || [];
      if (!allocs || !allocs.length) {
        const share = Number(amount || 0) / bookingArray.length;
        allocs = bookingArray.map(bId => ({ booking: bId, amount: share }));
      }

      // Track total amount applied to bookings
      let totalApplied = 0;

      for (const a of allocs) {
        try {
          const b = await Booking.findById(a.booking || a);
          const amt = Number(a.amount || a.amount === 0 ? a.amount : (Number(amount || 0) / bookingArray.length));
          totalApplied += amt;
          
          if (b && b.pricing) {
            b.pricing.remainingAmount = Math.max(0, (b.pricing.remainingAmount || b.pricing.totalAmount || 0) - amt);
            b.pricing.advanceAmount = (b.pricing.advanceAmount || 0) + amt;
            if (b.pricing.remainingAmount === 0) b.paymentStatus = 'completed';
            else if (b.pricing.advanceAmount > 0) b.paymentStatus = 'partial';
            else b.paymentStatus = 'pending';
            await b.save();
          }
        } catch (e) {
          console.error('Failed to update one of the bookings after payment:', e);
        }
      }

      // Check if payment exceeds total booking amount and credit to client advance
      const excessAmount = Number(amount || 0) - totalApplied;
      if (excessAmount > 0 && client) {
        advanceCreditAmount = excessAmount;
        const Client = require('../models/Client');
        const clientDoc = await Client.findById(client);
        if (clientDoc) {
          clientDoc.advanceBalance = (clientDoc.advanceBalance || 0) + excessAmount;
          await clientDoc.save();
        }
        // Update payment with advance credit amount
        payment.advanceCredit = excessAmount;
        await payment.save();
      }
    } else if (booking) {
      // legacy single booking behavior
      const b = await Booking.findById(booking);
      if (b && b.pricing) {
        const bookingRemaining = b.pricing.remainingAmount || b.pricing.totalAmount || 0;
        const appliedAmount = Math.min(Number(amount || 0), bookingRemaining);
        const excessAmount = Number(amount || 0) - appliedAmount;

        b.pricing.remainingAmount = Math.max(0, bookingRemaining - appliedAmount);
        b.pricing.advanceAmount = (b.pricing.advanceAmount || 0) + appliedAmount;
        if (b.pricing.remainingAmount === 0) b.paymentStatus = 'completed';
        else if (b.pricing.advanceAmount > 0) b.paymentStatus = 'partial';
        else b.paymentStatus = 'pending';
        await b.save();

        // Credit excess to client advance
        if (excessAmount > 0 && client) {
          advanceCreditAmount = excessAmount;
          const Client = require('../models/Client');
          const clientDoc = await Client.findById(client);
          if (clientDoc) {
            clientDoc.advanceBalance = (clientDoc.advanceBalance || 0) + excessAmount;
            await clientDoc.save();
          }
          // Update payment with advance credit amount
          payment.advanceCredit = excessAmount;
          await payment.save();
        }
      }
    } else {
      // Payment with no booking - entire amount goes to client advance
      if (client) {
        advanceCreditAmount = Number(amount || 0);
        const Client = require('../models/Client');
        const clientDoc = await Client.findById(client);
        if (clientDoc) {
          clientDoc.advanceBalance = (clientDoc.advanceBalance || 0) + Number(amount || 0);
          await clientDoc.save();
        }
        // Update payment with advance credit amount
        payment.advanceCredit = Number(amount || 0);
        await payment.save();
      }
    }
  } catch (e) {
    console.error('Failed to apply allocations to bookings after payment:', e);
  }

  res.json({ success: true, data: payment });
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
  const prevBookings = Array.isArray(payment.bookings) ? payment.bookings.map(x => String(x)) : [];
  const prevAllocations = Array.isArray(payment.allocations) ? payment.allocations.map(a => ({ booking: String(a.booking), amount: Number(a.amount) })) : [];
  const prevInvoice = payment.invoice ? String(payment.invoice) : null;

  Object.assign(payment, updates);
  await payment.save();

  // If booking changed or amount changed, try to reconcile booking pricing
  try {
    // if payment previously allocated to multiple bookings, revert each allocation first
    if (prevAllocations && prevAllocations.length > 0) {
      for (const a of prevAllocations) {
        try {
          const bPrev = await Booking.findById(a.booking);
          if (bPrev && bPrev.pricing) {
            bPrev.pricing.remainingAmount = (bPrev.pricing.remainingAmount || bPrev.pricing.totalAmount || 0) + Number(a.amount || 0);
            bPrev.pricing.advanceAmount = Math.max(0, (bPrev.pricing.advanceAmount || 0) - Number(a.amount || 0));
            await bPrev.save();
          }
        } catch (e) {
          console.error('Failed to revert previous allocation for booking', a.booking, e);
        }
      }
    } else if (prevBooking) {
      // legacy single booking revert
      const bPrev = await Booking.findById(prevBooking);
      if (bPrev && bPrev.pricing) {
        bPrev.pricing.remainingAmount = (bPrev.pricing.remainingAmount || bPrev.pricing.totalAmount || 0) + Number(prevAmount || 0);
        bPrev.pricing.advanceAmount = Math.max(0, (bPrev.pricing.advanceAmount || 0) - Number(prevAmount || 0));
        await bPrev.save();
      }
    }

    // Now apply allocations from the updated payment (if any)
    if (payment.allocations && payment.allocations.length > 0) {
      for (const a of payment.allocations) {
        try {
          const b = await Booking.findById(a.booking || a);
          const amt = Number(a.amount || a.amount === 0 ? a.amount : 0);
          if (b && b.pricing) {
            b.pricing.remainingAmount = Math.max(0, (b.pricing.remainingAmount || b.pricing.totalAmount || 0) - amt);
            b.pricing.advanceAmount = (b.pricing.advanceAmount || 0) + amt;
            if (b.pricing.remainingAmount === 0) b.paymentStatus = 'completed';
            else if (b.pricing.advanceAmount > 0) b.paymentStatus = 'partial';
            else b.paymentStatus = 'pending';
            await b.save();
          }
        } catch (e) {
          console.error('Failed to apply allocation to booking after payment update', e);
        }
      }
    } else if (payment.bookings && payment.bookings.length > 0) {
      // if bookings array provided without explicit allocations, split equally
      const share = Number(payment.amount || 0) / payment.bookings.length;
      for (const bId of payment.bookings) {
        try {
          const b = await Booking.findById(bId);
          if (b && b.pricing) {
            b.pricing.remainingAmount = Math.max(0, (b.pricing.remainingAmount || b.pricing.totalAmount || 0) - share);
            b.pricing.advanceAmount = (b.pricing.advanceAmount || 0) + share;
            if (b.pricing.remainingAmount === 0) b.paymentStatus = 'completed';
            else if (b.pricing.advanceAmount > 0) b.paymentStatus = 'partial';
            else b.paymentStatus = 'pending';
            await b.save();
          }
        } catch (e) {
          console.error('Failed to apply equal-split allocation to booking', bId, e);
        }
      }
    } else if (payment.booking) {
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
    // If payment had allocations, revert each allocation on the booking
    if (payment.allocations && payment.allocations.length > 0) {
      for (const a of payment.allocations) {
        try {
          const b = await Booking.findById(a.booking || a);
          if (b && b.pricing) {
            b.pricing.remainingAmount = (b.pricing.remainingAmount || b.pricing.totalAmount || 0) + Number(a.amount || 0);
            b.pricing.advanceAmount = Math.max(0, (b.pricing.advanceAmount || 0) - Number(a.amount || 0));
            if (b.pricing.remainingAmount === 0) b.paymentStatus = 'completed';
            else if (b.pricing.advanceAmount > 0) b.paymentStatus = 'partial';
            else b.paymentStatus = 'pending';
            await b.save();
          }
        } catch (e) {
          console.error('Failed to revert allocation during payment deletion for booking', a.booking, e);
        }
      }
    } else if (payment.bookings && payment.bookings.length > 0) {
      // split amount equally across bookings when allocations absent
      const share = Number(payment.amount || 0) / payment.bookings.length;
      for (const bId of payment.bookings) {
        try {
          const b = await Booking.findById(bId);
          if (b && b.pricing) {
            b.pricing.remainingAmount = (b.pricing.remainingAmount || b.pricing.totalAmount || 0) + share;
            b.pricing.advanceAmount = Math.max(0, (b.pricing.advanceAmount || 0) - share);
            if (b.pricing.remainingAmount === 0) b.paymentStatus = 'completed';
            else if (b.pricing.advanceAmount > 0) b.paymentStatus = 'partial';
            else b.paymentStatus = 'pending';
            await b.save();
          }
        } catch (e) {
          console.error('Failed to revert equal-split allocation during deletion for booking', bId, e);
        }
      }
    } else if (payment.booking) {
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
  } catch (e) {
    console.error('Failed to revert linked booking/invoice during payment deletion', e);
  }

  await payment.deleteOne();
  res.json({ success: true });
}));

module.exports = router;
