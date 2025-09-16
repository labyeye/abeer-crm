const { verifyToken } = require('../config/jwt');
const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    // Double check the user from database to ensure fresh data
    const freshUser = await User.findById(req.user._id);
    if (!freshUser) {
      return next(new ErrorResponse('User not found', 401));
    }
    
    // Normalize roles by trimming and converting to lowercase
    const userRole = (freshUser.role || '').trim().toLowerCase();
    const normalizedRoles = roles.map(role => role.trim().toLowerCase());
    
    if (!normalizedRoles.includes(userRole)) {
      return next(
        new ErrorResponse(
          `User role ${freshUser.role} is not authorized to access this route`,
          403
        )
      );
    }
    
    next();
  };
};