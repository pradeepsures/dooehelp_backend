const catchAsync = require('../../core/catchAsync');
const adminBannerService = require('./admin-banner.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await adminBannerService.listAll(req.query);
  sendPaginated(res, result.data, result.pagination, 'Banners retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await adminBannerService.getOne(req.params.id), 'Banner retrieved successfully');
});

const create = catchAsync(async (req, res) => {
  sendCreated(res, await adminBannerService.createBanner(req.body, req.file), 'Banner created successfully');
});

const update = catchAsync(async (req, res) => {
  sendSuccess(res, await adminBannerService.updateBanner(req.params.id, req.body, req.file), 'Banner updated successfully');
});

const remove = catchAsync(async (req, res) => {
  await adminBannerService.softDelete(req.params.id);
  sendSuccess(res, null, 'Banner deleted successfully');
});

module.exports = { list, getOne, create, update, remove };
