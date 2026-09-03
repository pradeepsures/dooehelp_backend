const catchAsync = require('../../core/catchAsync');
const adminUserService = require('./admin-user.service');
const { sendSuccess, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminUserService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Users list retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  const user = await adminUserService.getOne(req.params.id);
  sendSuccess(res, user, 'User details retrieved successfully');
});

const adjustWalletBalance = catchAsync(async (req, res) => {
  const result = await adminUserService.adjustWalletBalance(req.params.id, req.body, req.user?._id);
  sendSuccess(res, result, `User wallet ${req.body.type === 'credit' ? 'credited' : 'debited'} successfully`);
});

const getWalletHistory = catchAsync(async (req, res) => {
  const result = await adminUserService.getWalletHistory(req.params.id, req.query);
  sendSuccess(res, result, 'User wallet history retrieved successfully');
});

module.exports = {
  list,
  getOne,
  adjustWalletBalance,
  getWalletHistory
};
