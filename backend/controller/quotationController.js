const Quotation = require('../models/Quotation');
const Client = require('../models/Client');
const Branch = require('../models/Branch');
const automatedMessaging = require('../services/automatedMessaging');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const { updateBranchRevenue } = require('../utils/branchUtils');

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getAllQuotations = asyncHandler(async (req, res, next) => {
  const { branch, client, status, search, startDate, endDate } = req.query;
  
  let query = { isDeleted: false };
  
  // Filter by user permissions
  if (req.user.role !== 'chairman') {
    if (req.user.branchId) {
      query.branch = req.user.branchId;
    }
  }
  
  if (branch) query.branch = branch;
  if (client) query.client = client;
  if (status) query.status = status;
  
  if (startDate && endDate) {
    query['functionDetails.date'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (search) {
    query.$or = [
      { quotationNumber: { $regex: search, $options: 'i' } },
      { 'functionDetails.type': { $regex: search, $options: 'i' } }
    ];
  }
  
  const quotations = await Quotation.find(query)
    .populate('client', 'name phone email')
    .populate('branch', 'companyName name code')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: quotations.length,
    data: quotations
  });
});

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
const getQuotation = asyncHandler(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('client')
    .populate('branch')
    .populate('createdBy', 'name email');
  
  if (!quotation || quotation.isDeleted) {
    return next(new ErrorResponse('Quotation not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: quotation
  });
});

