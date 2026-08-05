const catchAsync = require('../../core/catchAsync');
const userService = require('./user.service');
const { sendSuccess } = require('../../core/response');

// User specific controllers will go here
exports.getProfile = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const user = await userService.getById(userId);
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

  const updatedUser = await userService.update(userId, updateData);
  sendSuccess(res, updatedUser, 'Profile updated successfully');
});
