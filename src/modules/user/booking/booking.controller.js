const catchAsync = require('../../../core/catchAsync');
const bookingService = require('./booking.service');
const { sendSuccess, sendCreated } = require('../../../core/response');

exports.getSlots = catchAsync(async (req, res) => {
  const slots = await bookingService.getAvailableSlots();
  sendSuccess(res, slots, 'Available date and time slots fetched successfully');
});

exports.createBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body);
  sendCreated(res, booking, 'Booking created successfully');
});

exports.confirmPayment = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const booking = await bookingService.confirmPayment(req.user._id, bookingId);
  sendSuccess(res, booking, 'Payment confirmed successfully');
});

exports.getBookings = catchAsync(async (req, res) => {
  const { type } = req.query; // 'upcoming' or 'history'
  const bookings = await bookingService.getBookings(req.user._id, type);
  sendSuccess(res, bookings, 'Bookings fetched successfully');
});

exports.getBookingDetails = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const booking = await bookingService.getBookingDetails(req.user._id, bookingId);
  sendSuccess(res, booking, 'Booking details fetched successfully');
});
