const catchAsync = require('../../core/catchAsync');
const adminVendorService = require('./admin-vendor.service');
const { sendSuccess, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminVendorService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Vendors retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await adminVendorService.getOne(req.params.id), 'Vendor profile retrieved successfully');
});

const approve = catchAsync(async (req, res) => {
  const vendor = await adminVendorService.approveVendor(req.params.id);
  sendSuccess(res, vendor, 'Vendor approved and verified successfully');
});

const reject = catchAsync(async (req, res) => {
  const vendor = await adminVendorService.rejectVendor(req.params.id);
  sendSuccess(res, vendor, 'Vendor application rejected successfully');
});

const getWalletHistory = catchAsync(async (req, res) => {
  const vendorWalletService = require('../../modules/vendor/wallet/vendor-wallet.service');
  const summary = await vendorWalletService.getWalletSummary(req.params.id);
  const history = await vendorWalletService.getWalletHistory(req.params.id, req.query);
  sendSuccess(res, { summary, ...history }, 'Vendor wallet history retrieved successfully');
});

const adjustWalletBalance = catchAsync(async (req, res) => {
  const result = await adminVendorService.adjustWalletBalance(req.params.id, req.body, req.user?._id);
  sendSuccess(res, result, `Vendor wallet ${req.body.type === 'credit' ? 'credited' : 'debited'} successfully`);
});

module.exports = {
  list,
  getOne,
  approve,
  reject,
  getWalletHistory,
  adjustWalletBalance
};
