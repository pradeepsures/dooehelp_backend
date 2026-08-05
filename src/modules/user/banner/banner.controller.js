const catchAsync = require('../../../core/catchAsync');
const bannerService = require('./banner.service');
const { sendSuccess } = require('../../../core/response');
const AppError = require('../../../core/AppError');

exports.getAllBanners = catchAsync(async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: { createdAt: -1 }
  };
  
  const banners = await bannerService.getActiveBanners(options);
  sendSuccess(res, banners, 'Banners retrieved successfully');
});

exports.getBannerDetails = catchAsync(async (req, res) => {
  const banner = await bannerService.getById(req.params.id);
  
  if (!banner.status || banner.isDeleted) {
    throw new AppError('Banner not found or inactive', 404, 'NOT_FOUND');
  }

  sendSuccess(res, banner, 'Banner details retrieved successfully');
});
