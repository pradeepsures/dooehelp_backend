const catchAsync = require('../../../core/catchAsync');
const vendorWalletService = require('./vendor-wallet.service');
const { sendSuccess } = require('../../../core/response');

exports.getWalletSummary = catchAsync(async (req, res) => {
  const vendorId = req.user._id;
  const summary = await vendorWalletService.getWalletSummary(vendorId, req.query);
  sendSuccess(res, summary, 'Vendor wallet summary retrieved successfully');
});

exports.getWalletHistory = catchAsync(async (req, res) => {
  const vendorId = req.user._id;
  const result = await vendorWalletService.getWalletHistory(vendorId, req.query);
  sendSuccess(res, result, 'Vendor wallet history retrieved successfully');
});
