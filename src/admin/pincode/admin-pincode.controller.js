const catchAsync = require('../../core/catchAsync');
const adminPincodeService = require('./admin-pincode.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminPincodeService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Pincodes retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  const pincode = await adminPincodeService.getOne(req.params.id);
  sendSuccess(res, pincode, 'Pincode details retrieved successfully');
});

const create = catchAsync(async (req, res) => {
  const pincode = await adminPincodeService.createPincode(req.body);
  sendCreated(res, pincode, 'Pincode created successfully');
});

const update = catchAsync(async (req, res) => {
  const pincode = await adminPincodeService.updatePincode(req.params.id, req.body);
  sendSuccess(res, pincode, 'Pincode updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await adminPincodeService.softDelete(req.params.id);
  sendSuccess(res, null, 'Pincode deleted successfully');
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove
};
