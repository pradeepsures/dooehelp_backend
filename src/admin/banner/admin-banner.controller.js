const catchAsync = require('../../core/catchAsync');
const adminBannerService = require('./admin-banner.service');
const { sendSuccess, sendCreated } = require('../../core/response');
const AppError = require('../../core/AppError');

exports.createBanner = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('Banner image is required', 400, 'VALIDATION_ERROR');
  }

  const bannerData = {
    ...req.body,
    image: `/${req.file.destination}/${req.file.filename}`.replace(/\\/g, '/')
  };

  const banner = await adminBannerService.create(bannerData);
  sendCreated(res, banner, 'Banner created successfully');
});

exports.getAllBanners = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status !== undefined) filter.status = req.query.status;
  if (req.query.isDeleted !== undefined) filter.isDeleted = req.query.isDeleted;

  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    sort: { createdAt: -1 }
  };

  const banners = await adminBannerService.getAll(filter, options);
  sendSuccess(res, banners, 'Banners retrieved successfully');
});

exports.getBanner = catchAsync(async (req, res) => {
  const banner = await adminBannerService.getById(req.params.id);
  sendSuccess(res, banner, 'Banner retrieved successfully');
});

exports.updateBanner = catchAsync(async (req, res) => {
  const updateData = { ...req.body };
  
  if (req.file) {
    updateData.image = `/${req.file.destination}/${req.file.filename}`.replace(/\\/g, '/');
  }

  const banner = await adminBannerService.update(req.params.id, updateData);
  sendSuccess(res, banner, 'Banner updated successfully');
});

exports.deleteBanner = catchAsync(async (req, res) => {
  // Soft delete by default based on the schema design
  const banner = await adminBannerService.update(req.params.id, { isDeleted: true });
  sendSuccess(res, banner, 'Banner deleted successfully');
});
