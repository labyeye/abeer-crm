const Booking = require('../models/Booking');
const Client = require('../models/Client');
const Staff = require('../models/Staff');
const Inventory = require('../models/Inventory');
const Branch = require('../models/Branch');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const automatedMessaging = require('../services/automatedMessaging');
const taskAutoAssignment = require('../services/taskAutoAssignment');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const { updateBranchRevenue, updateBranchStats } = require('../utils/branchUtils');




const getBookings = asyncHandler(async (req, res) => {
  const { company, branch, client, status, search, startDate, endDate } = req.query;
  let query = { isDeleted: false };
  if (company) query.company = company;
  if (branch) query.branch = branch;
  if (client) query.client = client;
  if (status) query.status = status;
  if (startDate && endDate) {
    
    query.$or = [
      { 'functionDetails.date': { $gte: new Date(startDate), $lte: new Date(endDate) } },
      { 'functionDetailsList.date': { $gte: new Date(startDate), $lte: new Date(endDate) } }
    ];
  }
  if (search) {
    query.$or = [
      { bookingNumber: { $regex: search, $options: 'i' } },
      { 'functionDetails.venue.name': { $regex: search, $options: 'i' } }
    ];
  }

  // If the current user is a branch admin, restrict results to their branch only
  if (req.user && String(req.user.role).toLowerCase() === 'admin') {
    // Prefer branch stored on user object (set during user creation/update)
    if (req.user.branch) {
      query.branch = req.user.branch;
    } else {
      // Fallback: find the branch where this user is admin
      try {
        const BranchModel = require('../models/Branch');
        const userBranch = await BranchModel.findOne({ admin: req.user._id });
        if (userBranch) query.branch = userBranch._id;
      } catch (err) {
        console.warn('Could not auto-resolve admin branch for user', req.user._id, err && err.message);
      }
    }
  }
  const bookings = await Booking.find(query)
    .populate('branch', 'name code')
    .populate('client', 'name phone email')
    .populate('assignedStaff', 'name designation employeeId')
    .populate('inventorySelection', 'name category quantity')
    .populate('staffAssignment.staff', 'user designation department')
    .populate('equipmentAssignment.equipment', 'name sku category')
    .populate('quotation')
    .populate('invoice')
  
  .sort({ 'functionDetails.date': -1 });
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});




const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('branch', 'name code')
    .populate('client', 'name phone email')
    .populate('assignedStaff', 'name designation employeeId')
    .populate('inventorySelection', 'name category quantity')
    .populate('staffAssignment.staff', 'user designation department')
    .populate('equipmentAssignment.equipment', 'name sku category')
    .populate('quotation')
    .populate('invoice');
  if (!booking || booking.isDeleted) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  res.status(200).json({ success: true, data: booking });
});




const createBooking = asyncHandler(async (req, res) => {
  
  const booking = await Booking.create(req.body);
  
  await booking.populate([
    { path: 'client', select: 'name phone email' },
    { path: 'branch', select: 'name code companyName companyPhone companyEmail companyWebsite companyDescription gstNumber' },
    { path: 'assignedStaff', select: 'name designation employeeId' },
    { path: 'inventorySelection', select: 'name category quantity' }
  ]);
  
  // If the booking includes equipment assignments, decrement inventory quantities and mark status
  try {
    if (Array.isArray(booking.equipmentAssignment) && booking.equipmentAssignment.length) {
      for (const assign of booking.equipmentAssignment) {
        try {
          const inv = await Inventory.findById(assign.equipment);
          if (!inv) continue;
          const assignQty = Number(assign.quantity) || 1;
          inv.quantity = Math.max(0, Number(inv.quantity || 0) - assignQty);
          // set status to Booked if some units have been allocated, else Out of Stock when zero
          if (inv.quantity === 0) inv.status = 'Out of Stock';
          else inv.status = 'Booked';
          await inv.save();
        } catch (err) {
          console.warn('Failed to adjust inventory for assignment during booking create', err);
        }
      }
    }
  } catch (err) {
    console.warn('Failed processing equipmentAssignment on booking create', err);
  }

  
  try {
    // Use branch as the source for company-like info (Booking doesn't have a `company` field)
    await automatedMessaging.sendBookingConfirmed({
      client: booking.client,
      booking: booking,
      company: booking.branch,
      branch: booking.branch,
      staffDetails: 'जल्द ही भेजी जाएगी' 
    });
    
    
    await taskAutoAssignment.autoAssignTasks(booking._id);
  } catch (error) {
    console.error('Error in automated processes:', error);
    
  }

  // If booking is created already in 'completed' status or paymentStatus is completed, update branch stats
  if (booking.status === 'completed' || booking.paymentStatus === 'completed') {
    try {
      await updateBranchStats(booking.branch);
      // fetch updated branch to include in response
      const BranchModel = require('../models/Branch');
      const updatedBranch = await BranchModel.findById(booking.branch);
      booking._updatedBranch = updatedBranch;
    } catch (err) {
      console.error('Error updating branch stats after booking create:', err);
    }
  }
  
  res.status(201).json({ success: true, data: booking });
});




