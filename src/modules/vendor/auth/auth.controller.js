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

exports.getProfile = catchAsync(async (req, res) => {
  const vendor = await authService.getById(req.user._id);
  sendSuccess(res, vendor, 'Vendor profile retrieved successfully');
});

exports.updateProfile = catchAsync(async (req, res) => {
  const { name, gender, yearOfExperience } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (gender) updateData.gender = gender;
  if (yearOfExperience) updateData.yearOfExperience = yearOfExperience;

  if (req.files) {
    if (req.files['profileImage'] && req.files['profileImage'].length > 0) {
      updateData.profileImage = `/${req.files['profileImage'][0].destination}/${req.files['profileImage'][0].filename}`.replace(/\\/g, '/');
    }
    if (req.files['governmentId']) {
      updateData.governmentId = req.files['governmentId'].map(file => `/${file.destination}/${file.filename}`.replace(/\\/g, '/'));
    }
    if (req.files['addressProof']) {
      updateData.addressProof = req.files['addressProof'].map(file => `/${file.destination}/${file.filename}`.replace(/\\/g, '/'));
    }
    if (req.files['professionalCertificate']) {
      updateData.professionalCertificate = req.files['professionalCertificate'].map(file => `/${file.destination}/${file.filename}`.replace(/\\/g, '/'));
    }
  }

  const updatedVendor = await authService.update(req.user._id, updateData);
  sendSuccess(res, updatedVendor, 'Vendor profile updated successfully');
});
