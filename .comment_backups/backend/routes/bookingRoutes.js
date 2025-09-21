const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking
} = require('../controller/bookingController');

router.route('/')
  .get(protect, authorize('chairman', 'admin', 'staff'), getBookings)
  .post(protect, authorize('chairman', 'admin'), createBooking);

router.route('/:id')
  .get(protect, getBooking)
  .put(protect, authorize('chairman', 'admin'), updateBooking)
  .delete(protect, authorize('chairman', 'admin'), deleteBooking);

// Staff status update endpoint (limited update for staff)
router.put('/:id/status', protect, authorize('staff', 'chairman', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'in_progress', 'completed'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Allowed statuses: ' + allowedStatuses.join(', ') 
      });
    }

    const Booking = require('../models/Booking');
    const booking = await Booking.findById(req.params.id);
    
    if (!booking || booking.isDeleted) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // If user is staff, check if they are assigned to this booking
    if (req.user.role === 'staff') {
      const Staff = require('../models/Staff');
      const staff = await Staff.findOne({ user: req.user._id });
      
      if (!staff) {
        return res.status(403).json({ success: false, message: 'Staff record not found' });
      }

      const isAssigned = booking.assignedStaff.includes(staff._id) || 
                        booking.staffAssignment.some(assignment => assignment.staff.equals(staff._id));
      
      if (!isAssigned) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only update status of bookings assigned to you' 
        });
      }
    }

    booking.status = status;
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('client', 'name phone email')
      .populate('company', 'name')
      .populate('branch', 'name code')
      .populate('assignedStaff', 'name designation employeeId')
      .populate('inventorySelection', 'name category quantity');

    res.status(200).json({ success: true, data: populatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Staff assigned bookings
router.get('/staff/:staffId', protect, authorize('staff', 'admin', 'chairman'), require('../controller/bookingController').getBookingsForStaff);

// Debug endpoint to check staff-booking relationships
router.get('/debug/staff/:staffId', protect, async (req, res) => {
  try {
    const Staff = require('../models/Staff');
    const Booking = require('../models/Booking');
    
    console.log('🔍 Debug: Checking staff ID:', req.params.staffId);
    
    // Check if staff record exists
    const staff = await Staff.findOne({ user: req.params.staffId });
    console.log('👤 Staff record:', staff ? `Found: ${staff.name}` : 'Not found');
    
    if (staff) {
      // Check bookings
      const bookings1 = await Booking.find({ assignedStaff: staff._id, isDeleted: false });
      const bookings2 = await Booking.find({ 'staffAssignment.staff': staff._id, isDeleted: false });
      
      console.log('📋 Bookings in assignedStaff:', bookings1.length);
      console.log('📋 Bookings in staffAssignment:', bookings2.length);
      
      res.json({
        success: true,
        staffRecord: staff ? { id: staff._id, name: staff.name } : null,
        bookingsInAssignedStaff: bookings1.length,
        bookingsInStaffAssignment: bookings2.length,
        totalBookings: bookings1.length + bookings2.length
      });
    } else {
      res.json({
        success: false,
        message: 'Staff record not found',
        userIdReceived: req.params.staffId
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
