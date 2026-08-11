const express = require('express');
const router = express.Router();
const vendorBookingController = require('./vendor-booking.controller');
const { protect, restrictTo } = require('../../../middlewares/auth.middleware');

// Protect all vendor booking routes to vendors
router.use(protect, restrictTo('vendor'));

router.get('/', vendorBookingController.listVendorBookings);
router.put('/:bookingId/accept', vendorBookingController.acceptBooking);
router.put('/:bookingId/decline', vendorBookingController.declineBooking);

module.exports = router;
