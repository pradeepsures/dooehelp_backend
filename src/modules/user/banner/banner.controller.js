const catchAsync = require('../../../core/catchAsync');
const bannerService = require('./banner.service');
const { sendSuccess, sendPaginated } = require('../../../core/response');

const list = catchAsync(async (req, res) => {
  const result = await bannerService.getActiveBanners(req.query);
  sendPaginated(res, result.data, result.pagination, 'Banners retrieved successfully');
});

const getOne = catchAsync(async (req, res) => {
  sendSuccess(res, await bannerService.getActiveBannerDetails(req.params.id), 'Banner details retrieved successfully');
});

module.exports = { list, getOne };
