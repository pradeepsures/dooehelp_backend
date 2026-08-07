const express = require('express');
const router = express.Router();

const adminAuthRoutes = require('./auth/admin.routes');
const adminBannerRoutes = require('./banner/admin-banner.routes');
const adminCategoryRoutes = require('./category/admin-category.routes');
const adminSubcategoryRoutes = require('./subcategory/admin-subcategory.routes');

router.use('/auth', adminAuthRoutes);
router.use('/banner', adminBannerRoutes);
router.use('/category', adminCategoryRoutes);
router.use('/subcategory', adminSubcategoryRoutes);

module.exports = router;
