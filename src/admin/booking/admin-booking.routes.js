const express = require('express');
const router = express.Router();
const adminBookingController = require('./admin-booking.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Routes protected to admin/superadmin roles
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', adminBookingController.listAllBookings);
router.put('/:bookingId/assign', adminBookingController.assignPartner);
router.get('/:bookingId/available-vendors', adminBookingController.getAvailableVendorsForBooking);
router.get('/:bookingId', adminBookingController.getBookingDetails);

module.exports = router;
