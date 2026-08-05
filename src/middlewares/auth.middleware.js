const jwt = require('jsonwebtoken');
const AppError = require('../core/AppError');
const catchAsync = require('../core/catchAsync');
const User = require('../models/User.model');
const Admin = require('../models/Admin.model');
const Vendor = require('../models/Vendor.model');

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401, 'UNAUTHORIZED'));
  }

  const secret = process.env.JWT_SECRET || 'supersecret_doorhelp_key';
  const decoded = jwt.verify(token, secret);

  let currentUser;
  if (decoded.role === 'user') {
    currentUser = await User.findById(decoded._id);
  } else if (decoded.role === 'admin' || decoded.role === 'superadmin') {
    currentUser = await Admin.findById(decoded._id);
  } else if (decoded.role === 'vendor') {
    currentUser = await Vendor.findById(decoded._id);
  }

  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401, 'UNAUTHORIZED'));
  }

  // Check if token is in db tokens array (if the model supports it)
  if (currentUser.tokens && Array.isArray(currentUser.tokens)) {
    const hasToken = currentUser.tokens.some(t => t.token === token);
    if (!hasToken) {
      return next(new AppError('Token invalid or expired', 401, 'UNAUTHORIZED'));
    }
  }

  req.user = currentUser;
  next();
});

// Middleware to restrict access to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
    }
    next();
  };
};
