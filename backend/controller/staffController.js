const Staff = require('../models/Staff');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Attendance = require('../models/Attendance');
const Salary = require('../models/Salary');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const { updateBranchEmployeeCount } = require('../utils/branchUtils');




const getAllStaff = asyncHandler(async (req, res) => {
  const { branch, status, department, search } = req.query;
  
  let query = {};
  
  
  if (req.user.role === 'admin') {
    
    const userBranch = await Branch.findOne({ admin: req.user.id });
    if (userBranch) {
      query.branch = userBranch._id;
      console.log('Branch admin filtering staff for branch:', userBranch._id);
    }
  } else if (req.user.role === 'manager') {
    
    query.branch = req.user.branch;
    console.log('Manager filtering staff for branch:', req.user.branch);
  }
  
  
  
  if (branch && req.user.role === 'chairman') {
    query.branch = branch; 
  }
  if (status) query.status = status;
  if (department) query.department = department;
  
  if (search) {
    query.$or = [
      { employeeId: { $regex: search, $options: 'i' } },
      { designation: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
  }
  
  const staff = await Staff.find(query)
    .populate('user', 'name email phone')
    .populate('branch', 'name code companyName')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: staff.length,
    data: staff
  });
});




const getStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('branch', 'name code companyName');
  
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: staff
  });
});




const createStaff = asyncHandler(async (req, res, next) => {
  const {
    employeeId,
    staffType,
    designation,
    department,
    joiningDate,
    salary,
    bankDetails,
    contactInfo,
    documents,
    maritalStatus,
    children,
    grandfatherName,
    education,
    branch,
    name,
    email,
    phone,
    password,
    address,
    fatherName,
    motherName,
    aadharNumbers,
    contacts,
    referredBy
  } = req.body;
  // accept structured experience array if provided
  let experience = req.body.experience;
  if (experience && Array.isArray(experience)) {
    experience = experience.map(exp => ({
      company: exp.company || exp.companyName || exp.company_name || '',
      role: exp.role || exp.position || '',
      location: exp.location || '',
      startDate: exp.startDate ? new Date(exp.startDate) : (exp.start ? new Date(exp.start) : undefined),
      endDate: exp.endDate ? new Date(exp.endDate) : (exp.end ? new Date(exp.end) : undefined),
      description: exp.description || ''
    }));
  } else {
    experience = [];
  }
  // normalize education array if provided (support subject-wise marks or legacy marks field)
  let normalizedEducation = [];
  if (education && Array.isArray(education)) {
    normalizedEducation = education.map(ed => {
      const subjectsRaw = ed.subjects;
      let subjects = [];
      if (Array.isArray(subjectsRaw)) {
        subjects = subjectsRaw.map(s => ({
          name: s.name || s.subject || s.subjectName || '',
          marks: s.marks !== undefined ? Number(s.marks) : (s.score !== undefined ? Number(s.score) : undefined)
        })).filter(s => s.name);
      } else if (ed.marks !== undefined) {
        // legacy single marks field -> convert to a single subject entry
        subjects = [{ name: ed.subjectName || 'Overall', marks: Number(ed.marks) }];
      }

      // Determine institution and type (type is required by schema)
      const institution = ed.institution || ed.school || ed.college || ed.institutionName || '';
      // Infer type from ed.type or degree keywords, default to 'college'
      let t = (ed.type || '').toString().toLowerCase();
      if (!['school', 'college', 'university'].includes(t)) {
        const degreeGuess = (ed.degree || ed.class || '').toString().toLowerCase();
        if (/school|class|ssc|hs|10th|12th/i.test(degreeGuess)) t = 'school';
        else if (/college|bachelor|bs|ba|bsc|btech|ba|diploma/i.test(degreeGuess)) t = 'college';
        else if (/master|ms|ma|mtech|phd|university/i.test(degreeGuess)) t = 'university';
        else t = 'college';
      }

      return {
        degree: ed.degree || ed.class || ed.qualification || '',
        institution: institution || (ed.degree ? String(ed.degree).substring(0, 100) : 'Unknown Institution'),
        type: t,
        year: ed.year ? Number(ed.year) : (ed.passedYear ? Number(ed.passedYear) : undefined),
        subjects
      };
    });
  } else {
    normalizedEducation = [];
  }
  
  
  const existingEmployeeId = await Staff.findOne({ employeeId, isDeleted: false });
  if (existingEmployeeId) {
    return next(new ErrorResponse('Employee ID already exists', 400));
  }

  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User email already exists', 400));
  }

  
  const newUser = await User.create({
    name,
    email,
    phone,
    password,
    role: 'staff',
    company: req.user.company 
  });

  let branchId = branch;
  
  
  if (req.user.role === 'admin') {
    
    const userBranch = await Branch.findOne({ admin: req.user.id });
    if (userBranch) {
      branchId = userBranch._id;
      console.log('Branch admin auto-assigning staff to branch:', userBranch._id);
    } else {
      return next(new ErrorResponse('Branch not found for admin user', 400));
    }
  } else if (req.user.role === 'manager') {
    
    branchId = req.user.branch;
    console.log('Manager auto-assigning staff to branch:', req.user.branch);
  } else if (req.user.role === 'chairman') {
    
    if (!branchId) {
      return next(new ErrorResponse('Branch is required for chairman to create staff', 400));
    }
    
    if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
      const branchDoc = await Branch.findOne({ code: branchId });
      if (!branchDoc) {
        return next(new ErrorResponse('Branch code not found', 400));
      }
      branchId = branchDoc._id;
    }
  }

  const staffData = {
    user: newUser._id,
    branch: branchId,
    employeeId,
    staffType,
    designation,
    department,
    joiningDate,
    salary: salary.basic + (salary.allowances || 0),
    bankDetails,
    contactInfo,
    documents,
    maritalStatus,
    children,
    grandfatherName,
  education: normalizedEducation,
    name,
    phone,
    address,
    fatherName,
    motherName,
    aadharNumbers,
    contacts,
    referredBy
    ,
    experience
  };

  // allow avatarUrl (base64 or remote url) to be set from the frontend
  if (req.body.avatarUrl) {
    staffData.avatarUrl = req.body.avatarUrl;
  }

  const staff = await Staff.create(staffData);

  
  await updateBranchEmployeeCount(staff.branch);

  res.status(201).json({
    success: true,
    data: staff
  });
});




