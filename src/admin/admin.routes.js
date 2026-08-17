const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const adminAuthRoutes = require('./auth/admin.routes');
const adminBannerRoutes = require('./banner/admin-banner.routes');
const adminCategoryRoutes = require('./category/admin-category.routes');
const adminSubcategoryRoutes = require('./subcategory/admin-subcategory.routes');

router.use('/auth', adminAuthRoutes);

// Protect all admin routes except auth
router.use(protect, restrictTo('admin', 'superadmin'));

router.use('/banner', adminBannerRoutes);
router.use('/category', adminCategoryRoutes);
router.use('/subcategory', adminSubcategoryRoutes);
router.use('/vendor', require('./vendor/admin-vendor.routes'));
router.use('/user', require('./user/admin-user.routes'));
router.use('/bookings', require('./booking/admin-booking.routes'));
router.use('/pincodes', require('./pincode/admin-pincode.routes'));
router.use('/localities', require('./locality/admin-locality.routes'));
router.use('/dashboard', require('./dashboard/admin-dashboard.routes'));
router.use('/cms', require('./cms/admin-cms.routes'));

module.exports = router;
