const Branch = require('../models/Branch');
const Staff = require('../models/Staff');
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Quotation = require('../models/Quotation');

// Update employee count for a specific branch
const updateBranchEmployeeCount = async (branchId) => {
  try {
    const activeStaffCount = await Staff.countDocuments({
      branch: branchId,
      isDeleted: false,
      isActive: true
    });

    await Branch.findByIdAndUpdate(branchId, {
      employeeCount: activeStaffCount
    });

    return activeStaffCount;
  } catch (error) {
    console.error('Error updating branch employee count:', error);
    throw error;
  }
};

// Calculate and update revenue for a specific branch
const updateBranchRevenue = async (branchId) => {
  try {
    // Calculate revenue from invoices
    const invoiceRevenue = await Invoice.aggregate([
      { $match: { branch: branchId, status: 'paid', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Calculate revenue from bookings
    const bookingRevenue = await Booking.aggregate([
      { $match: { branch: branchId, status: 'completed', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Calculate revenue from quotations (converted to invoices)
    const quotationRevenue = await Quotation.aggregate([
      { $match: { branch: branchId, status: 'accepted', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalRevenue = (
      (invoiceRevenue[0]?.total || 0) +
      (bookingRevenue[0]?.total || 0) +
      (quotationRevenue[0]?.total || 0)
    );

    await Branch.findByIdAndUpdate(branchId, {
      revenue: totalRevenue
    });

    return totalRevenue;
  } catch (error) {
    console.error('Error updating branch revenue:', error);
    throw error;
  }
};

// Update both employee count and revenue for a branch
const updateBranchStats = async (branchId) => {
  try {
    await Promise.all([
      updateBranchEmployeeCount(branchId),
      updateBranchRevenue(branchId)
    ]);
  } catch (error) {
    console.error('Error updating branch stats:', error);
    throw error;
  }
};

// Update all branches stats (for periodic updates)
const updateAllBranchesStats = async () => {
  try {
    const branches = await Branch.find({ isDeleted: false });
    
    for (const branch of branches) {
      await updateBranchStats(branch._id);
    }
  } catch (error) {
    console.error('Error updating all branches stats:', error);
    throw error;
  }
};

module.exports = {
  updateBranchEmployeeCount,
  updateBranchRevenue,
  updateBranchStats,
  updateAllBranchesStats
};
