const catchAsync = require('../../../core/catchAsync');
const userWalletService = require('./user-wallet.service');
const { sendSuccess } = require('../../../core/response');

exports.getWalletSummary = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await userWalletService.getWalletSummary(userId);
  sendSuccess(res, result, 'User wallet summary retrieved successfully');
});

exports.getWalletHistory = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await userWalletService.getWalletHistory(userId, req.query);
  sendSuccess(res, result, 'User wallet history retrieved successfully');
});
