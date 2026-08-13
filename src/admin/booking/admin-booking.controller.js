const catchAsync = require('../../core/catchAsync');
const Booking = require('../../models/Booking.model');
const Vendor = require('../../models/Vendor.model');
const AppError = require('../../core/AppError');
const { sendSuccess } = require('../../core/response');

exports.listAllBookings = catchAsync(async (req, res) => {
  const { page, limit, search, status } = req.query;
  const filter = {};

  if (status && status !== '') {
    filter.bookingStatus = status;
  }

  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    const User = require('../../models/User.model');
    const [matchingUsers, matchingVendors] = await Promise.all([
      User.find({
        $or: [
          { name: searchRegex },
          { phoneNumber: searchRegex }
        ]
      }).select('_id'),
      Vendor.find({
        name: searchRegex
      }).select('_id')
    ]);

    const userIds = matchingUsers.map(u => u._id);
    const vendorIds = matchingVendors.map(v => v._id);

    filter.$or = [
      { bookingId: searchRegex },
      { userId: { $in: userIds } },
      { vendorId: { $in: vendorIds } }
    ];
  }

  const { paginate } = require('../../core/paginate');
  const result = await paginate(Booking, filter, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sort: { createdAt: -1 },
    populate: [
      {
        path: 'userId',
        model: 'User',
        select: 'name phoneNumber email profileImage address location'
      },
      {
        path: 'vendorId',
        model: 'Vendor',
        select: 'name phoneNumber profileImage location tools skills status'
      },
      {
        path: 'items.subcategoryId',
        model: 'Subcategory',
        select: 'name price image originalPrice description'
      },
      {
        path: 'items.categoryId',
        model: 'Category',
        select: 'name'
      }
    ]
  });

  const { sendPaginated } = require('../../core/response');
  sendPaginated(res, result.data, result.pagination, 'All bookings fetched successfully');
});

exports.assignPartner = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const { vendorId } = req.body;

  if (!vendorId) {
    throw new AppError('vendorId is required', 400, 'BAD_REQUEST');
  }

  // 1. Verify Vendor exists and is active
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new AppError('Vendor not found', 404, 'NOT_FOUND');
  }

  // 2. Fetch booking
  const booking = await Booking.findOne({ bookingId });
  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND');
  }

  // Check if booking is paid
  if (booking.paymentStatus !== 'paid') {
    throw new AppError('Booking payment is not paid', 400, 'BAD_REQUEST');
  }

  // 3. Update booking
  booking.vendorId = vendorId;
  booking.bookingStatus = 'assigned';

  // If vendor was in declined list, remove them so they can reconsider
  booking.declinedVendors = booking.declinedVendors.filter(
    id => id.toString() !== vendorId.toString()
  );

  await booking.save();

  // Populate vendor info for the response
  const updatedBooking = await Booking.findById(booking._id)
    .populate({
      path: 'vendorId',
      model: 'Vendor',
      select: 'name phoneNumber profileImage location'
    })
    .lean();

  sendSuccess(res, updatedBooking, `Booking successfully assigned to vendor ${vendor.name || vendorId}`);
});

exports.getBookingDetails = catchAsync(async (req, res) => {
  const { bookingId } = req.params;

  const mongoose = require('mongoose');
  const query = mongoose.isValidObjectId(bookingId)
    ? { $or: [{ _id: bookingId }, { bookingId }] }
    : { bookingId };

  const booking = await Booking.findOne(query)
    .populate({
      path: 'userId',
      model: 'User',
      select: 'name phoneNumber email profileImage address location'
    })
    .populate({
      path: 'vendorId',
      model: 'Vendor',
      select: 'name phoneNumber profileImage location tools skills status'
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
    .lean();

  if (!booking) {
    const AppError = require('../../core/AppError');
    throw new AppError('Booking not found', 404, 'NOT_FOUND');
  }

  sendSuccess(res, booking, 'Booking details fetched successfully');
});
