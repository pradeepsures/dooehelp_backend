const catchAsync = require('../../core/catchAsync');
const AppError = require('../../core/AppError');
const { sendSuccess } = require('../../core/response');
const User = require('../../models/User.model');
const Vendor = require('../../models/Vendor.model');

const sendOtp = catchAsync(async (req, res) => {
  const { phoneNumber, role } = req.body; // phoneNumber parameter can be phone number or name

  if (!phoneNumber) {
    throw new AppError('Phone number or name is required', 400, 'BAD_REQUEST');
  }

  if (!role || !['user', 'vendor'].includes(role)) {
    throw new AppError('Invalid role. Must be user or vendor', 400, 'BAD_REQUEST');
  }

  // Find by phone number or name
  let account;
  const filter = {
    $or: [
      { phoneNumber: phoneNumber },
      { name: { $regex: new RegExp(`^${phoneNumber.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
    ],
    isDeleted: { $ne: true }
  };

  if (role === 'user') {
    account = await User.findOne(filter);
  } else {
    account = await Vendor.findOne(filter);
  }

  if (!account) {
    throw new AppError('Account not found or already deleted', 404, 'NOT_FOUND');
  }

  const otp = '1234'; // Static OTP for testing/development
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  account.otp = otp;
  account.otpExpiresAt = otpExpiresAt;
  await account.save();

  console.log(`[MOCK SMS] Account Deletion OTP for ${account.phoneNumber} (${role}) is: ${otp}`);

  sendSuccess(res, null, 'OTP sent successfully');
});

const verifyOtp = catchAsync(async (req, res) => {
  const { phoneNumber, role, otp } = req.body;

  if (!phoneNumber || !role || !otp) {
    throw new AppError('Phone number/name, role, and OTP are required', 400, 'BAD_REQUEST');
  }

  if (!['user', 'vendor'].includes(role)) {
    throw new AppError('Invalid role. Must be user or vendor', 400, 'BAD_REQUEST');
  }

  // Find by phone number or name
  let account;
  const filter = {
    $or: [
      { phoneNumber: phoneNumber },
      { name: { $regex: new RegExp(`^${phoneNumber.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
    ],
    isDeleted: { $ne: true }
  };

  if (role === 'user') {
    account = await User.findOne(filter);
  } else {
    account = await Vendor.findOne(filter);
  }

  if (!account) {
    throw new AppError('Account not found or already deleted', 404, 'NOT_FOUND');
  }

  if (account.otp !== otp) {
    throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
  }

  if (new Date() > new Date(account.otpExpiresAt)) {
    throw new AppError('OTP has expired', 400, 'OTP_EXPIRED');
  }

  // Soft delete by setting isDeleted to true, and updating status
  account.isDeleted = true;
  if (role === 'user') {
    account.status = false;
  } else {
    account.status = 'inactive';
  }

  // Clear OTP fields
  account.otp = undefined;
  account.otpExpiresAt = undefined;
  
  await account.save();

  sendSuccess(res, null, 'Account deleted successfully');
});

module.exports = {
  sendOtp,
  verifyOtp
};
