const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const Staff = require('../models/Staff');
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Quotation = require('../models/Quotation');


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


const updateBranchRevenue = async (branchId) => {
  try {
    const breakdown = await computeBranchRevenueBreakdown(branchId);
    return breakdown.total;
  } catch (error) {
    console.error('Error updating branch revenue:', error);
    throw error;
  }
};


const computeBranchRevenueBreakdown = async (branchId) => {
  try {
    const invoiceRevenue = await Invoice.aggregate([
      { $match: { branch: branchId, status: 'paid', isDeleted: false } },
      { $group: { _id: null, total: { $sum: {
        $ifNull: [
          '$pricing.totalAmount',
          { $ifNull: ['$pricing.finalAmount', { $ifNull: ['$pricing.total', '$totalAmount'] }] }
        ]
      } } } }
    ]);

    const bookingRevenue = await Booking.aggregate([
      { $match: { 
          status: 'completed',
          isDeleted: false,
          $or: [ { branch: mongoose.Types.ObjectId(branchId) }, { bookingBranch: mongoose.Types.ObjectId(branchId) }, { branch: branchId }, { bookingBranch: branchId } ]
      } },
      { $group: { _id: null, total: { $sum: {
        $ifNull: [
          '$pricing.totalAmount',
          { $ifNull: ['$pricing.finalAmount', { $ifNull: ['$pricing.total', '$totalAmount'] }] }
        ]
      } } } }
    ]);

    const quotationRevenue = await Quotation.aggregate([
      { $match: { branch: branchId, status: 'accepted', isDeleted: false } },
      { $group: { _id: null, total: { $sum: {
        $ifNull: [
          '$pricing.totalAmount',
          { $ifNull: ['$pricing.finalAmount', { $ifNull: ['$pricing.total', '$totalAmount'] }] }
        ]
      } } } }
    ]);

    const breakdown = {
      invoices: invoiceRevenue[0]?.total || 0,
      bookings: bookingRevenue[0]?.total || 0,
      quotations: quotationRevenue[0]?.total || 0,
    };

    breakdown.total = breakdown.invoices + breakdown.bookings + breakdown.quotations;

    // persist breakdown object to branch.revenue
    await Branch.findByIdAndUpdate(branchId, { revenue: {
      total: breakdown.total,
      invoices: breakdown.invoices,
      bookings: breakdown.bookings,
      quotations: breakdown.quotations
    } });

    return breakdown;
  } catch (err) {
    console.error('Error computing branch revenue breakdown:', err);
    throw err;
  }
};


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
  computeBranchRevenueBreakdown,
  updateBranchStats,
  updateAllBranchesStats
};
