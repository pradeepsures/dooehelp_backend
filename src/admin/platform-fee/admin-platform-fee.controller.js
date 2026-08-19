const catchAsync = require('../../core/catchAsync');
const adminPlatformFeeService = require('./admin-platform-fee.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminPlatformFeeService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Platform fees retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await adminPlatformFeeService.getOne(req.params.id), 'Platform fee configuration retrieved successfully');
});

const create = catchAsync(async (req, res) => {
  sendCreated(res, await adminPlatformFeeService.createPlatformFee(req.body), 'Platform fee configuration created successfully');
});

const update = catchAsync(async (req, res) => {
  sendSuccess(res, await adminPlatformFeeService.updatePlatformFee(req.params.id, req.body), 'Platform fee configuration updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await adminPlatformFeeService.softDelete(req.params.id);
  sendSuccess(res, null, 'Platform fee configuration deleted successfully');
});

module.exports = { list, getOne, create, update, remove };
