const catchAsync = require('../../../core/catchAsync');
const categoryService = require('./category.service');
const { sendSuccess, sendPaginated } = require('../../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await categoryService.getActiveCategories(req.query);
  sendPaginated(res, result.data, result.pagination, 'Categories retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await categoryService.getActiveCategoryDetails(req.params.id), 'Category details retrieved successfully');
});

module.exports = { list, getOne };
