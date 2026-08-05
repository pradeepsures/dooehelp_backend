const catchAsync = require('../../../core/catchAsync');
const authService = require('./auth.service');
const { sendSuccess } = require('../../../core/response');

exports.sendOtp = catchAsync(async (req, res) => {
  const { phoneNumber } = req.body;
  const result = await authService.sendOtp(phoneNumber);
  sendSuccess(res, result, 'OTP sent successfully to vendor');
});

exports.verifyOtp = catchAsync(async (req, res) => {
  const { phoneNumber, otp } = req.body;
  const result = await authService.verifyOtp(phoneNumber, otp);
  sendSuccess(res, result, 'Vendor login successful');
});

exports.refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  sendSuccess(res, result, 'Token refreshed successfully');
});