const updateBooking = asyncHandler(async (req, res) => {
  const oldBooking = await Booking.findById(req.params.id);
  if (!oldBooking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  
  const oldStatus = oldBooking.status;
  const oldPaymentStatus = oldBooking.paymentStatus;
  const oldTotalAmount = oldBooking.pricing?.totalAmount;
  
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  
  await booking.populate([
    { path: 'client', select: 'name phone email' },
    { path: 'branch', select: 'name code companyName companyPhone companyEmail companyWebsite companyDescription gstNumber' },
    { path: 'assignedStaff', select: 'name designation employeeId' },
    { path: 'inventorySelection', select: 'name category quantity' }
  ]);
  
  let shouldUpdateStats = false;
  if (req.body.status === 'completed' && oldStatus !== 'completed') {
    shouldUpdateStats = true;
  }

  if (req.body.paymentStatus === 'completed' && oldPaymentStatus !== 'completed') {
    shouldUpdateStats = true;
  }

  if (req.body.pricing && typeof req.body.pricing.totalAmount === 'number' && req.body.pricing.totalAmount !== oldTotalAmount) {
    shouldUpdateStats = true;
  }

  if (shouldUpdateStats) {
    try {
      await updateBranchStats(booking.branch);
      const BranchModel = require('../models/Branch');
      const updatedBranch = await BranchModel.findById(booking.branch);
      booking._updatedBranch = updatedBranch;
    } catch (err) {
      console.error('Error updating branch stats after booking update:', err);
    }
  }

  // If booking was cancelled in this update, restore any allocated equipment back to inventory
  try {
    if (req.body.status === 'cancelled' && oldStatus !== 'cancelled') {
      if (Array.isArray(booking.equipmentAssignment) && booking.equipmentAssignment.length) {
        for (const assign of booking.equipmentAssignment) {
          try {
            const inv = await Inventory.findById(assign.equipment);
            if (!inv) continue;
            const qty = Number(assign.quantity) || 1;
            inv.quantity = Number(inv.quantity || 0) + qty;
            if (inv.quantity > 0) inv.status = 'Active';
            await inv.save();
          } catch (err) {
            console.warn('Failed to restore inventory for assignment during booking cancellation', err);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed processing equipmentAssignment on booking update (cancellation)', err);
  }
  res.status(200).json({ success: true, data: booking });
});




const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking || booking.isDeleted) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  // Before marking deleted, restore any inventory quantities that were allocated to this booking
  try {
    if (Array.isArray(booking.equipmentAssignment) && booking.equipmentAssignment.length) {
      for (const assign of booking.equipmentAssignment) {
        try {
          const inv = await Inventory.findById(assign.equipment);
          if (!inv) continue;
          const qty = Number(assign.quantity) || 1;
          inv.quantity = Number(inv.quantity || 0) + qty;
          // If after restoration we have some stock, mark as Active
          if (inv.quantity > 0) inv.status = 'Active';
          await inv.save();
        } catch (err) {
          console.warn('Failed to restore inventory for assignment during booking delete', err);
        }
      }
    }
  } catch (err) {
    console.warn('Failed processing equipmentAssignment on booking delete', err);
  }

  booking.isDeleted = true;
  await booking.save();
  res.status(200).json({ success: true, data: {} });
});




const assignStaff = asyncHandler(async (req, res) => {
  const { staffId, role } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  booking.staffAssignment.push({ staff: staffId, role });
  await booking.save();
  res.status(200).json({ success: true, data: booking });
});




const assignInventory = asyncHandler(async (req, res) => {
  const { equipmentId, quantity } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  // push assignment to booking
  booking.equipmentAssignment.push({ equipment: equipmentId, quantity });
  await booking.save();

  // decrement inventory stock for the assigned equipment
  try {
    const inv = await Inventory.findById(equipmentId);
    if (inv) {
      const assignQty = Number(quantity) || 1;
      inv.quantity = Math.max(0, Number(inv.quantity || 0) - assignQty);
      if (inv.quantity === 0) inv.status = 'Out of Stock';
      else inv.status = 'Booked';
      await inv.save();
    }
  } catch (err) {
    console.warn('Failed to adjust inventory during assignInventory', err);
  }

  res.status(200).json({ success: true, data: booking });
});




const getBookingsForStaff = asyncHandler(async (req, res) => {
  console.log('🔍 Getting bookings for staff with user ID:', req.params.staffId);
  
  
  const Staff = require('../models/Staff');
  const staff = await Staff.findOne({ user: req.params.staffId });
  
  let bookings = [];
  
  if (staff) {
    console.log('✅ Staff record found:', staff.name, 'Staff ID:', staff._id);
    
    
    bookings = await Booking.find({
      $or: [
        { assignedStaff: staff._id },
        { 'staffAssignment.staff': staff._id }
      ],
      isDeleted: false
    })
      .populate('client', 'name phone email')
      .populate('branch', 'name code companyName companyPhone companyEmail companyWebsite companyDescription gstNumber')
      .populate('assignedStaff', 'name designation employeeId')
      .populate('inventorySelection', 'name category quantity')
      .populate('staffAssignment.staff', 'user designation department')
      .populate('equipmentAssignment.equipment', 'name sku category')
      .populate('quotation')
      .populate('invoice')
      .sort({ 'functionDetails.date': -1 });
  } else {
    console.log('⚠️ No staff record found for user ID:', req.params.staffId);
    
    
  }
  
  console.log('📊 Found', bookings.length, 'bookings for staff');
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});


// Get bookings for the currently authenticated staff user
const getMyBookings = asyncHandler(async (req, res) => {
  // only staff role should use this endpoint, but allow admins/chairman to call as well if needed
  const userId = req.user._id;
  const Staff = require('../models/Staff');
  const staff = await Staff.findOne({ user: userId });
  if (!staff) return res.status(404).json({ success: false, message: 'Staff record not found for current user' });

  // Reuse the same query logic as getBookingsForStaff
  const bookings = await Booking.find({
    $or: [
      { assignedStaff: staff._id },
      { 'staffAssignment.staff': staff._id }
    ],
    isDeleted: false
  })
    .populate('client', 'name phone email')
    .populate('branch', 'name code companyName companyPhone companyEmail companyWebsite companyDescription gstNumber')
    .populate('assignedStaff', 'name designation employeeId')
    .populate('inventorySelection', 'name category quantity')
    .populate('staffAssignment.staff', 'user designation department')
    .populate('equipmentAssignment.equipment', 'name sku category')
    .populate('quotation')
    .populate('invoice')
    .sort({ 'functionDetails.date': -1 });

  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});




const getBookingsForInventory = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ 'equipmentAssignment.equipment': req.params.equipmentId, isDeleted: false })
    .populate('client', 'name phone email')
    .populate('branch', 'name code companyName companyPhone companyEmail companyWebsite companyDescription gstNumber')
    .populate('assignedStaff', 'name designation employeeId');
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

module.exports = {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  assignStaff,
  assignInventory,
  getBookingsForStaff,
  getMyBookings,
  getBookingsForInventory
}; 