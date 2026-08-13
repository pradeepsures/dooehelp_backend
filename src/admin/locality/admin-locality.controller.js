const catchAsync = require('../../core/catchAsync');
const adminLocalityService = require('./admin-locality.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminLocalityService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Localities retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  const locality = await adminLocalityService.getOne(req.params.id);
  sendSuccess(res, locality, 'Locality details retrieved successfully');
});

const create = catchAsync(async (req, res) => {
  const locality = await adminLocalityService.createLocality(req.body);
  sendCreated(res, locality, 'Locality created successfully');
});

const update = catchAsync(async (req, res) => {
  const locality = await adminLocalityService.updateLocality(req.params.id, req.body);
  sendSuccess(res, locality, 'Locality updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await adminLocalityService.softDelete(req.params.id);
  sendSuccess(res, null, 'Locality deleted successfully');
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove
};
