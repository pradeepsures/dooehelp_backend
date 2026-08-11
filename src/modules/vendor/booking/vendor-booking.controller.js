const catchAsync = require('../../../core/catchAsync');
const Booking = require('../../../models/Booking.model');
const AppError = require('../../../core/AppError');
const { sendSuccess } = require('../../../core/response');

exports.listVendorBookings = catchAsync(async (req, res) => {
  const vendorId = req.user._id;
  const { type } = req.query;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  let filter = { vendorId };

  if (type === 'active') {
    // Active means accepted and running
    filter.bookingStatus = 'accepted';
  } else if (type === 'upcoming') {
    // Upcoming means assigned (pending acceptance) or future scheduled accepted bookings
    filter.$or = [
      { bookingStatus: 'assigned' },
      { date: { $gt: endOfToday }, bookingStatus: 'accepted' }
    ];
  } else if (type === 'completed') {
    // Completed bookings
    filter.bookingStatus = 'completed';
  } else {
    // Default: Today's scheduled bookings (either assigned or accepted)
    filter.date = { $gte: startOfToday, $lte: endOfToday };
    filter.bookingStatus = { $in: ['assigned', 'accepted'] };
  }

  const bookings = await Booking.find(filter)
    .populate({
      path: 'userId',
      model: 'User',
      select: 'name phoneNumber email profileImage address location'
    })
    .populate({
      path: 'items.subcategoryId',
      model: 'Subcategory',
      select: 'name price image originalPrice description'
    })
    .populate({
      path: 'items.categoryId',
      model: 'Category',
      select: 'name'
    })
    .sort({ createdAt: -1 })
    .lean();

  sendSuccess(res, bookings, `Vendor bookings (${type || 'today'}) fetched successfully`);
});

exports.acceptBooking = catchAsync(async (req, res) => {
  const vendorId = req.user._id;
  const { bookingId } = req.params;

  const mongoose = require('mongoose');
  const query = mongoose.isValidObjectId(bookingId)
    ? { _id: bookingId, vendorId }
    : { bookingId, vendorId };

  const booking = await Booking.findOne(query);
  if (!booking) {
    throw new AppError('Booking not found or not assigned to you', 404, 'NOT_FOUND');
  }

  if (booking.bookingStatus === 'accepted') {
    throw new AppError('Booking is already accepted', 400, 'BAD_REQUEST');
  }

  // Update status to accepted
  booking.bookingStatus = 'accepted';
  await booking.save();

  // Populate user profile (including name, email, phone, location coordinates, address) to show on map
  const updatedBooking = await Booking.findById(booking._id)
    .populate({
      path: 'userId',
      model: 'User',
      select: 'name phoneNumber email profileImage address location'
    })
    .populate({
      path: 'items.subcategoryId',
      model: 'Subcategory',
      select: 'name price image'
    })
    .lean();

  sendSuccess(
    res,
    updatedBooking,
    'Booking accepted successfully. Customer location coordinates are available for routing.'
  );
});

exports.declineBooking = catchAsync(async (req, res) => {
  const vendorId = req.user._id;
  const { bookingId } = req.params;

  const mongoose = require('mongoose');
  const query = mongoose.isValidObjectId(bookingId)
    ? { _id: bookingId, vendorId }
    : { bookingId, vendorId };

  const booking = await Booking.findOne(query);
  if (!booking) {
    throw new AppError('Booking not found or not assigned to you', 404, 'NOT_FOUND');
  }

  // 1. Add current vendor to declined list
  booking.declinedVendors.push(vendorId);

  // 2. Clear assignment and reset booking status to pending so admin can re-assign
  booking.vendorId = null;
  booking.bookingStatus = 'pending';

  await booking.save();

  sendSuccess(res, null, 'Booking declined successfully. Re-routed back to pending bookings.');
});
