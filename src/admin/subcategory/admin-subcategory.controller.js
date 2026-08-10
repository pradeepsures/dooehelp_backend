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

const listIncluded = catchAsync(async (req, res) => {
  const result = await adminSubcategoryService.listIncludedServices(req.params.subCategoryId, req.query);
  sendSuccess(res, result.data, 'Included services retrieved successfully');
});

const createIncluded = catchAsync(async (req, res) => {
  sendCreated(res, await adminSubcategoryService.createIncludedService(req.params.subCategoryId, req.body, req.file), 'Included service created successfully');
});

const updateIncluded = catchAsync(async (req, res) => {
  sendSuccess(res, await adminSubcategoryService.updateIncludedService(req.params.id, req.body, req.file), 'Included service updated successfully');
});

const removeIncluded = catchAsync(async (req, res) => {
  await adminSubcategoryService.softDeleteIncludedService(req.params.id);
  sendSuccess(res, null, 'Included service deleted successfully');
});

module.exports = { list, getOne, create, update, remove, listIncluded, createIncluded, updateIncluded, removeIncluded };
