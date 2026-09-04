const catchAsync = require('../../../core/catchAsync');
const authService = require('./auth.service');
const { sendSuccess } = require('../../../core/response');

exports.register = catchAsync(async (req, res) => {
  const { phoneNumber, name, email, lat, long, referredBy, address } = req.body;

  const userData = {
    phoneNumber,
    name,
    email,
    referredBy
  };

  if (address !== undefined) {
    userData.address = address;
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
  const { phoneNumber, otp, fcmToken, deviceId, referredBy } = req.body;
  const result = await authService.verifyOtp(phoneNumber, otp, { fcmToken, deviceId, referredBy });
  sendSuccess(res, result, 'Login successful');
});

exports.refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  sendSuccess(res, result, 'Token refreshed successfully');
});

exports.getProfile = catchAsync(async (req, res) => {
  const userId = req.user._id;
  let userDoc = await authService.getById(userId);
  if (!userDoc.referralCode) {
    const User = require('../../../models/User.model');
    const code = User.generateReferralCode
      ? User.generateReferralCode(userDoc.name)
      : 'USER' + Math.floor(1000 + Math.random() * 9000);
    await User.findByIdAndUpdate(userId, { referralCode: code });
    userDoc.referralCode = code;
  }

  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  
  const UserAddress = require('../../../models/UserAddress.model');
  const addresses = await UserAddress.find({ userId, isDeleted: false });
  user.addresses = addresses;

  sendSuccess(res, user, 'Profile fetched successfully');
});

exports.updateProfile = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { name, email, address } = req.body;
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (address !== undefined) updateData.address = address;
  if (req.body.fcmToken !== undefined) updateData.fcmToken = req.body.fcmToken;
  if (req.body.deviceId !== undefined) updateData.deviceId = req.body.deviceId;

  if (req.file) {
    updateData.profileImage = `/${req.file.destination}/${req.file.filename}`.replace(/\\/g, '/');
  }

  const updatedUser = await authService.update(userId, updateData);
  sendSuccess(res, updatedUser, 'Profile updated successfully');
});

exports.applyReferral = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const userReferAndEarnService = require('../refer-earn/refer-earn.service');
  const { referralCode, code } = req.body;
  const result = await userReferAndEarnService.applyReferralCode(userId, referralCode || code);
  sendSuccess(res, result, result.message);
});
