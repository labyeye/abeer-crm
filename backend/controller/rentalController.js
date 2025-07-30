const Rental = require('../models/Rental');
const Inventory = require('../models/Inventory');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all rentals
// @route   GET /api/rentals
// @access  Private
const getAllRentals = asyncHandler(async (req, res, next) => {
  const { rentalType, status, branch } = req.query;
  
  let query = { company: req.user.companyId };
  
  if (rentalType) {
    query.rentalType = rentalType;
  }
  
  if (status) {
    query.status = status;
  }
  
  if (branch) {
    query.branch = branch;
  }
  
  const rentals = await Rental.find(query)
    .populate('equipment', 'name type')
    .populate('branch', 'name code')
    .populate('booking', 'functionDetails')
    .populate('createdBy', 'name')
    .sort('-createdAt');
  
  res.status(200).json({
    success: true,
    count: rentals.length,
    data: rentals
  });
});

// @desc    Get single rental
// @route   GET /api/rentals/:id
// @access  Private
const getRental = asyncHandler(async (req, res, next) => {
  const rental = await Rental.findById(req.params.id)
    .populate('equipment', 'name type condition')
    .populate('branch', 'name code')
    .populate('booking', 'functionDetails client')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');
  
  if (!rental) {
    return next(new ErrorResponse(`Rental not found with id of ${req.params.id}`, 404));
  }
  
  // Check if overdue
  if (rental.isOverdue()) {
    rental.status = 'overdue';
    await rental.save();
  }
  
  res.status(200).json({
    success: true,
    data: rental
  });
});

// @desc    Create new rental
// @route   POST /api/rentals
// @access  Private
const createRental = asyncHandler(async (req, res, next) => {
  req.body.company = req.user.companyId;
  req.body.createdBy = req.user.id;
  
  // Check if equipment is available
  if (req.body.rentalType === 'outgoing') {
    const equipment = await Inventory.findById(req.body.equipment);
    if (!equipment) {
      return next(new ErrorResponse('Equipment not found', 404));
    }
    
    if (equipment.quantity < 1) {
      return next(new ErrorResponse('Equipment not available for rental', 400));
    }
    
    // Update equipment quantity
    equipment.quantity -= 1;
    await equipment.save();
  }
  
  const rental = await Rental.create(req.body);
  
  await rental.populate([
    { path: 'equipment', select: 'name type' },
    { path: 'branch', select: 'name code' },
    { path: 'createdBy', select: 'name' }
  ]);
  
  res.status(201).json({
    success: true,
    data: rental
  });
});

// @desc    Update rental
// @route   PUT /api/rentals/:id
// @access  Private
const updateRental = asyncHandler(async (req, res, next) => {
  req.body.updatedBy = req.user.id;
  
  let rental = await Rental.findById(req.params.id);
  
  if (!rental) {
    return next(new ErrorResponse(`Rental not found with id of ${req.params.id}`, 404));
  }
  
  // If status is changing to returned, update equipment quantity
  if (req.body.status === 'returned' && rental.status !== 'returned') {
    if (rental.rentalType === 'outgoing') {
      const equipment = await Inventory.findById(rental.equipment);
      if (equipment) {
        equipment.quantity += 1;
        await equipment.save();
      }
    }
    req.body.actualReturnDate = new Date();
  }
  
  rental = await Rental.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate([
    { path: 'equipment', select: 'name type' },
    { path: 'branch', select: 'name code' },
    { path: 'booking', select: 'functionDetails' },
    { path: 'createdBy', select: 'name' },
    { path: 'updatedBy', select: 'name' }
  ]);
  
  res.status(200).json({
    success: true,
    data: rental
  });
});

// @desc    Delete rental
// @route   DELETE /api/rentals/:id
// @access  Private
const deleteRental = asyncHandler(async (req, res, next) => {
  const rental = await Rental.findById(req.params.id);
  
  if (!rental) {
    return next(new ErrorResponse(`Rental not found with id of ${req.params.id}`, 404));
  }
  
  // Return equipment to inventory if it was rented out
  if (rental.rentalType === 'outgoing' && rental.status !== 'returned') {
    const equipment = await Inventory.findById(rental.equipment);
    if (equipment) {
      equipment.quantity += 1;
      await equipment.save();
    }
  }
  
  await rental.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get rental statistics
// @route   GET /api/rentals/stats
// @access  Private
const getRentalStats = asyncHandler(async (req, res, next) => {
  const { branch } = req.query;
  
  let query = { company: req.user.companyId };
  if (branch) {
    query.branch = branch;
  }
  
  const [outgoingRentals, incomingRentals] = await Promise.all([
    Rental.find({ ...query, rentalType: 'outgoing' }),
    Rental.find({ ...query, rentalType: 'incoming' })
  ]);
  
  const stats = {
    outgoing: {
      total: outgoingRentals.length,
      active: outgoingRentals.filter(r => r.status === 'active').length,
      overdue: outgoingRentals.filter(r => r.status === 'overdue').length,
      revenue: outgoingRentals.reduce((sum, r) => sum + r.totalAmount, 0)
    },
    incoming: {
      total: incomingRentals.length,
      active: incomingRentals.filter(r => r.status === 'active').length,
      overdue: incomingRentals.filter(r => r.status === 'overdue').length,
      cost: incomingRentals.reduce((sum, r) => sum + r.totalAmount, 0)
    },
    total: {
      rentals: outgoingRentals.length + incomingRentals.length,
      overdue: outgoingRentals.filter(r => r.status === 'overdue').length + 
               incomingRentals.filter(r => r.status === 'overdue').length,
      revenue: outgoingRentals.reduce((sum, r) => sum + r.totalAmount, 0) - 
               incomingRentals.reduce((sum, r) => sum + r.totalAmount, 0)
    }
  };
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get overdue rentals
// @route   GET /api/rentals/overdue
// @access  Private
const getOverdueRentals = asyncHandler(async (req, res, next) => {
  const { branch } = req.query;
  
  let query = { 
    company: req.user.companyId,
    status: 'active',
    endDate: { $lt: new Date() }
  };
  
  if (branch) {
    query.branch = branch;
  }
  
  const overdueRentals = await Rental.find(query)
    .populate('equipment', 'name type')
    .populate('branch', 'name code')
    .populate('createdBy', 'name')
    .sort('endDate');
  
  res.status(200).json({
    success: true,
    count: overdueRentals.length,
    data: overdueRentals
  });
});

module.exports = {
  getAllRentals,
  getRental,
  createRental,
  updateRental,
  deleteRental,
  getRentalStats,
  getOverdueRentals
}; 