const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }

  
  if (req.user.role === 'admin') {
    
    const userBranch = await Branch.findOne({ admin: req.user.id });
    if (!userBranch || staff.branch.toString() !== userBranch._id.toString()) {
      return next(new ErrorResponse('Access denied. Can only update staff in your branch.', 403));
    }
    
    delete req.body.branch;
  } else if (req.user.role === 'manager') {
    
    if (staff.branch.toString() !== req.user.branch.toString()) {
      return next(new ErrorResponse('Access denied. Can only update staff in your branch.', 403));
    }
    
    delete req.body.branch;
  }
  
  
  
  if (req.body.salary) {
    // Accept either an object { basic, allowances } from the frontend or a direct numeric value.
    if (typeof req.body.salary === 'object') {
      const { basic = 0, allowances = 0 } = req.body.salary;
      // store numeric salary to match Staff schema (salary is a Number)
      req.body.salary = Number(basic) + Number(allowances || 0);
    } else {
      // try to coerce to number if a primitive was sent
      req.body.salary = Number(req.body.salary);
    }
  }
  // sanitize experience array if present
  if (req.body.experience && Array.isArray(req.body.experience)) {
    req.body.experience = req.body.experience.map(exp => ({
      company: exp.company || exp.companyName || exp.company_name || '',
      role: exp.role || exp.position || '',
      location: exp.location || '',
      startDate: exp.startDate ? new Date(exp.startDate) : (exp.start ? new Date(exp.start) : undefined),
      endDate: exp.endDate ? new Date(exp.endDate) : (exp.end ? new Date(exp.end) : undefined),
      description: exp.description || ''
    }));
  }
  // avatarUrl (base64 data or hosted URL) may be provided in req.body and will be persisted by the findByIdAndUpdate below
  // normalize education payload if present
  if (req.body.education && Array.isArray(req.body.education)) {
    req.body.education = req.body.education.map(ed => {
      const subjectsRaw = ed.subjects;
      let subjects = [];
      if (Array.isArray(subjectsRaw)) {
        subjects = subjectsRaw.map(s => ({
          name: s.name || s.subject || s.subjectName || '',
          marks: s.marks !== undefined ? Number(s.marks) : (s.score !== undefined ? Number(s.score) : undefined)
        })).filter(s => s.name);
      } else if (ed.marks !== undefined) {
        subjects = [{ name: ed.subjectName || 'Overall', marks: Number(ed.marks) }];
      }

      const institution = ed.institution || ed.school || ed.college || ed.institutionName || '';
      let t = (ed.type || '').toString().toLowerCase();
      if (!['school', 'college', 'university'].includes(t)) {
        const degreeGuess = (ed.degree || ed.class || '').toString().toLowerCase();
        if (/school|class|ssc|hs|10th|12th/i.test(degreeGuess)) t = 'school';
        else if (/college|bachelor|bs|ba|bsc|btech|ba|diploma/i.test(degreeGuess)) t = 'college';
        else if (/master|ms|ma|mtech|phd|university/i.test(degreeGuess)) t = 'university';
        else t = 'college';
      }

      return {
        degree: ed.degree || ed.class || ed.qualification || '',
        institution: institution || (ed.degree ? String(ed.degree).substring(0, 100) : 'Unknown Institution'),
        type: t,
        year: ed.year ? Number(ed.year) : (ed.passedYear ? Number(ed.passedYear) : undefined),
        subjects
      };
    });
  }
  
  // Remove empty string fields to avoid casting failures
  const safePayload = {};
  Object.keys(req.body || {}).forEach(k => {
    const v = req.body[k];
    if (v === '' || v === undefined) return;
    safePayload[k] = v;
  });

  const updatedStaff = await Staff.findByIdAndUpdate(
    req.params.id,
    safePayload,
    { new: true, runValidators: true }
  );
  
  
  if (req.body.branch && req.body.branch !== staff.branch.toString()) {
    await Promise.all([
      updateBranchEmployeeCount(staff.branch), 
      updateBranchEmployeeCount(req.body.branch) 
    ]);
  } else {
    
    await updateBranchEmployeeCount(updatedStaff.branch);
  }
  
  res.status(200).json({
    success: true,
    data: updatedStaff
  });
});




