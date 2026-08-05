const catchAsync = require('../../core/catchAsync');
const adminService = require('./admin.service');
const { sendSuccess } = require('../../core/response');

exports.register = catchAsync(async (req, res) => {
  const result = await adminService.register(req.body);
  sendSuccess(res, result, 'Admin created successfully', 201);
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await adminService.login(email, password);
  sendSuccess(res, result, 'Admin logged in successfully');
});

exports.refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await adminService.refreshToken(refreshToken);
  sendSuccess(res, result, 'Token refreshed successfully');
});

exports.updateProfile = catchAsync(async (req, res) => {
  const result = await adminService.updateProfile(req.user._id, req.body, req.file);
  sendSuccess(res, result, 'Admin profile updated successfully');
});
