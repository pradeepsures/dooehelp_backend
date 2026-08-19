const express = require('express');
const router = express.Router();
const vendorBookingController = require('./vendor-booking.controller');
const { protect, restrictTo } = require('../../../middlewares/auth.middleware');

// Protect all vendor booking routes to vendors
router.use(protect, restrictTo('vendor'));

router.get('/', vendorBookingController.listVendorBookings);
router.get('/stats', vendorBookingController.getVendorStats);
router.get('/:bookingId', vendorBookingController.getBookingDetails);
router.put('/:bookingId/accept', vendorBookingController.acceptBooking);
router.put('/:bookingId/decline', vendorBookingController.declineBooking);

const uploadMiddleware = require('../../../middlewares/upload.middleware');

router.post('/:bookingId/send-otp', vendorBookingController.sendStartOtp);
router.post('/:bookingId/verify-otp', vendorBookingController.verifyStartOtp);

router.post('/:bookingId/send-end-otp', vendorBookingController.sendEndOtp);
router.post('/:bookingId/verify-end-otp', vendorBookingController.verifyEndOtp);

router.put('/:bookingId/upload-before-image', uploadMiddleware.fields([
  { name: 'beforeWorkImage', maxCount: 5 }
]), vendorBookingController.uploadBeforeImage);

router.put('/:bookingId/upload-after-image', uploadMiddleware.fields([
  { name: 'afterWorkImage', maxCount: 5 }
]), vendorBookingController.uploadAfterImage);

module.exports = router;
