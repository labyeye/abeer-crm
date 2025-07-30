const Booking = require('../models/Booking');
const Client = require('../models/Client');
const Staff = require('../models/Staff');
const Inventory = require('../models/Inventory');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
const getAllBookings = asyncHandler(async (req, res) => {
  const { company, branch, client, status, search, startDate, endDate } = req.query;
  let query = { isDeleted: false };
  if (company) query.company = company;
  if (branch) query.branch = branch;
  if (client) query.client = client;
  if (status) query.status = status;
  if (startDate && endDate) {
    query['functionDetails.date'] = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  if (search) {
    query.$or = [
      { bookingNumber: { $regex: search, $options: 'i' } },
      { 'functionDetails.venue.name': { $regex: search, $options: 'i' } }
    ];
  }
  const bookings = await Booking.find(query)
    .populate('company', 'name')
    .populate('branch', 'name code')
    .populate('client', 'name phone email')
    .populate('staffAssignment.staff', 'user designation department')
    .populate('equipmentAssignment.equipment', 'name sku category')
    .populate('quotation')
    .populate('invoice')
    .sort({ 'functionDetails.date': -1 });
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('company', 'name')
    .populate('branch', 'name code')
    .populate('client', 'name phone email')
    .populate('staffAssignment.staff', 'user designation department')
    .populate('equipmentAssignment.equipment', 'name sku category')
    .populate('quotation')
    .populate('invoice');
  if (!booking || booking.isDeleted) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  res.status(200).json({ success: true, data: booking });
});

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.create(req.body);
  res.status(201).json({ success: true, data: booking });
});

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  res.status(200).json({ success: true, data: booking });
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking || booking.isDeleted) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  booking.isDeleted = true;
  await booking.save();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Assign staff to booking
// @route   POST /api/bookings/:id/assign-staff
// @access  Private
const assignStaff = asyncHandler(async (req, res) => {
  const { staffId, role } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  booking.staffAssignment.push({ staff: staffId, role });
  await booking.save();
  res.status(200).json({ success: true, data: booking });
});

// @desc    Assign inventory to booking
// @route   POST /api/bookings/:id/assign-inventory
// @access  Private
const assignInventory = asyncHandler(async (req, res) => {
  const { equipmentId, quantity } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  booking.equipmentAssignment.push({ equipment: equipmentId, quantity });
  await booking.save();
  res.status(200).json({ success: true, data: booking });
});

// @desc    Get all bookings for a staff member
// @route   GET /api/bookings/staff/:staffId
// @access  Private
const getBookingsForStaff = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ 'staffAssignment.staff': req.params.staffId, isDeleted: false })
    .populate('client', 'name phone email')
    .populate('company', 'name')
    .populate('branch', 'name code');
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

// @desc    Get all bookings for an inventory item
// @route   GET /api/bookings/inventory/:equipmentId
// @access  Private
const getBookingsForInventory = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ 'equipmentAssignment.equipment': req.params.equipmentId, isDeleted: false })
    .populate('client', 'name phone email')
    .populate('company', 'name')
    .populate('branch', 'name code');
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

module.exports = {
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  assignStaff,
  assignInventory,
  getBookingsForStaff,
  getBookingsForInventory
}; 