const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }
  
  staff.isDeleted = true;
  await staff.save();
  
  
  await updateBranchEmployeeCount(staff.branch);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});




const getStaffAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = { staff: req.params.id, isDeleted: false };
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const attendance = await Attendance.find(query)
    .sort({ date: -1 });
  
  res.status(200).json({
    success: true,
    count: attendance.length,
    data: attendance
  });
});




const getStaffPerformance = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  
  const staff = await Staff.findById(req.params.id);
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }
  
  let attendanceQuery = { staff: req.params.id, isDeleted: false };
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    attendanceQuery.date = { $gte: startDate, $lte: endDate };
  }
  
  const attendance = await Attendance.find(attendanceQuery);
  
  const performance = {
    totalDays: attendance.length,
    presentDays: attendance.filter(a => a.status === 'present').length,
    absentDays: attendance.filter(a => a.status === 'absent').length,
    lateDays: attendance.filter(a => a.status === 'late').length,
    halfDays: attendance.filter(a => a.status === 'half_day').length,
    totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
    totalOvertime: attendance.reduce((sum, a) => sum + (a.overtime || 0), 0),
    currentScore: staff.performance.score
  };
  
  res.status(200).json({
    success: true,
    data: performance
  });
});




const updateStaffPerformance = asyncHandler(async (req, res) => {
  const { score, reason } = req.body;
  
  const staff = await Staff.findById(req.params.id);
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }
  
  staff.performance.score = score;
  if (reason) {
    staff.performance.notes = reason;
  }
  
  await staff.save();
  
  res.status(200).json({
    success: true,
    data: staff.performance
  });
});




const getStaffSalary = asyncHandler(async (req, res) => {
  const { year } = req.query;
  
  let query = { staff: req.params.id, isDeleted: false };
  if (year) {
    query.year = parseInt(year);
  }
  
  const salary = await Salary.find(query)
    .sort({ year: -1, month: -1 });
  
  res.status(200).json({
    success: true,
    count: salary.length,
    data: salary
  });
});


