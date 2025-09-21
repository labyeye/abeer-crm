const Client = require('../models/Client');
const Booking = require('../models/Booking');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');




const getAllClients = asyncHandler(async (req, res) => {
  const { branch, status, category, search } = req.query;
  
  let query = { isDeleted: false };
  
  if (branch) query.branch = branch;
  if (status) query.status = status;
  if (category) query.category = category;
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } }
    ];
  }
  
  const clients = await Client.find(query)
    .populate('branch', 'name code')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: clients.length,
    data: clients
  });
});




const getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id)
    .populate('branch', 'name code');
  
  if (!client || client.isDeleted) {
    return next(new ErrorResponse('Client not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: client
  });
});




const createClient = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    whatsapp,
    address,
    reference,
    gstStatus,
    gstNumber,
    category,
    aadharNumber,
    panNumber,
    userId,
    password
  } = req.body;
  
  
  const existingClient = await Client.findOne({ 
    phone,
    branch: req.body.branch || req.user.branchId,
    isDeleted: false 
  });
  
  if (existingClient) {
    return next(new ErrorResponse('Client with this phone number already exists', 400));
  }
  
  const clientData = {
    name,
    phone,
    email,
    whatsapp,
    address,
    reference,
    gstStatus: gstStatus || 'without_gst',
    gstNumber,
    category: category || 'individual',
    aadharNumber,
    panNumber,
    userId,
    password,
    branch: req.body.branch || req.user.branchId
  };
  
  const client = await Client.create(clientData);
  
  res.status(201).json({
    success: true,
    data: client
  });
});




const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  
  if (!client || client.isDeleted) {
    return next(new ErrorResponse('Client not found', 404));
  }
  
  
  if (req.body.phone && req.body.phone !== client.phone) {
    const existingClient = await Client.findOne({ 
      phone: req.body.phone, 
      company: req.user.companyId,
      _id: { $ne: req.params.id },
      isDeleted: false 
    });
    
    if (existingClient) {
      return next(new ErrorResponse('Client with this phone number already exists', 400));
    }
  }
  
  const updatedClient = await Client.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: updatedClient
  });
});




const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  
  if (!client || client.isDeleted) {
    return next(new ErrorResponse('Client not found', 404));
  }
  
  client.isDeleted = true;
  await client.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});




const getClientBookings = asyncHandler(async (req, res) => {
  const { status, startDate, endDate } = req.query;
  
  let query = { client: req.params.id, isDeleted: false };
  
  if (status) query.status = status;
  
  if (startDate && endDate) {
    query.$or = [
      { 'functionDetails.date': { $gte: new Date(startDate), $lte: new Date(endDate) } },
      { 'functionDetailsList.date': { $gte: new Date(startDate), $lte: new Date(endDate) } }
    ];
  }
  
  const bookings = await Booking.find(query)
    .populate('company', 'name')
    .populate('branch', 'name code')
    .sort({ 'functionDetails.date': -1 });
  
  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});




const getClientQuotations = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let query = { client: req.params.id, isDeleted: false };
  
  if (status) query.status = status;
  
  const quotations = await Quotation.find(query)
    .populate('company', 'name')
    .populate('branch', 'name code')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: quotations.length,
    data: quotations
  });
});




const getClientInvoices = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let query = { client: req.params.id, isDeleted: false };
  
  if (status) query.status = status;
  
  const invoices = await Invoice.find(query)
    .populate('company', 'name')
    .populate('branch', 'name code')
    .sort({ invoiceDate: -1 });
  
  res.status(200).json({
    success: true,
    count: invoices.length,
    data: invoices
  });
});




const getClientSummary = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  
  if (!client || client.isDeleted) {
    return next(new ErrorResponse('Client not found', 404));
  }
  
  
  const bookings = await Booking.find({ client: req.params.id, isDeleted: false });
  
  
  const quotations = await Quotation.find({ client: req.params.id, isDeleted: false });
  
  
  const invoices = await Invoice.find({ client: req.params.id, isDeleted: false });
  
  const summary = {
    totalBookings: bookings.length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    totalQuotations: quotations.length,
    acceptedQuotations: quotations.filter(q => q.status === 'accepted').length,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    totalRevenue: invoices.reduce((sum, i) => sum + i.pricing.totalAmount, 0),
    totalPaid: invoices.reduce((sum, i) => {
      return sum + i.paymentHistory.reduce((pSum, p) => pSum + p.amount, 0);
    }, 0),
    lastBookingDate: client.lastBookingDate,
    totalSpent: client.totalSpent
  };
  
  res.status(200).json({
    success: true,
    data: summary
  });
});




const searchClients = asyncHandler(async (req, res) => {
  const { query } = req.params;
  
  const clients = await Client.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ],
    company: req.user.companyId,
    isDeleted: false
  })
  .select('name phone email')
  .limit(10);
  
  res.status(200).json({
    success: true,
    count: clients.length,
    data: clients
  });
});

module.exports = {
  getAllClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientBookings,
  getClientQuotations,
  getClientInvoices,
  getClientSummary,
  searchClients
}; 