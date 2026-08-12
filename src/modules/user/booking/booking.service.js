const BaseService = require('../../../core/BaseService');
const bookingRepository = require('./booking.repository');
const cartService = require('../cart/cart.service');
const User = require('../../../models/User.model');
const Subcategory = require('../../../models/Subcategory.model');
const AppError = require('../../../core/AppError');

class BookingService extends BaseService {
  constructor() {
    super(bookingRepository, 'booking');
  }

  async getAvailableSlots() {
    this.logger.info('getAvailableSlots');
    const slots = {
      morning: ["08:00 AM", "09:30 AM", "11:00 AM"],
      afternoon: ["01:00 PM", "02:30 PM", "04:00 PM"],
      evening: ["05:30 PM", "07:00 PM"]
    };

    const days = [];
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const dayOfMonth = date.getDate();
      const dayName = weekdays[date.getDay()];
      const isToday = i === 0;

      days.push({
        date: date.toISOString().split('T')[0],
        dayName: isToday ? `${dayName} Today` : dayName,
        dayOfMonth,
        isToday,
        slots
      });
    }

    return days;
  }

  async createBooking(userId, bookingData) {
    this.logger.info({ userId, bookingData }, 'createBooking');
    const { date, timeSlot, slotType, paymentMode, address } = bookingData;

    // 1. Get user cart
    const cart = await cartService.getCart(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400, 'CART_EMPTY');
    }

    const cartItems = cart.items;
    if (cartItems.length === 0) {
      throw new AppError('Cart is empty', 400, 'CART_EMPTY');
    }

    // 3. Prepare items and totals
    const bookingItems = [];
    let serviceTotal = 0;

    for (const item of cartItems) {
      const subcat = item.subcategoryId; // populated
      if (!subcat) {
        throw new AppError('One of the services in cart is invalid or deleted', 400, 'INVALID_SERVICE');
      }
      const itemPrice = subcat.price;
      const quantity = item.quantity;
      const itemTotal = itemPrice * quantity;

      serviceTotal += itemTotal;

      bookingItems.push({
        subcategoryId: subcat._id,
        quantity,
        price: itemPrice,
        name: subcat.name,
        categoryId: subcat.categoryId
      });
    }

    // 4. Calculate Tax (e.g., 5%) and Delivery (0)
    const taxAndFees = Math.round(serviceTotal * 0.05);
    const deliveryFee = 0; // FREE
    const grandTotal = serviceTotal + taxAndFees + deliveryFee;

    // 5. Fetch user profile location coordinates
    const user = await User.findById(userId);
    const location = user?.location || { lat: null, long: null };

    // 6. Generate readable bookingId (e.g. #DH-88291-XL)
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const randomStr = Math.random().toString(36).substring(2, 4).toUpperCase();
    const bookingId = `#DH-${randomNum}-${randomStr}`;

    // 7. Create booking
    const newBooking = await this.repository.create({
      bookingId,
      userId,
      items: bookingItems,
      serviceTotal,
      taxAndFees,
      deliveryFee,
      grandTotal,
      date: new Date(date),
      timeSlot,
      slotType,
      address,
      location,
      paymentMode,
      paymentStatus: 'pending',
      bookingStatus: 'pending'
    });

    // 8. Clear cart
    await cartService.clearCart(userId);

    this.logger.info({ bookingId: newBooking.bookingId }, 'Booking created successfully');
    return newBooking;
  }

  async confirmPayment(userId, bookingId) {
    this.logger.info({ userId, bookingId }, 'confirmPayment');

    const booking = await this.repository.findOne({ bookingId, userId });
    if (!booking) {
      throw new AppError('Booking not found', 404, 'NOT_FOUND');
    }

    if (booking.paymentStatus === 'paid') {
      throw new AppError('Payment already confirmed for this booking', 400, 'BAD_REQUEST');
    }

    const updatedBooking = await this.repository.updateById(booking._id, {
      paymentStatus: 'paid',
      bookingStatus: 'scheduled'
    });

    return updatedBooking;
  }

  async getBookings(userId, query = {}) {
    this.logger.info({ userId, query }, 'getBookings');

    const {
      type = 'upcoming',
      bookingStatus,
      paymentStatus,
      paymentMode,
      date,
      startDate,
      endDate,
      bookingId,
      categoryId,
      subcategoryId
    } = query;

    let filter = { userId };

    // 1. Status Filter (override by bookingStatus if provided)
    if (bookingStatus) {
      if (bookingStatus.includes(',')) {
        filter.bookingStatus = { $in: bookingStatus.split(',').map(s => s.trim()) };
      } else {
        filter.bookingStatus = bookingStatus;
      }
    } else {
      if (type === 'upcoming') {
        filter.bookingStatus = { $in: ['pending', 'assigned', 'accepted', 'scheduled'] };
      } else if (type === 'history') {
        filter.bookingStatus = { $in: ['completed', 'cancelled', 'declined'] };
      }
    }

    // 2. Payment Status Filter
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // 3. Payment Mode Filter
    if (paymentMode) {
      filter.paymentMode = paymentMode;
    }

    // 4. Booking ID Filter
    if (bookingId) {
      filter.bookingId = { $regex: bookingId, $options: 'i' };
    }

    // 5. Date Filters
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // 6. Category/Subcategory ID filters
    if (categoryId) {
      filter['items.categoryId'] = categoryId;
    }
    if (subcategoryId) {
      filter['items.subcategoryId'] = subcategoryId;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    const BookingModel = this.repository.model;
    let dbQuery = BookingModel.find(filter)
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
      .sort({ createdAt: -1 });

    if (limit && !isNaN(limit)) {
      dbQuery = dbQuery.skip(skip).limit(limit);
    }

    const list = await dbQuery.lean();
    return list;
  }

  async getBookingDetails(userId, bookingId) {
    this.logger.info({ userId, bookingId }, 'getBookingDetails');

    const BookingModel = this.repository.model;
    const booking = await BookingModel.findOne({ bookingId })
      .populate({
        path: 'vendorId',
        model: 'Vendor',
        select: 'name phoneNumber profileImage location tools skills status'
      })
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
      .lean();

    if (!booking) {
      throw new AppError('Booking not found', 404, 'NOT_FOUND');
    }

    return booking;
  }
}

module.exports = new BookingService();