// Create a salary/payment record for a staff member (mark salary as paid or record advance)
const createStaffSalary = asyncHandler(async (req, res) => {
  const staffId = req.params.id;
  const staff = await Staff.findById(staffId);
  if (!staff || staff.isDeleted) {
    return next(new ErrorResponse('Staff not found', 404));
  }

  // Accept either a full salary object or a minimal payment/advance record
  const payload = req.body || {};

  // Require month and year for salary records (for monthly salaries)
  if (!payload.month || !payload.year) {
    return res.status(400).json({ success: false, message: 'Month and year are required' });
  }

  // Prevent creating duplicate salary records for the same staff/month/year
  const existingSalary = await Salary.findOne({ staff: staffId, month: Number(payload.month), year: Number(payload.year), isDeleted: false });
  if (existingSalary) {
    if (existingSalary.paymentStatus === 'paid') {
      // Signal to frontend so it can offer advance-for-next-month flow
      return res.status(409).json({ success: false, code: 'ALREADY_PAID', message: 'Salary already paid for this month' });
    }
    // Update the existing salary record with incoming payload (marking paid or updating amounts)
    try {
      // merge amounts
      existingSalary.basicSalary = Number(payload.basicSalary ?? existingSalary.basicSalary ?? staff.salary ?? 0);
      existingSalary.allowances = Number(payload.allowances ?? existingSalary.allowances ?? 0);
      const incomingDeductions = payload.deductions || {};
      existingSalary.deductions = {
        loan: Number(incomingDeductions.loan ?? existingSalary.deductions?.loan ?? 0),
        emi: Number(incomingDeductions.emi ?? existingSalary.deductions?.emi ?? 0),
        advance: Number(incomingDeductions.advance ?? existingSalary.deductions?.advance ?? 0),
        other: Number(incomingDeductions.other ?? existingSalary.deductions?.other ?? 0),
        total: 0
      };
      existingSalary.deductions.total = Number(existingSalary.deductions.loan || 0) + Number(existingSalary.deductions.emi || 0) + Number(existingSalary.deductions.advance || 0) + Number(existingSalary.deductions.other || 0);
      existingSalary.performance = payload.performance || existingSalary.performance || {};
      existingSalary.netSalary = Number(existingSalary.basicSalary || 0) + Number(existingSalary.allowances || 0) - Number(existingSalary.deductions.total || 0) + Number(existingSalary.performance?.bonus || 0) - Number(existingSalary.performance?.penalty || 0);
      existingSalary.paymentStatus = payload.paymentStatus || existingSalary.paymentStatus || 'pending';
      existingSalary.paymentDate = payload.paymentDate ? new Date(payload.paymentDate) : (existingSalary.paymentDate || (existingSalary.paymentStatus === 'paid' ? new Date() : undefined));
      existingSalary.advanceSchedule = payload.advanceSchedule || existingSalary.advanceSchedule || { total: 0, months: 0, monthly: 0 };
      existingSalary.paymentMethod = payload.paymentMethod || existingSalary.paymentMethod || 'bank_transfer';
      existingSalary.paymentReference = payload.paymentReference || existingSalary.paymentReference || '';
      existingSalary.notes = payload.notes || existingSalary.notes || '';
      await existingSalary.save();
      return res.status(200).json({ success: true, data: existingSalary });
    } catch (err) {
      console.error('Failed to update existing salary:', err);
      return res.status(500).json({ success: false, message: 'Failed to update existing salary', details: err.message });
    }
  }

  // Basic fields
  const basicSalary = Number((payload.basicSalary ?? payload.basic) ?? staff.salary ?? 0);
  const allowances = Number(payload.allowances ?? 0);
  const deductions = payload.deductions || { advance: 0, loan: 0, emi: 0, other: 0 };

  const totalDeductions = Number(deductions.advance || 0) + Number(deductions.loan || 0) + Number(deductions.emi || 0) + Number(deductions.other || 0);

  const netSalary = basicSalary + Number(allowances || 0) - totalDeductions + Number(payload.performance?.bonus || 0) - Number(payload.performance?.penalty || 0);

  const companyId = req.user.company || req.user.companyId || undefined;
  const periodStr = `${new Date(Number(payload.year), Number(payload.month) - 1).toLocaleString('default', { month: 'long' })} ${payload.year}`;

  // If paymentStatus is paid and no paymentDate provided, set it to now
  const paymentDateValue = payload.paymentDate ? new Date(payload.paymentDate) : (payload.paymentStatus === 'paid' ? new Date() : undefined);

  let salaryDoc;
  try {
    salaryDoc = await Salary.create({
      company: companyId,
      branch: staff.branch,
      staff: staffId,
      month: Number(payload.month),
      year: Number(payload.year),
      basicSalary,
      allowances,
      overtime: payload.overtime || { hours: 0, rate: 0, amount: 0 },
      deductions: {
        loan: Number(deductions.loan || 0),
        emi: Number(deductions.emi || 0),
        advance: Number(deductions.advance || 0),
        other: Number(deductions.other || 0),
        total: totalDeductions,
      },
      attendance: payload.attendance || {},
      performance: payload.performance || {},
      netSalary: Number(netSalary),
      paymentStatus: payload.paymentStatus || 'pending',
      paymentDate: paymentDateValue,
      period: periodStr,
      advanceSchedule: payload.advanceSchedule || { total: 0, months: 0, monthly: 0 },
      paymentMethod: payload.paymentMethod || 'bank_transfer',
      paymentReference: payload.paymentReference || '',
      notes: payload.notes || ''
    });
  } catch (err) {
    console.error('Salary.create failed:', err);
    if (err.name === 'ValidationError') {
      const details = Object.keys(err.errors || {}).reduce((acc, k) => {
        acc[k] = err.errors[k].message;
        return acc;
      }, {});
      return res.status(400).json({ success: false, message: 'Salary validation failed', details });
    }
    return res.status(500).json({ success: false, message: err.message || 'Failed to create salary' });
  }

  res.status(201).json({ success: true, data: salaryDoc });
});