// @desc    Create quotation
// @route   POST /api/quotations
// @access  Private
const createQuotation = asyncHandler(async (req, res, next) => {
  // Validate required fields
  if (!req.body.client) {
    return next(new ErrorResponse('Client is required', 400));
  }

  if (!req.body.functionDetails?.type && !req.body.eventType) {
    return next(new ErrorResponse('Function/Event type is required', 400));
  }

  if (!req.body.functionDetails?.date && !req.body.eventDate) {
    return next(new ErrorResponse('Function/Event date is required', 400));
  }

  // Generate quotation number
  const count = await Quotation.countDocuments({ branch: req.user.branchId });
  const quotationNumber = `QUO-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  
  const quotationData = {
    quotationNumber,
    branch: (req.user.role === 'chairman' && req.body.branch) ? req.body.branch : req.user.branchId,
    client: req.body.client,
    createdBy: req.user.id,
    status: req.body.status || 'draft',
    notes: req.body.notes || '',
    terms: req.body.terms || {},
    functionDetails: {
      type: req.body.functionDetails?.type || req.body.functionDetails?.event || req.body.eventType || 'General Event',
      date: req.body.functionDetails?.date ? new Date(req.body.functionDetails.date) : (req.body.eventDate ? new Date(req.body.eventDate) : new Date()),
      time: {
        start: req.body.functionDetails?.startTime || req.body.startTime || '',
        end: req.body.functionDetails?.endTime || req.body.endTime || ''
      },
      venue: req.body.functionDetails?.venue || {}
    },
    services: Array.isArray(req.body.services)
      ? req.body.services.map((s) => ({
          service: s.service || s.name || s.description || '',
          description: s.description || '',
          quantity: Number(s.quantity || 1),
          rate: Number(s.rate ?? s.price ?? 0),
          amount: Number(s.amount ?? (Number(s.quantity || 1) * Number(s.rate ?? s.price ?? 0)))
        }))
      : [],
    pricing: {
      subtotal: Number(req.body.pricing?.subtotal ?? req.body.subtotal ?? 0),
      gstAmount: Number(req.body.pricing?.gstAmount ?? req.body.gstAmount ?? 0),
      totalAmount: Number(req.body.pricing?.totalAmount ?? req.body.totalAmount ?? 0),
      discount: Number(req.body.pricing?.discount ?? 0),
      finalAmount: Number(req.body.pricing?.finalAmount ?? req.body.finalAmount ?? 0)
    },
    videoOutput: req.body.videoOutput || '',
    photoOutput: req.body.photoOutput || '',
    rawOutput: req.body.rawOutput || '',
    ...req.body // keep any extra fields the client passed
  };
  
  const quotation = await Quotation.create(quotationData);

  
  // Populate necessary fields for notifications
  await quotation.populate([
    { path: 'client' },
    { path: 'branch' }
  ]);
  
  // Send automated quotation created notification
  try {
    await automatedMessaging.sendQuotationCreated({
      client: quotation.client,
      quotation: quotation,
      branch: quotation.branch
    });
  } catch (error) {
    console.error('Error sending quotation notification:', error);
    // Don't fail quotation creation if notification fails
  }
  
  res.status(201).json({
    success: true,
    data: quotation
  });
});

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
const updateQuotation = asyncHandler(async (req, res, next) => {
  let quotation = await Quotation.findById(req.params.id);
  
  if (!quotation || quotation.isDeleted) {
    return next(new ErrorResponse('Quotation not found', 404));
  }
  
  // Check permissions
  if (req.user.role !== 'chairman' && 
      req.user.branchId && 
      quotation.branch.toString() !== req.user.branchId) {
    return next(new ErrorResponse('Not authorized to update this quotation', 403));
  }
  
  const oldStatus = quotation.status;
  
  // Ensure output fields are updated if present
  const updateData = {
    ...req.body,
    ...(req.body.videoOutput !== undefined ? { videoOutput: req.body.videoOutput } : {}),
    ...(req.body.photoOutput !== undefined ? { photoOutput: req.body.photoOutput } : {}),
    ...(req.body.rawOutput !== undefined ? { rawOutput: req.body.rawOutput } : {}),
  };
  quotation = await Quotation.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('client branch');
  
  // Update branch revenue if status changed to 'accepted'
  if (req.body.status === 'accepted' && oldStatus !== 'accepted') {
    await updateBranchRevenue(quotation.branch);
  }
  
  res.status(200).json({
    success: true,
    data: quotation
  });
});

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
const deleteQuotation = asyncHandler(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id);
  
  if (!quotation || quotation.isDeleted) {
    return next(new ErrorResponse('Quotation not found', 404));
  }
  
  // Check permissions
  if (req.user.role !== 'chairman' && 
      req.user.branchId && 
      quotation.branch.toString() !== req.user.branchId) {
    return next(new ErrorResponse('Not authorized to delete this quotation', 403));
  }
  
  quotation.isDeleted = true;
  await quotation.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Convert quotation to booking
// @route   POST /api/quotations/:id/convert-to-booking
// @access  Private
const convertToBooking = asyncHandler(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('client branch');
  
  if (!quotation || quotation.isDeleted) {
    return next(new ErrorResponse('Quotation not found', 404));
  }
  
  if (quotation.status === 'converted') {
    return next(new ErrorResponse('Quotation already converted to booking', 400));
  }
  
  // Create booking data from quotation
  const Booking = require('../models/Booking');
  const bookingCount = await Booking.countDocuments({ branch: quotation.branch._id });
  const bookingNumber = `BKG-${Date.now()}-${(bookingCount + 1).toString().padStart(4, '0')}`;
  
  const bookingData = {
    bookingNumber,
    company: quotation.branch._id, // Use branch as company since company info is in branch
    branch: quotation.branch._id,
    client: quotation.client._id,
    functionDetails: quotation.functionDetails,
    services: quotation.services,
    pricing: quotation.pricing,
    terms: quotation.terms,
    quotation: quotation._id,
    status: 'confirmed',
    createdBy: req.user.id
  };
  
  const booking = await Booking.create(bookingData);
  
  // Update quotation status
  quotation.status = 'converted';
  quotation.convertedToBooking = booking._id;
  quotation.convertedAt = new Date();
  await quotation.save();
  
  // Send booking confirmation and auto-assign tasks
  try {
    const automatedMessaging = require('../services/automatedMessaging');
    const taskAutoAssignment = require('../services/taskAutoAssignment');
    
    await automatedMessaging.sendBookingConfirmed({
      client: quotation.client,
      booking: booking,
      branch: quotation.branch,
      staffDetails: 'जल्द ही भेजी जाएगी'
    });
    
    await taskAutoAssignment.autoAssignTasks(booking._id);
  } catch (error) {
    console.error('Error in post-conversion automation:', error);
  }
  
  res.status(200).json({
    success: true,
    data: {
      quotation: quotation,
      booking: booking
    }
  });
});

// @desc    Send follow-up for quotation
// @route   POST /api/quotations/:id/follow-up
// @access  Private
const sendFollowUp = asyncHandler(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('client branch');
  
  if (!quotation || quotation.isDeleted) {
    return next(new ErrorResponse('Quotation not found', 404));
  }
  
  if (quotation.status === 'converted') {
    return next(new ErrorResponse('Cannot send follow-up for converted quotation', 400));
  }
  
  try {
    await automatedMessaging.sendQuotationFollowUp({
      client: quotation.client,
      quotation: quotation,
      branch: quotation.branch
    });
    
    // Update last follow-up date
    quotation.lastFollowUp = new Date();
    await quotation.save();
    
    res.status(200).json({
      success: true,
      message: 'Follow-up sent successfully'
    });
  } catch (error) {
    return next(new ErrorResponse('Failed to send follow-up', 500));
  }
});

// @desc    Get quotation statistics
// @route   GET /api/quotations/stats
// @access  Private
const getQuotationStats = asyncHandler(async (req, res, next) => {
  let matchQuery = { isDeleted: false };
  
  // Filter by user permissions
  if (req.user.role !== 'chairman') {
    if (req.user.branchId) {
      matchQuery.branch = req.user.branchId;
    }
  }
  
  const stats = await Quotation.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        approved: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        },
        converted: {
          $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
        },
        totalValue: { $sum: '$pricing.finalAmount' },
        avgValue: { $avg: '$pricing.finalAmount' }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    data: stats[0] || { 
      total: 0, 
      pending: 0, 
      approved: 0, 
      rejected: 0, 
      converted: 0, 
      totalValue: 0, 
      avgValue: 0 
    }
  });
});

// @desc    Generate PDF for a quotation
// @route   GET /api/quotations/:id/pdf
// @access  Private
const getQuotationPdf = asyncHandler(async (req, res, next) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('client')
    .populate('branch');

  if (!quotation || quotation.isDeleted) {
    return next(new ErrorResponse('Quotation not found', 404));
  }

  // Lazy require pdfkit to avoid adding global dependency until used
  const PDFDocument = require('pdfkit');

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${quotation.quotationNumber || 'quotation'}.pdf"`);

  // Pipe PDF to response
  doc.pipe(res);

  // Simple PDF layout
  doc.fontSize(20).text(quotation.branch?.companyName || 'Company', { align: 'left' });
  doc.moveDown();
  doc.fontSize(14).text(`Quotation: ${quotation.quotationNumber || ''}`);
  doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`);
  doc.moveDown();

  doc.fontSize(12).text(`To: ${quotation.client?.name || ''}`);
  doc.text(`${quotation.client?.email || ''}`);
  doc.text(`${quotation.client?.phone || ''}`);
  doc.moveDown();

  doc.text(`Event: ${quotation.functionDetails?.type || ''} - ${quotation.functionDetails?.date ? new Date(quotation.functionDetails.date).toLocaleDateString() : ''}`);
  doc.text(`Location: ${quotation.functionDetails?.venue?.name || ''} ${quotation.functionDetails?.venue?.address || ''}`);
  doc.moveDown();

  // Table of services
  doc.fontSize(12).text('Services:', { underline: true });
  doc.moveDown(0.5);
  if (Array.isArray(quotation.services)) {
    quotation.services.forEach((s) => {
      const name = s.name || s.service || s.description || JSON.stringify(s);
      const price = s.price ?? s.rate ?? s.amount ?? 0;
      doc.text(`${name} - ₹${price.toLocaleString()}`);
    });
  }
  doc.moveDown();

  const pricing = quotation.pricing || {};
  doc.text(`Subtotal: ₹${(pricing.subtotal ?? pricing.totalAmount ?? 0).toLocaleString()}`);
  if (pricing.gstAmount) doc.text(`GST: ₹${pricing.gstAmount.toLocaleString()}`);
  doc.text(`Total: ₹${(pricing.finalAmount ?? pricing.totalAmount ?? 0).toLocaleString()}`);

  doc.moveDown(2);
  doc.fontSize(10).text('Notes:', { underline: true });
  doc.text(quotation.notes || '-');

  doc.end();
});

module.exports = {
  getAllQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertToBooking,
  sendFollowUp,
  getQuotationStats
  , getQuotationPdf
};
