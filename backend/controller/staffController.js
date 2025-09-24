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
  
  const updatedStaff = await Staff.findByIdAndUpdate(
    req.params.id,
    req.body,
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

module.exports = {
  getAllStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffAttendance,
  getStaffPerformance,
  updateStaffPerformance,
  getStaffSalary
}; 