// Mark specific bookings as paid for a per_task staff member.
// Payload: { bookings: [bookingId], month, year, paymentMethod, paymentDate }
const markBookingsPaid = asyncHandler(async (req, res) => {
  const staffId = req.params.id;
  const { bookings, month, year, paymentMethod, paymentDate } = req.body;
  if (!Array.isArray(bookings) || bookings.length === 0) return res.status(400).json({ success: false, message: 'bookings array required' });
  const Staff = require('../models/Staff');
  const Booking = require('../models/Booking');
  const Advance = require('../models/Advance');
  const staff = await Staff.findById(staffId);
  if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

  // compute total amount from bookings by counting assigned tasks for this staff
  let totalAmount = 0;
  const processedBookings = [];
  for (const bId of bookings) {
    // allow passing booking _id or bookingNumber
    let b = null;
    if (mongoose.Types.ObjectId.isValid(bId)) {
      b = await Booking.findById(bId);
    }
    if (!b) {
      // try bookingNumber lookup
      b = await Booking.findOne({ bookingNumber: bId });
    }
    if (!b) continue;
    let count = 0;
    if (Array.isArray(b.functionDetailsList)) {
      b.functionDetailsList.forEach(fd => {
        if (Array.isArray(fd.assignedStaff)) {
          fd.assignedStaff.forEach(as => {
            const id = as && (as._id || (as && as.toString && as.toString()));
            if (id && id.toString() === staffId.toString()) count += 1;
          });
        }
      });
    }
    // fallback top-level assignment
    if (count === 0 && Array.isArray(b.staffAssignment)) {
      b.staffAssignment.forEach(sa => { if (sa.staff && sa.staff.toString() === staffId.toString()) count += 1; });
    }
    const rate = Number((staff.salary && typeof staff.salary === 'number') ? staff.salary : (staff.rate || 0));
    const amt = count * rate;
    if (amt > 0) {
      totalAmount += amt;
      processedBookings.push({ bookingId: b._id, bookingNumber: b.bookingNumber, count, amount: amt });
    }
  }

  // Now apply advances: fetch advances ordered oldest first, reduce remaining and mark repaymentStatus
  let remainingToPay = totalAmount;
  const advs = await Advance.find({ staff: staffId, isDeleted: false }).sort({ createdAt: 1 });
  const advanceUpdates = [];
  for (const a of advs) {
    if (remainingToPay <= 0) break;
    if (a.remaining <= 0) continue;
    const take = Math.min(a.remaining, remainingToPay);
    a.remaining = Number(a.remaining) - Number(take);
    remainingToPay -= take;
    if (a.remaining <= 0) a.repaymentStatus = 'paid';
    else a.repaymentStatus = 'partial';
    advanceUpdates.push({ id: a._id, remaining: a.remaining, repaymentStatus: a.repaymentStatus, taken: take });
    await a.save();
  }

  // Create a salary record representing this per-task payment (month/year required)
  const Salary = require('../models/Salary');
  // compute advanceConsumed and create salary doc where basicSalary equals totalAmount
  const advanceConsumed = advanceUpdates.reduce((s, u) => s + Number(u.taken || 0), 0);
  const deductions = { advance: advanceConsumed, loan: 0, emi: 0, other: 0, total: advanceConsumed };

  // Amount actually paid to staff now = totalAmount - advanceConsumed (advances reduce immediate cash outflow)
  const amountPaidNow = Math.max(0, totalAmount - advanceConsumed);

  const sal = await Salary.create({
    company: req.user.company || req.user.companyId,
    branch: staff.branch,
    staff: staffId,
    month: Number(month) || (new Date().getMonth() + 1),
    year: Number(year) || new Date().getFullYear(),
    basicSalary: totalAmount,
    allowances: 0,
    deductions,
    netSalary: Number(totalAmount) - Number(deductions.total || 0),
    paymentStatus: remainingToPay > 0 ? 'partial' : 'paid',
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    paymentMethod: paymentMethod || 'cash',
    period: `${new Date(Number(year||new Date().getFullYear()), Number(month||new Date().getMonth()+1)-1).toLocaleString('default', { month: 'long' })} ${year||new Date().getFullYear()}`,
    notes: `Per-task payment for bookings: ${processedBookings.map(p=>p.bookingNumber||p.bookingId).join(', ')}`
  });

  // For each processed booking, record payment entry on the Booking.document with amount paid proportionally to booking amount
  for (const pb of processedBookings) {
    const bdoc = await Booking.findById(pb.bookingId || pb.bookingNumber);
    if (!bdoc) continue;
    // calculate paid portion for this booking: if advanceConsumed covered only part of total, we record the cash paid now
    // Distribute the advanceConsumed proportionally across bookings by their amount
    const advanceShare = advanceConsumed > 0 ? (Number(pb.amount) / Number(totalAmount || 1)) * advanceConsumed : 0;
    const paidNowForBooking = Number(pb.amount) - advanceShare;
    bdoc.staffPayments = bdoc.staffPayments || [];
    bdoc.staffPayments.push({ staff: staffId, amount: paidNowForBooking, date: new Date(), note: `Per-task payment (salaryId:${sal._id})` });
    // If advance fully covered this booking (paidNowForBooking <= 0) then amount recorded is 0 and booking remains as 'paid' in terms of advance logic
    await bdoc.save();
  }

  // Return details of what was paid and advance adjustments
  res.status(200).json({ success: true, data: { totalAmount, processedBookings, advanceUpdates, salary: sal } });
});

