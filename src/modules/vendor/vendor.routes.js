const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Vendor specific public routes
router.use('/auth', require('./auth/auth.routes'));

// Protected vendor routes
router.use(protect, restrictTo('vendor'));

router.use('/category', require('./category/category.routes'));
router.use('/bookings', require('./booking/vendor-booking.routes'));
router.use('/localities', require('./locality/locality.routes'));
router.use('/wallet', require('./wallet/vendor-wallet.routes'));
router.use('/notifications', require('./notification/vendor-notification.routes'));

module.exports = router;
