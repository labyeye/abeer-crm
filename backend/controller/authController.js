const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'staff' // Default role is staff
  });

  // Generate token
  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt for email:', email);

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.log('❌ User not found for email:', email);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  console.log('✅ User found:', user.name, 'Role:', user.role);

  // Check if password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    console.log('❌ Password mismatch for user:', user.name);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  console.log('✅ Password match successful');

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // Generate token
  const token = generateToken(user._id, user.role);

  console.log('🎫 Token generated for user:', user.name, 'Role:', user.role);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      branchId: user.branch
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      branchId: user.branch
    }
  });
});