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

const getByCategory = catchAsync(async (req, res) => {
  const result = await subcategoryService.getActiveSubcategories({
    ...req.query,
    categoryId: req.params.categoryId
  });
  
  const cleanData = result.data.map(item => ({
    _id: item._id,
    name: item.name,
    description: item.description,
    image: item.image,
    startingPrice: item.startingPrice
  }));

  sendPaginated(res, cleanData, result.pagination, 'Subcategories retrieved successfully');
});

const getVariantsBySubcategory = catchAsync(async (req, res) => {
  const { subCategoryId } = req.params;
  const result = await subcategoryService.getActiveVariantsBySubcategory(subCategoryId);
  sendSuccess(res, result, 'Variants retrieved successfully');
});

const getVariantDetails = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await subcategoryService.getActiveVariantDetails(id);
  sendSuccess(res, result, 'Variant details retrieved successfully');
});

module.exports = { list, getOne, getByCategory, getVariantsBySubcategory, getVariantDetails };
