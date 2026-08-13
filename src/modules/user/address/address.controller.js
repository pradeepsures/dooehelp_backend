const catchAsync = require('../../../core/catchAsync');
const addressService = require('./address.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../../core/response');

const create = catchAsync(async (req, res) => {
  const address = await addressService.createAddress(req.user._id, req.body);
  sendCreated(res, address, 'Address added successfully');
});

const list = catchAsync(async (req, res) => {
  const result = await addressService.listAddresses(req.user._id, req.query);
  sendPaginated(res, result.data, result.pagination, 'Addresses retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  const address = await addressService.getAddress(req.params.id, req.user._id);
  sendSuccess(res, address, 'Address details retrieved successfully');
});

const update = catchAsync(async (req, res) => {
  const address = await addressService.updateAddress(req.params.id, req.user._id, req.body);
  sendSuccess(res, address, 'Address updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await addressService.deleteAddress(req.params.id, req.user._id);
  sendSuccess(res, null, 'Address deleted successfully');
});

module.exports = {
  create,
  list,
  getOne,
  update,
  remove
};
