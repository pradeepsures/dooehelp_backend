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
  const vendor = await authService.repository.findById(req.user._id, { populate: 'categories' });
  sendSuccess(res, vendor, 'Vendor profile retrieved successfully');
});

exports.updateProfile = catchAsync(async (req, res) => {
  const { name, gender, yearOfExperience, categories, skills, tools, onlineStatus, city, address, lat, long, adharNumber, panNumber, bankAccuntno, ifscCode, accountHolderName, bankName } = req.body;
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (gender !== undefined) updateData.gender = gender;
  if (yearOfExperience !== undefined) updateData.yearOfExperience = yearOfExperience === "" ? null : Number(yearOfExperience);
  if (onlineStatus !== undefined) updateData.onlineStatus = onlineStatus;
  if (city !== undefined) updateData.city = city;
  if (address !== undefined) updateData.address = address;
  if (adharNumber !== undefined) updateData.adharNumber = adharNumber;
  if (panNumber !== undefined) updateData.panNumber = panNumber;
  if (bankAccuntno !== undefined) updateData.bankAccuntno = bankAccuntno;
  if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
  if (accountHolderName !== undefined) updateData.accountHolderName = accountHolderName;
  if (bankName !== undefined) updateData.bankName = bankName;

  if (lat !== undefined || long !== undefined) {
    updateData.location = updateData.location || {};
    if (lat !== undefined) updateData.location.lat = lat === "" ? null : Number(lat);
    if (long !== undefined) updateData.location.long = long === "" ? null : Number(long);
  }

  if (req.body.location !== undefined) {
    let loc = req.body.location;
    if (typeof loc === 'string') {
      try {
        loc = JSON.parse(loc);
      } catch (e) {
        // Not JSON
      }
    }
    if (loc && typeof loc === 'object') {
      updateData.location = updateData.location || {};
      if (loc.lat !== undefined) updateData.location.lat = loc.lat === "" ? null : Number(loc.lat);
      if (loc.long !== undefined) updateData.location.long = loc.long === "" ? null : Number(loc.long);
    }
  }

  function parseArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Not a JSON string
      }
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  if (categories !== undefined) updateData.categories = parseArray(categories);
  if (skills !== undefined) updateData.skills = parseArray(skills);
  if (tools !== undefined) updateData.tools = parseArray(tools);

  if (req.files) {
    if (req.files['profileImage'] && req.files['profileImage'].length > 0) {
      updateData.profileImage = `/${req.files['profileImage'][0].destination}/${req.files['profileImage'][0].filename}`.replace(/\\/g, '/');
    }
    if (req.files['adharFront'] && req.files['adharFront'].length > 0) {
      updateData.adharFront = `/${req.files['adharFront'][0].destination}/${req.files['adharFront'][0].filename}`.replace(/\\/g, '/');
    }
    if (req.files['adharBack'] && req.files['adharBack'].length > 0) {
      updateData.adharBack = `/${req.files['adharBack'][0].destination}/${req.files['adharBack'][0].filename}`.replace(/\\/g, '/');
    }
    if (req.files['panFront'] && req.files['panFront'].length > 0) {
      updateData.panFront = `/${req.files['panFront'][0].destination}/${req.files['panFront'][0].filename}`.replace(/\\/g, '/');
    }
    if (req.files['panBack'] && req.files['panBack'].length > 0) {
      updateData.panBack = `/${req.files['panBack'][0].destination}/${req.files['panBack'][0].filename}`.replace(/\\/g, '/');
    }
    if (req.files['passBookPhoto'] && req.files['passBookPhoto'].length > 0) {
      updateData.passBookPhoto = `/${req.files['passBookPhoto'][0].destination}/${req.files['passBookPhoto'][0].filename}`.replace(/\\/g, '/');
    }
    if (req.files['professionalCertificate']) {
      updateData.professionalCertificate = req.files['professionalCertificate'].map(file => `/${file.destination}/${file.filename}`.replace(/\\/g, '/'));
    }
  }

  // Calculate dynamic profile completion progress
  const tempVendor = {
    ...req.user,
    ...updateData
  };

  let completion = 10; // Base 10% for phone authentication
  if (tempVendor.name || tempVendor.gender) completion += 20;
  if (tempVendor.categories && tempVendor.categories.length > 0) completion += 20;
  if ((tempVendor.skills && tempVendor.skills.length > 0) || (tempVendor.tools && tempVendor.tools.length > 0)) completion += 20;
  if (tempVendor.yearOfExperience !== undefined && tempVendor.yearOfExperience !== null) completion += 10;
  
  if (tempVendor.adharNumber || tempVendor.panNumber || tempVendor.adharFront || tempVendor.adharBack || tempVendor.panFront || tempVendor.panBack) {
    completion += 20;
  }

  updateData.profileCompletion = Math.min(completion, 100);

  const updatedVendor = await authService.update(req.user._id, updateData);
  sendSuccess(res, updatedVendor, 'Vendor profile updated successfully');
});
