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

module.exports = {
  list,
  getOne
};
