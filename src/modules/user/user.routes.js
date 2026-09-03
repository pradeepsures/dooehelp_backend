const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Public routes
router.use('/auth', require('./auth/auth.routes'));
router.use('/banner', require('./banner/banner.routes'));
router.use('/service-availability', require('./service-availability/service-availability.routes'));
router.use('/refer-earn', require('./refer-earn/refer-earn.routes'));

// Protected user routes
router.use(protect, restrictTo('user'));
router.use('/category', require('./category/category.routes'));
router.use('/subcategory', require('./subcategory/subcategory.routes'));
router.use('/comment', require('./comment/comment.routes'));
router.use('/cart', require('./cart/cart.routes'));
router.use('/wishlist', require('./wishlist/wishlist.routes'));
router.use('/save-for-later', require('./save-for-later/save-for-later.routes'));
router.use('/bookings', require('./booking/booking.routes'));
router.use('/address', require('./address/address.routes'));

module.exports = router;
