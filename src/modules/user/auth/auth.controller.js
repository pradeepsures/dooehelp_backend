const catchAsync = require('../../../core/catchAsync');
const authService = require('./auth.service');
const { sendSuccess } = require('../../../core/response');

exports.register = catchAsync(async (req, res) => {
  const { phoneNumber, name, email, lat, long, referredBy } = req.body;

  const userData = {
    phoneNumber,
    name,
    email,
    referredBy
  };

  if (lat && long) {
    userData.location = { lat: Number(lat), long: Number(long) };
  }

  if (req.file) {
    userData.profileImage = `/${req.file.destination}/${req.file.filename}`.replace(/\\/g, '/');
  }

  const result = await authService.register(userData);
  sendSuccess(res, result, 'Registration successful, OTP sent');
});

exports.sendOtp = catchAsync(async (req, res) => {
  const { phoneNumber } = req.body;
  const result = await authService.sendOtp(phoneNumber);
  sendSuccess(res, result, 'OTP sent successfully');
});

exports.verifyOtp = catchAsync(async (req, res) => {
  const { phoneNumber, otp } = req.body;
  const result = await authService.verifyOtp(phoneNumber, otp);
  sendSuccess(res, result, 'Login successful');
});

exports.refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  sendSuccess(res, result, 'Token refreshed successfully');
});

exports.getProfile = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const user = await authService.getById(userId);
  sendSuccess(res, user, 'Profile fetched successfully');
});

exports.updateProfile = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { name, email, lat, long } = req.body;
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (lat && long) updateData.location = { lat: Number(lat), long: Number(long) };

  if (req.file) {
    updateData.profileImage = `/${req.file.destination}/${req.file.filename}`.replace(/\\/g, '/');
  }

  const updatedUser = await authService.update(userId, updateData);
  sendSuccess(res, updatedUser, 'Profile updated successfully');
});