// Return unpaid bookings for a staff member (bookings where staff hasn't been fully paid for assigned tasks)
const getUnpaidBookingsForStaff = asyncHandler(async (req, res) => {
  const staffId = req.params.id;
  const Booking = require('../models/Booking');
  const staff = await Staff.findById(staffId);
  if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

  // Find bookings that include this staff in functionDetailsList assignedStaff or staffAssignment
  const bookings = await Booking.find({ isDeleted: false }).sort({ 'functionDetailsList.date': -1 });

  const unpaid = [];
  for (const b of bookings) {
    // compute expected count for this staff in booking
    let count = 0;
    if (Array.isArray(b.functionDetailsList)) {
      b.functionDetailsList.forEach(fd => {
        if (Array.isArray(fd.assignedStaff)) {
          fd.assignedStaff.forEach(as => {
            const id = as && (as._id || (as && as.toString && as.toString()));
            if (id && id.toString() === staffId.toString()) count += 1;
          });
        }
      });
    }
    if (count === 0 && Array.isArray(b.staffAssignment)) {
      b.staffAssignment.forEach(sa => { if (sa.staff && sa.staff.toString() === staffId.toString()) count += 1; });
    }
    if (count === 0) continue;

    // expected amount for this booking for staff
    const rate = Number((staff.salary && typeof staff.salary === 'number') ? staff.salary : (staff.rate || 0));
    const expected = count * rate;

    // compute already paid amount in booking.staffPayments for this staff
    const alreadyPaid = (Array.isArray(b.staffPayments) ? b.staffPayments.filter(sp => sp.staff && sp.staff.toString() === staffId.toString()).reduce((s, p) => s + Number(p.amount || 0), 0) : 0);

    if (alreadyPaid < expected) {
      unpaid.push({ bookingId: b._id, bookingNumber: b.bookingNumber, date: b.functionDetailsList?.[0]?.date || b.createdAt, expected, alreadyPaid, remaining: expected - alreadyPaid });
    }
  }

  res.status(200).json({ success: true, count: unpaid.length, data: unpaid });
});

