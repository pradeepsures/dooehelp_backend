const express = require('express');
const router = express.Router();
const adminBannerController = require('./admin-banner.controller');
const { validate } = require('../../core/validate');
const { createBannerSchema, updateBannerSchema } = require('./admin-banner.schema');
const uploadMiddleware = require('../../middlewares/upload.middleware');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Protect all admin banner routes
router.use(protect, restrictTo('admin', 'superadmin'));

router
  .route('/')
  .post(
    uploadMiddleware.single('image'),
    validate(createBannerSchema),
    adminBannerController.createBanner
  )
  .get(adminBannerController.getAllBanners);

router
  .route('/:id')
  .get(adminBannerController.getBanner)
  .put(
    uploadMiddleware.single('image'),
    validate(updateBannerSchema),
    adminBannerController.updateBanner
  )
  .delete(adminBannerController.deleteBanner);

module.exports = router;
