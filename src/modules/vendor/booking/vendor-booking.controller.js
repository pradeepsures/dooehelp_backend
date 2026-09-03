const catchAsync = require('../../../core/catchAsync');
const Booking = require('../../../models/Booking.model');
const UserAddress = require('../../../models/UserAddress.model');
const User = require('../../../models/User.model');
const Category = require('../../../models/Category.model');
const Subcategory = require('../../../models/Subcategory.model');
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

  if (type === 'upcoming') {
    // Upcoming: bookings assigned to the vendor but pending acceptance
    filter.bookingStatus = 'assigned';
  } else if (type === 'future') {
    // Future: scheduled bookings for dates after today
    filter.date = { $gt: endOfToday };
    filter.bookingStatus = { $in: ['assigned', 'accepted', 'active'] };
  } else if (type === 'today') {
    // Today: today's assigned, accepted or active bookings
    filter.date = { $gte: startOfToday, $lte: endOfToday };
    filter.bookingStatus = { $in: ['assigned', 'accepted', 'active'] };
  } else if (type === 'completed') {
    // Completed: only completed bookings
    filter.bookingStatus = 'completed';
  } else if (type === 'history') {
    // History: completed, cancelled or declined bookings
    filter.bookingStatus = { $in: ['completed', 'cancelled', 'declined'] };
  } else {
    // Default (when no type parameter is passed):
    // Always include assigned bookings (which need immediate accept/decline action)
    // PLUS today's accepted or active bookings
    filter.$or = [
      { bookingStatus: 'assigned' },
      {
        bookingStatus: { $in: ['accepted', 'active'] },
        date: { $gte: startOfToday, $lte: endOfToday }
      }
    ];
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
    .populate({
      path: 'address',
      model: 'UserAddress'
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

  // Check if the vendor is already busy with another active booking at the same date and time slot
  const sameTimeBooking = await Booking.findOne({
    vendorId,
    bookingStatus: { $in: ['accepted', 'scheduled'] },
    date: booking.date,
    timeSlot: booking.timeSlot,
    _id: { $ne: booking._id }
  });

  if (sameTimeBooking) {
    throw new AppError('You already have an accepted/scheduled booking at this date and time slot', 400, 'BAD_REQUEST');
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
    .populate({
      path: 'address',
      model: 'UserAddress'
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

exports.sendStartOtp = catchAsync(async (req, res) => {
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

  if (booking.bookingStatus !== 'accepted' && booking.bookingStatus !== 'scheduled') {
    throw new AppError('Booking must be accepted or scheduled to send start OTP', 400, 'BAD_REQUEST');
  }

  const generatedOtp = '1234'; // Static mock OTP
  booking.startOtp = generatedOtp;
  booking.startOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
  booking.isOtpVerified = false; // Reset verification flag when new OTP is sent

  await booking.save();

  console.log(`[MOCK SERVICE OTP] OTP for Booking ${booking.bookingId} is: ${generatedOtp}`);

  sendSuccess(res, { bookingId: booking.bookingId }, 'Service start OTP sent to customer successfully (Mocked to 1234)');
});

exports.verifyStartOtp = catchAsync(async (req, res) => {
  const vendorId = req.user._id;
  const { bookingId } = req.params;
  const { otp } = req.body;

  const mongoose = require('mongoose');
  const query = mongoose.isValidObjectId(bookingId)
    ? { _id: bookingId, vendorId }
    : { bookingId, vendorId };

  const booking = await Booking.findOne(query);
  if (!booking) {
    throw new AppError('Booking not found or not assigned to you', 404, 'NOT_FOUND');
  }

  if (booking.bookingStatus !== 'accepted' && booking.bookingStatus !== 'scheduled') {
    throw new AppError('Booking must be accepted or scheduled to verify OTP', 400, 'BAD_REQUEST');
  }

  if (!otp) {
    throw new AppError('OTP is required', 400, 'BAD_REQUEST');
  }

  if (booking.startOtp !== otp) {
    throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
  }

  if (new Date() > new Date(booking.startOtpExpiresAt)) {
    throw new AppError('OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED');
  }

  booking.isOtpVerified = true;
  booking.startOtp = null;
  booking.startOtpExpiresAt = null;
  booking.bookingStatus = 'active';

  await booking.save();

  sendSuccess(res, { bookingId: booking.bookingId, isOtpVerified: true, bookingStatus: 'active' }, 'OTP verified successfully. Service started and booking status is now active.');
});

exports.uploadBeforeImage = catchAsync(async (req, res) => {
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

  if (booking.bookingStatus !== 'active') {
    throw new AppError('Booking must be active to upload before-work image', 400, 'BAD_REQUEST');
  }

  if (!booking.isOtpVerified) {
    throw new AppError('Please verify OTP before uploading before-work image', 400, 'BAD_REQUEST');
  }

  const hasFiles = req.files && req.files['beforeWorkImage'] && req.files['beforeWorkImage'].length > 0;

  // Verify before-work image is uploaded for outdoor bookings
  if (!hasFiles && booking.bookingType === 'outdoor') {
    throw new AppError('Before-work image is required for outdoor bookings', 400, 'BAD_REQUEST');
  }

  if (hasFiles) {
    const beforeWorkImagePaths = req.files['beforeWorkImage'].map(file => `/${file.destination}/${file.filename}`.replace(/\\/g, '/'));
    booking.beforeWorkImage = beforeWorkImagePaths;
  }

  await booking.save();

  sendSuccess(res, booking, 'Before-work image uploaded successfully.');
});

exports.uploadAfterImage = catchAsync(async (req, res) => {
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

  if (booking.bookingStatus !== 'active') {
    throw new AppError('Booking must be active to complete service', 400, 'BAD_REQUEST');
  }

  const hasFiles = req.files && req.files['afterWorkImage'] && req.files['afterWorkImage'].length > 0;

  // Verify after-work image is uploaded for outdoor bookings
  if (!hasFiles && booking.bookingType === 'outdoor') {
    throw new AppError('After-work image is required for outdoor bookings', 400, 'BAD_REQUEST');
  }

  if (hasFiles) {
    const afterWorkImagePaths = req.files['afterWorkImage'].map(file => `/${file.destination}/${file.filename}`.replace(/\\/g, '/'));
    booking.afterWorkImage = afterWorkImagePaths;
  }

  await booking.save();

  sendSuccess(res, booking, 'After-work images saved successfully. Please request and verify completion OTP to complete the service.');
});

exports.getBookingDetails = catchAsync(async (req, res) => {
  const vendorId = req.user._id;
  const { bookingId } = req.params;

  const mongoose = require('mongoose');
  const query = mongoose.isValidObjectId(bookingId)
    ? { _id: bookingId, vendorId }
    : { bookingId, vendorId };

  const booking = await Booking.findOne(query)
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
    .populate({
      path: 'address',
      model: 'UserAddress'
    })
    .lean();

  if (!booking) {
    throw new AppError('Booking not found or not assigned to you', 404, 'NOT_FOUND');
  }

  sendSuccess(res, booking, 'Booking details retrieved successfully');
});

exports.getVendorStats = catchAsync(async (req, res) => {
  const vendorId = req.user._id;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Total Completed Jobs
  const totalJobsCompleted = await Booking.countDocuments({
    vendorId,
    bookingStatus: 'completed'
  });

  // 2. Total Earnings (Sum of grandTotal for completed bookings)
  const earningsResult = await Booking.aggregate([
    {
      $match: {
        vendorId,
        bookingStatus: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$grandTotal' }
      }
    }
  ]);
  const totalEarnings = earningsResult.length > 0 ? earningsResult[0].total : 0;

  // 3. Total Upcoming/Assigned Jobs (waiting for acceptance)
  const totalUpcomingJobs = await Booking.countDocuments({
    vendorId,
    bookingStatus: 'assigned'
  });

  // 4. Total Future Accepted Jobs
  const totalFutureJobs = await Booking.countDocuments({
    vendorId,
    date: { $gt: endOfToday },
    bookingStatus: { $in: ['accepted', 'active'] }
  });

  // 5. Total Work Hours (Estimated at 2 hours per completed job)
  const totalWorkHours = totalJobsCompleted * 2;

  const stats = {
    totalEarnings,
    totalJobsCompleted,
    totalUpcomingJobs,
    totalFutureJobs,
    totalWorkHours
  };

  sendSuccess(res, stats, 'Vendor statistics retrieved successfully');
});

exports.sendEndOtp = catchAsync(async (req, res) => {
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

  if (booking.bookingStatus !== 'active') {
    throw new AppError('Booking must be active to send completion OTP', 400, 'BAD_REQUEST');
  }

  const generatedOtp = '1234'; // Static completion mock OTP
  booking.endOtp = generatedOtp;
  booking.endOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
  booking.isEndOtpVerified = false;

  await booking.save();

  console.log(`[MOCK SERVICE COMPLETION OTP] OTP for Booking ${booking.bookingId} is: ${generatedOtp}`);

  sendSuccess(res, { bookingId: booking.bookingId }, 'Service completion OTP sent to customer successfully (Mocked to 1234)');
});

exports.verifyEndOtp = catchAsync(async (req, res) => {
  const vendorId = req.user._id;
  const { bookingId } = req.params;
  const { otp } = req.body;

  const mongoose = require('mongoose');
  const query = mongoose.isValidObjectId(bookingId)
    ? { _id: bookingId, vendorId }
    : { bookingId, vendorId };

  const booking = await Booking.findOne(query);
  if (!booking) {
    throw new AppError('Booking not found or not assigned to you', 404, 'NOT_FOUND');
  }

  if (booking.bookingStatus !== 'active') {
    throw new AppError('Booking must be active to verify completion OTP', 400, 'BAD_REQUEST');
  }

  // Validate that if bookingType is outdoor, after-work image must be present
  if (booking.bookingType === 'outdoor' && (!booking.afterWorkImage || booking.afterWorkImage.length === 0)) {
    throw new AppError('After-work images are required for outdoor bookings before completing the service.', 400, 'BAD_REQUEST');
  }

  if (otp !== '1234') {
    throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
  }

  booking.isEndOtpVerified = true;
  booking.endOtp = null;
  booking.endOtpExpiresAt = null;
  booking.bookingStatus = 'completed';

  await booking.save();

  sendSuccess(res, { bookingId: booking.bookingId, bookingStatus: 'completed' }, 'Completion OTP verified successfully. Service completed.');
});
