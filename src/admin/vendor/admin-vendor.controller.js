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

module.exports = {
  list,
  getOne,
  approve,
  reject
};
