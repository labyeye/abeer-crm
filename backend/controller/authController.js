const User = require('../models/User');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const asyncHandler = require('../utils/asyncHandler');




exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role } = req.body;

  
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'staff' 
  });

  
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




exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt for email:', email);

  
  // Try to find in User collection first
  let user = await User.findOne({ email }).select('+password');
  if (user) {
    console.log('✅ User found:', user.name, 'Role:', user.role);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', user.name);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id, user.role);
    console.log('🎫 Token generated for user:', user.name, 'Role:', user.role);

    return res.status(200).json({
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
  }

  // Fallback: try Client login (clients have their own password field)
  const client = await Client.findOne({ email }).select('+password');
  if (!client) {
    console.log('❌ No user or client found for email:', email);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const matchClient = await bcrypt.compare(password, client.password);
  if (!matchClient) {
    console.log('❌ Password mismatch for client:', client.name);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // generate a token for client users with role 'client'
  const clientToken = generateToken(client._id, 'client');
  client.lastLogin = Date.now();
  await client.save();

  return res.status(200).json({
    success: true,
    token: clientToken,
    user: {
      id: client._id,
      name: client.name,
      email: client.email,
      role: 'client',
      phone: client.phone,
      branchId: client.branch
    }
  });
});




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