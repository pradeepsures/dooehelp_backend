const catchAsync = require('../../core/catchAsync');
const adminCategoryService = require('./admin-category.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminCategoryService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Categories retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await adminCategoryService.getOne(req.params.id), 'Category retrieved successfully');
});

const create = catchAsync(async (req, res) => {
  sendCreated(res, await adminCategoryService.createCategory(req.body, req.file), 'Category created successfully');
});

const update = catchAsync(async (req, res) => {
  sendSuccess(res, await adminCategoryService.updateCategory(req.params.id, req.body, req.file), 'Category updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await adminCategoryService.softDelete(req.params.id);
  sendSuccess(res, null, 'Category deleted successfully');
});

module.exports = { list, getOne, create, update, remove };
