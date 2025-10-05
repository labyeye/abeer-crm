const Booking = require("../models/Booking");
const Client = require("../models/Client");
const Staff = require("../models/Staff");
const Inventory = require("../models/Inventory");
const Branch = require("../models/Branch");
const Invoice = require("../models/Invoice");
const automatedMessaging = require("../services/automatedMessaging");
const taskAutoAssignment = require("../services/taskAutoAssignment");
const asyncHandler = require("../utils/asyncHandler");
const ErrorResponse = require("../utils/ErrorResponse");
const {
  updateBranchRevenue,
  updateBranchStats,
} = require("../utils/branchUtils");

const getBookings = asyncHandler(async (req, res) => {
  const { company, branch, client, status, search, startDate, endDate } =
    req.query;

  // pagination: ?page=1&limit=100 (defaults)
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(
    1000,
    Math.max(1, parseInt(req.query.limit || "100", 10))
  );
  const skip = (page - 1) * limit;

  let query = { isDeleted: false };
  if (company) query.company = company;
  if (branch) query.branch = branch;
  if (client) query.client = client;
  if (status) query.status = status;
  if (startDate && endDate) {
    query.$or = [
      {
        "functionDetails.date": {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
      {
        "functionDetailsList.date": {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    ];
  }
  if (search) {
    query.$or = [
      { bookingNumber: { $regex: search, $options: "i" } },
      { "functionDetails.venue.name": { $regex: search, $options: "i" } },
    ];
  }

  // If the current user is a branch admin, restrict results to their branch only
  if (req.user && String(req.user.role).toLowerCase() === "admin") {
    if (req.user.branch) {
      query.branch = req.user.branch;
    } else {
      try {
        const BranchModel = require("../models/Branch");
        const userBranch = await BranchModel.findOne({ admin: req.user._id });
        if (userBranch) query.branch = userBranch._id;
      } catch (err) {
        console.warn(
          "Could not auto-resolve admin branch for user",
          req.user._id,
          err && err.message
        );
      }
    }
  }

  // total count for client-side pagination - only compute on first page to avoid an expensive count for every request
  let total;
  if (page === 1) {
    try {
      total = await Booking.countDocuments(query);
    } catch (err) {
      console.warn(
        "Failed to count bookings for pagination:",
        err && err.message
      );
      total = undefined;
    }
  }

  // tighter populate projections and use lean() for faster serialization
  const bookings = await Booking.find(query)
    .populate("branch", "name code")
    .populate("client", "name phone email")
    // populate per-service assigned staff and inventory selection
    .populate("functionDetailsList.assignedStaff", "name employeeId")
    .populate("functionDetailsList.inventorySelection", "name category")
    .populate("staffAssignment.staff", "user name")
    .populate("equipmentAssignment.equipment", "name sku category")
    .populate("invoice", "_id")
    .sort({ "functionDetails.date": -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res
    .status(200)
    .json({
      success: true,
      count: bookings.length,
      total,
      page,
      limit,
      data: bookings,
    });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("branch", "name code")
    .populate("client", "name phone email")
    // populate nested per-service assigned staff and inventorySelection
    .populate("functionDetailsList.assignedStaff", "name designation employeeId")
    .populate("functionDetailsList.inventorySelection", "name category quantity")
    .populate("staffAssignment.staff", "user designation department")
    .populate("equipmentAssignment.equipment", "name sku category")
    .populate("invoice");
  if (!booking || booking.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }
  res.status(200).json({ success: true, data: booking });
});

const Counter = require("../models/Counter");

// Helper to compute financial year string like '2024-2025' for Apr-Mar fiscal year
function computeFinancialYear(date) {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  // financial year starts in April: months 4-12 -> FY = year-(year+1); months 1-3 -> FY = (year-1)-year
  if (month >= 4) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

const createBooking = asyncHandler(async (req, res) => {
  // Extract and validate output fields
  const { videoOutput, photoOutput, rawOutput, notes } = req.body;

  // Ensure output fields are strings if provided
  if (videoOutput !== undefined && typeof videoOutput !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Video output must be a string" });
  }
  if (photoOutput !== undefined && typeof photoOutput !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Photo output must be a string" });
  }
  if (rawOutput !== undefined && typeof rawOutput !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Raw output must be a string" });
  }

  // Normalize pricing fields to ensure numeric types and defaults
  try {
    const p = req.body.pricing || {};
    p.discountAmount = Number(p.discountAmount) || 0;
    p.manualTotal = !!p.manualTotal;
    p.applyGST = !!p.applyGST;
    p.gstRate = Number(p.gstRate) || 0;
    p.gstAmount = Number(p.gstAmount) || 0;
    p.subtotal = Number(p.subtotal) || 0;
    p.totalAmount =
      typeof p.totalAmount === "number"
        ? Number(p.totalAmount)
        : p.subtotal + p.gstAmount - p.discountAmount;
    p.advanceAmount = Number(p.advanceAmount) || 0;
    p.remainingAmount = Number(p.totalAmount) - Number(p.advanceAmount) || 0;
    req.body.pricing = p;
  } catch (err) {
    // Fall back to defaults if normalization fails
    req.body.pricing = {
      subtotal: 0,
      discountAmount: 0,
      manualTotal: false,
      applyGST: false,
      gstRate: 0,
      gstAmount: 0,
      totalAmount: 0,
      advanceAmount: 0,
      remainingAmount: 0,
    };
  }

  // Normalize event fields on functionDetails and functionDetailsList (ensure strings)
  try {
    // Ensure top-level event is a string when provided
    const topLevelEvent =
      req.body.event !== undefined ? String(req.body.event || "") : undefined;

    // Ensure functionDetails exists and has an event (prefer per-item, else top-level)
    req.body.functionDetails = req.body.functionDetails || {};
    if (req.body.functionDetails.event !== undefined) {
      req.body.functionDetails.event = String(
        req.body.functionDetails.event || ""
      );
    } else if (topLevelEvent !== undefined) {
      req.body.functionDetails.event = topLevelEvent;
    }

    // Normalize each entry of functionDetailsList and ensure event is present (fallback to top-level event)
    if (Array.isArray(req.body.functionDetailsList)) {
      req.body.functionDetailsList = req.body.functionDetailsList.map(
        (fd, idx) => {
          // Find corresponding service metadata from req.body.services (if provided)
          const svc = Array.isArray(req.body.services)
            ? req.body.services[idx]
            : undefined;
          return {
            ...fd,
            // prefer per-service event; fallback to fd.event, then top-level event, else empty string
            event:
              fd.event !== undefined
                ? String(fd.event || "")
                : topLevelEvent !== undefined
                ? topLevelEvent
                : "",
            // Ensure per-service service name/type/category are present by falling back to services[idx]
            service:
              fd.service !== undefined &&
              fd.service !== null &&
              fd.service !== ""
                ? fd.service
                : svc
                ? svc.service || svc.serviceName || ""
                : fd.service,
            serviceType:
              fd.serviceType && fd.serviceType.length
                ? fd.serviceType
                : svc
                ? svc.serviceType || svc.type || []
                : fd.serviceType,
            serviceCategory:
              fd.serviceCategory !== undefined && fd.serviceCategory !== null
                ? fd.serviceCategory
                : svc
                ? svc.serviceCategory || svc.serviceCategoryId || null
                : fd.serviceCategory,
          };
        }
      );
    }
  } catch (err) {
    // ignore normalization errors
  }

  // Ensure bookingNumber follows AMP/<FY>/<5-digit seq>
  try {
    // Determine a date to derive financial year: prefer functionDetails.date, else now
    const functionDate =
      (req.body.functionDetails && req.body.functionDetails.date) ||
      (req.body.functionDetailsList &&
        req.body.functionDetailsList[0] &&
        req.body.functionDetailsList[0].date) ||
      new Date().toISOString();
    const fy = computeFinancialYear(functionDate);
    const counterKey = `booking_${fy}`;
    // Atomically increment counter for this financial year
    const counter = await Counter.findOneAndUpdate(
      { _id: counterKey },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const seq = counter.seq || 1;
    const padded = String(seq).padStart(5, "0");
    req.body.bookingNumber = `AMP/${fy}/${padded}`;
  } catch (err) {
    // Fallback to timestamp-based booking number if counter fails
    console.warn(
      "Failed to allocate booking sequence counter, falling back to timestamp id",
      err && err.message
    );
    req.body.bookingNumber = `AMP/${Date.now()}`;
  }

  const booking = await Booking.create(req.body);

  await booking.populate([
    { path: "client", select: "name phone email" },
    {
      path: "branch",
      select:
        "name code companyName companyPhone companyEmail companyWebsite companyDescription gstNumber",
    },
    // populate nested per-service refs for edit response as well
    { path: "functionDetailsList.assignedStaff", select: "name designation employeeId" },
    { path: "functionDetailsList.inventorySelection", select: "name category quantity" },
  ]);

  // If the booking includes equipment assignments, decrement inventory quantities and mark status
  try {
    if (
      Array.isArray(booking.equipmentAssignment) &&
      booking.equipmentAssignment.length
    ) {
      for (const assign of booking.equipmentAssignment) {
        try {
          const inv = await Inventory.findById(assign.equipment);
          if (!inv) continue;
          const assignQty = Number(assign.quantity) || 1;
          inv.quantity = Math.max(0, Number(inv.quantity || 0) - assignQty);
          // set status to Booked if some units have been allocated, else Out of Stock when zero
          if (inv.quantity === 0) inv.status = "Out of Stock";
          else inv.status = "Booked";
          await inv.save();
        } catch (err) {
          console.warn(
            "Failed to adjust inventory for assignment during booking create",
            err
          );
        }
      }
    }
  } catch (err) {
    console.warn(
      "Failed processing equipmentAssignment on booking create",
      err
    );
  }

  try {
    // Fire-and-forget non-critical background tasks to speed up response time
    automatedMessaging
      .sendBookingConfirmed({
        client: booking.client,
        booking: booking,
        company: booking.branch,
        branch: booking.branch,
        staffDetails: "जल्द ही भेजी जाएगी",
      })
      .catch((err) => console.error("automatedMessaging error:", err));

    taskAutoAssignment
      .autoAssignTasks(booking._id)
      .catch((err) => console.error("taskAutoAssignment error:", err));
  } catch (error) {
    console.error("Error scheduling automated processes:", error);
  }

  // If booking is created already in 'completed' status or paymentStatus is completed, update branch stats
  if (booking.status === "completed" || booking.paymentStatus === "completed") {
    try {
      await updateBranchStats(booking.branch);
      // fetch updated branch to include in response
      const BranchModel = require("../models/Branch");
      const updatedBranch = await BranchModel.findById(booking.branch);
      booking._updatedBranch = updatedBranch;
    } catch (err) {
      console.error("Error updating branch stats after booking create:", err);
    }
  }

  res.status(201).json({ success: true, data: booking });
});

const updateBooking = asyncHandler(async (req, res) => {
  const oldBooking = await Booking.findById(req.params.id);
  if (!oldBooking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  // Extract and validate output fields
  const { videoOutput, photoOutput, rawOutput, notes } = req.body;

  // Ensure output fields are strings if provided
  if (videoOutput !== undefined && typeof videoOutput !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Video output must be a string" });
  }
  if (photoOutput !== undefined && typeof photoOutput !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Photo output must be a string" });
  }
  if (rawOutput !== undefined && typeof rawOutput !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Raw output must be a string" });
  }

  const oldStatus = oldBooking.status;
  const oldPaymentStatus = oldBooking.paymentStatus;
  const oldTotalAmount = oldBooking.pricing?.totalAmount;

  // Normalize pricing fields in incoming update body if present
  if (req.body.pricing) {
    const p = req.body.pricing;
    p.discountAmount = Number(p.discountAmount) || 0;
    p.manualTotal = !!p.manualTotal;
    p.applyGST = !!p.applyGST;
    p.gstRate = Number(p.gstRate) || 0;
    p.gstAmount = Number(p.gstAmount) || 0;
    p.subtotal = Number(p.subtotal) || 0;
    p.totalAmount =
      typeof p.totalAmount === "number"
        ? Number(p.totalAmount)
        : p.subtotal + p.gstAmount - p.discountAmount;
    p.advanceAmount = Number(p.advanceAmount) || 0;
    p.remainingAmount = Number(p.totalAmount) - Number(p.advanceAmount) || 0;
    req.body.pricing = p;
  }
  try {
    const topLevelEvent =
      req.body.event !== undefined ? String(req.body.event || "") : undefined;
    if (!req.body.functionDetails) req.body.functionDetails = {};
    if (
      req.body.functionDetails &&
      req.body.functionDetails.event !== undefined
    ) {
      req.body.functionDetails.event = String(
        req.body.functionDetails.event || ""
      );
    } else if (topLevelEvent !== undefined) {
      req.body.functionDetails.event = topLevelEvent;
    }

    if (Array.isArray(req.body.functionDetailsList)) {
      req.body.functionDetailsList = req.body.functionDetailsList.map(
        (fd, idx) => {
          const svc = Array.isArray(req.body.services)
            ? req.body.services[idx]
            : undefined;
          return {
            ...fd,
            event:
              fd.event !== undefined
                ? String(fd.event || "")
                : topLevelEvent !== undefined
                ? topLevelEvent
                : "",
            service:
              fd.service !== undefined &&
              fd.service !== null &&
              fd.service !== ""
                ? fd.service
                : svc
                ? svc.service || svc.serviceName || ""
                : fd.service,
            serviceType:
              fd.serviceType && fd.serviceType.length
                ? fd.serviceType
                : svc
                ? svc.serviceType || svc.type || []
                : fd.serviceType,
            serviceCategory:
              fd.serviceCategory !== undefined && fd.serviceCategory !== null
                ? fd.serviceCategory
                : svc
                ? svc.serviceCategory || svc.serviceCategoryId || null
                : fd.serviceCategory,
          };
        }
      );
    }
  } catch (err) {}

  try {
    // Apply changes to the fetched document and save
    oldBooking.set(req.body);
    await oldBooking.save();
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to save booking updates" });
  }

  const booking = oldBooking;

  await booking.populate([
    { path: "client", select: "name phone email" },
    {
      path: "branch",
      select:
        "name code companyName companyPhone companyEmail companyWebsite companyDescription gstNumber",
    },
    { path: "assignedStaff", select: "name designation employeeId" },
    { path: "inventorySelection", select: "name category quantity" },
  ]);

  let shouldUpdateStats = false;
  if (req.body.status === "completed" && oldStatus !== "completed") {
    shouldUpdateStats = true;
  }

  if (
    req.body.paymentStatus === "completed" &&
    oldPaymentStatus !== "completed"
  ) {
    shouldUpdateStats = true;
  }

  if (
    req.body.pricing &&
    typeof req.body.pricing.totalAmount === "number" &&
    req.body.pricing.totalAmount !== oldTotalAmount
  ) {
    shouldUpdateStats = true;
  }

  if (shouldUpdateStats) {
    try {
      await updateBranchStats(booking.branch);
      const BranchModel = require("../models/Branch");
      const updatedBranch = await BranchModel.findById(booking.branch);
      booking._updatedBranch = updatedBranch;
    } catch (err) {
      console.error("Error updating branch stats after booking update:", err);
    }
  }
  try {
    if (req.body.status === "cancelled" && oldStatus !== "cancelled") {
      if (
        Array.isArray(booking.equipmentAssignment) &&
        booking.equipmentAssignment.length
      ) {
        for (const assign of booking.equipmentAssignment) {
          try {
            const inv = await Inventory.findById(assign.equipment);
            if (!inv) continue;
            const qty = Number(assign.quantity) || 1;
            inv.quantity = Number(inv.quantity || 0) + qty;
            if (inv.quantity > 0) inv.status = "Active";
            await inv.save();
          } catch (err) {
            console.warn(
              "Failed to restore inventory for assignment during booking cancellation",
              err
            );
          }
        }
      }
    }
  } catch (err) {
    console.warn(
      "Failed processing equipmentAssignment on booking update (cancellation)",
      err
    );
  }
  res.status(200).json({ success: true, data: booking });
});

const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking || booking.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }
  // allow an optional hard delete: DELETE /api/bookings/:id?hard=true
  const hardDelete =
    req.query && (req.query.hard === "true" || req.query.hard === "1");

  // Before marking deleted (or permanently removing), restore any inventory quantities that were allocated to this booking
  try {
    if (
      Array.isArray(booking.equipmentAssignment) &&
      booking.equipmentAssignment.length
    ) {
      for (const assign of booking.equipmentAssignment) {
        try {
          const inv = await Inventory.findById(assign.equipment);
          if (!inv) continue;
          const qty = Number(assign.quantity) || 1;
          inv.quantity = Number(inv.quantity || 0) + qty;
          // If after restoration we have some stock, mark as Active
          if (inv.quantity > 0) inv.status = "Active";
          await inv.save();
        } catch (err) {
          console.warn(
            "Failed to restore inventory for assignment during booking delete",
            err
          );
        }
      }
    }
  } catch (err) {
    console.warn(
      "Failed processing equipmentAssignment on booking delete",
      err
    );
  }

  if (hardDelete) {
    // Permanent removal from DB
    try {
      await Booking.findByIdAndDelete(booking._id);
      return res
        .status(200)
        .json({ success: true, message: "Booking permanently deleted" });
    } catch (err) {
      console.error("Failed to permanently delete booking:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to permanently delete booking",
      });
    }
  }

  // Soft-delete (default behaviour)
  booking.isDeleted = true;
  await booking.save();
  res.status(200).json({ success: true, data: {} });
});

const assignStaff = asyncHandler(async (req, res) => {
  const { staffId, role } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking)
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  booking.staffAssignment.push({ staff: staffId, role });
  await booking.save();
  res.status(200).json({ success: true, data: booking });
});

const assignInventory = asyncHandler(async (req, res) => {
  const { equipmentId, quantity } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking)
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  // push assignment to booking
  booking.equipmentAssignment.push({ equipment: equipmentId, quantity });
  await booking.save();

  // decrement inventory stock for the assigned equipment
  try {
    const inv = await Inventory.findById(equipmentId);
    if (inv) {
      const assignQty = Number(quantity) || 1;
      inv.quantity = Math.max(0, Number(inv.quantity || 0) - assignQty);
      if (inv.quantity === 0) inv.status = "Out of Stock";
      else inv.status = "Booked";
      await inv.save();
    }
  } catch (err) {
    console.warn("Failed to adjust inventory during assignInventory", err);
  }

  res.status(200).json({ success: true, data: booking });
});

const getBookingsForStaff = asyncHandler(async (req, res) => {
  const Staff = require("../models/Staff");
  const staff = await Staff.findOne({ user: req.params.staffId });

  let bookings = [];

  if (staff) {
    bookings = await Booking.find({
      $or: [
        { assignedStaff: staff._id },
        { "staffAssignment.staff": staff._id },
      ],
      isDeleted: false,
    })
      .populate("client", "name phone email")
      .populate(
        "branch",
        "name code companyName companyPhone companyEmail companyWebsite companyDescription gstNumber"
      )
        // populate per-service nested refs
        .populate("functionDetailsList.assignedStaff", "name designation employeeId")
        .populate("functionDetailsList.inventorySelection", "name category quantity")
      .populate("staffAssignment.staff", "user designation department")
      .populate("equipmentAssignment.equipment", "name sku category")
      .populate("invoice")
      .sort({ "functionDetails.date": -1 });
  } else {
  }
  res
    .status(200)
    .json({ success: true, count: bookings.length, data: bookings });
});

// Get bookings for the currently authenticated staff user
const getMyBookings = asyncHandler(async (req, res) => {
  // only staff role should use this endpoint, but allow admins/chairman to call as well if needed
  const userId = req.user._id;
  const Staff = require("../models/Staff");
  const staff = await Staff.findOne({ user: userId });
  if (!staff)
    return res.status(404).json({
      success: false,
      message: "Staff record not found for current user",
    });

  // Reuse the same query logic as getBookingsForStaff
  const bookings = await Booking.find({
    $or: [{ assignedStaff: staff._id }, { "staffAssignment.staff": staff._id }],
    isDeleted: false,
  })
    .populate("client", "name phone email")
    .populate(
      "branch",
      "name code companyName companyPhone companyEmail companyWebsite companyDescription gstNumber"
    )
    .populate("functionDetailsList.assignedStaff", "name designation employeeId")
    .populate("functionDetailsList.inventorySelection", "name category quantity")
    .populate("staffAssignment.staff", "user designation department")
    .populate("equipmentAssignment.equipment", "name sku category")

    .populate("invoice")
    .sort({ "functionDetails.date": -1 });

  res
    .status(200)
    .json({ success: true, count: bookings.length, data: bookings });
});

const getBookingsForInventory = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({
    "equipmentAssignment.equipment": req.params.equipmentId,
    isDeleted: false,
  })
    .populate("client", "name phone email")
    .populate(
      "branch",
      "name code companyName companyPhone companyEmail companyWebsite companyDescription gstNumber"
    )
    .populate("functionDetailsList.assignedStaff", "name designation employeeId");
  res
    .status(200)
    .json({ success: true, count: bookings.length, data: bookings });
});

// Get booking output specifications only
const getBookingOutputs = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .select("videoOutput photoOutput rawOutput notes client branch")
    .populate("client", "name phone email")
    .populate("branch", "name code");

  if (!booking || booking.isDeleted) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  res.status(200).json({
    success: true,
    data: {
      id: booking._id,
      client: booking.client,
      branch: booking.branch,
      videoOutput: booking.videoOutput || "",
      photoOutput: booking.photoOutput || "",
      rawOutput: booking.rawOutput || "",
      notes: booking.notes || "",
    },
  });
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
  getBookingsForInventory,
  getBookingOutputs,
};
