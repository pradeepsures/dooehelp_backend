const express = require('express');
const router = express.Router();
const bookingController = require('./booking.controller');
const { validate } = require('../../../core/validate');
const { createBookingSchema } = require('./booking.schema');

router.get('/slots', bookingController.getSlots);

router.route('/')
  .get(bookingController.getBookings)
  .post(validate(createBookingSchema), bookingController.createBooking);

router.get('/:bookingId', bookingController.getBookingDetails);
router.post('/:bookingId/confirm-payment', bookingController.confirmPayment);

module.exports = router;
