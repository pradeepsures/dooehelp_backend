const catchAsync = require('../../core/catchAsync');
const adminSubcategoryService = require('./admin-subcategory.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminSubcategoryService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Subcategories retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await adminSubcategoryService.getOne(req.params.id), 'Subcategory retrieved successfully');
});

const create = catchAsync(async (req, res) => {
  sendCreated(res, await adminSubcategoryService.createSubcategory(req.body, req.file), 'Subcategory created successfully');
});

const update = catchAsync(async (req, res) => {
  sendSuccess(res, await adminSubcategoryService.updateSubcategory(req.params.id, req.body, req.file), 'Subcategory updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await adminSubcategoryService.softDelete(req.params.id);
  sendSuccess(res, null, 'Subcategory deleted successfully');
});

module.exports = { list, getOne, create, update, remove };
