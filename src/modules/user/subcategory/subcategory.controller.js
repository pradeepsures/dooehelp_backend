const catchAsync = require('../../../core/catchAsync');
const subcategoryService = require('./subcategory.service');
const { sendSuccess, sendPaginated } = require('../../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await subcategoryService.getActiveSubcategories(req.query);
  sendPaginated(res, result.data, result.pagination, 'Subcategories retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await subcategoryService.getActiveSubcategoryDetails(req.params.id), 'Subcategory details retrieved successfully');
});

module.exports = { list, getOne };
