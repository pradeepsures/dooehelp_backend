const catchAsync = require('../../core/catchAsync');
const adminReferAndEarnService = require('./admin-refer-earn.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminReferAndEarnService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Refer and Earn configurations retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await adminReferAndEarnService.getOne(req.params.id), 'Refer and Earn configuration retrieved successfully');
});

const create = catchAsync(async (req, res) => {
  sendCreated(res, await adminReferAndEarnService.createReferAndEarn(req.body), 'Refer and Earn configuration created successfully');
});

const update = catchAsync(async (req, res) => {
  sendSuccess(res, await adminReferAndEarnService.updateReferAndEarn(req.params.id, req.body), 'Refer and Earn configuration updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await adminReferAndEarnService.softDelete(req.params.id);
  sendSuccess(res, null, 'Refer and Earn configuration deleted successfully');
});

module.exports = { list, getOne, create, update, remove };
