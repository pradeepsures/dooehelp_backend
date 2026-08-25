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

const listVariants = catchAsync(async (req, res) => {
  const result = await adminSubcategoryService.listVariants(req.params.subCategoryId, req.query);
  sendPaginated(res, result.data, result.pagination, 'Variants retrieved successfully');
});

const getOneVariant = catchAsync(async (req, res) => {
  sendSuccess(res, await adminSubcategoryService.getOneVariant(req.params.id), 'Variant details retrieved successfully');
});

const createVariant = catchAsync(async (req, res) => {
  sendCreated(res, await adminSubcategoryService.createVariant(req.params.subCategoryId, req.body, req.file), 'Variant created successfully');
});

const updateVariant = catchAsync(async (req, res) => {
  sendSuccess(res, await adminSubcategoryService.updateVariant(req.params.id, req.body, req.file), 'Variant updated successfully');
});

const removeVariant = catchAsync(async (req, res) => {
  await adminSubcategoryService.softDeleteVariant(req.params.id);
  sendSuccess(res, null, 'Variant deleted successfully');
});

module.exports = { 
  list, 
  getOne, 
  create, 
  update, 
  remove, 
  listIncluded, 
  createIncluded, 
  updateIncluded, 
  removeIncluded,
  listVariants,
  getOneVariant,
  createVariant,
  updateVariant,
  removeVariant
};