// Return a quick payment summary for a staff member used for the 4 cards
const getStaffPaymentSummary = asyncHandler(async (req, res) => {
  const staffId = req.params.id;
  const Advance = require('../models/Advance');
  const Booking = require('../models/Booking');
  const Salary = require('../models/Salary');

  const staff = await Staff.findById(staffId);
  if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

  // Total assigned amount across unpaid bookings (compute here to avoid calling controller which writes to res)
  const bookings = await Booking.find({ isDeleted: false }).sort({ 'functionDetailsList.date': -1 });
  const unpaidList = [];
  for (const b of bookings) {
    let count = 0;
    if (Array.isArray(b.functionDetailsList)) {
      b.functionDetailsList.forEach(fd => {
        if (Array.isArray(fd.assignedStaff)) {
          fd.assignedStaff.forEach(as => {
            const id = as && (as._id || (as && as.toString && as.toString()));
            if (id && id.toString() === staffId.toString()) count += 1;
          });
        }
      });
    }
    if (count === 0 && Array.isArray(b.staffAssignment)) {
      b.staffAssignment.forEach(sa => { if (sa.staff && sa.staff.toString() === staffId.toString()) count += 1; });
    }
    if (count === 0) continue;
    const rate = Number((staff.salary && typeof staff.salary === 'number') ? staff.salary : (staff.rate || 0));
    const expected = count * rate;
    const alreadyPaid = (Array.isArray(b.staffPayments) ? b.staffPayments.filter(sp => sp.staff && sp.staff.toString() === staffId.toString()).reduce((s, p) => s + Number(p.amount || 0), 0) : 0);
    if (alreadyPaid < expected) {
      unpaidList.push({ bookingId: b._id, bookingNumber: b.bookingNumber, date: b.functionDetailsList?.[0]?.date || b.createdAt, expected, alreadyPaid, remaining: expected - alreadyPaid });
    }
  }

  const totalAssigned = unpaidList.reduce((s, b) => s + Number(b.expected || 0), 0);

  // total given: sum of Salary records already paid for per-task (we'll consider Salary.basicSalary with notes containing 'Per-task')
  const salaries = await Salary.find({ staff: staffId, isDeleted: false });
  const totalGiven = salaries.reduce((s, sal) => s + Number(sal.netSalary || 0), 0);

  // total advance taken and remaining
  const advs = await Advance.find({ staff: staffId, isDeleted: false });
  const totalAdvanceTaken = advs.reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalAdvanceRemaining = advs.reduce((s, a) => s + Number(a.remaining || 0), 0);

  const toPayNow = Math.max(0, totalAssigned - totalAdvanceRemaining);

  res.status(200).json({ success: true, data: { totalAssigned, totalGiven, totalAdvanceTaken, totalAdvanceRemaining, toPayNow } });
});

module.exports = {
  getAllStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffAttendance,
  getStaffPerformance,
  updateStaffPerformance,
  getStaffSalary,
  createStaffSalary
  ,
  markBookingsPaid
  ,
  getUnpaidBookingsForStaff,
  getStaffPaymentSummary
}; 