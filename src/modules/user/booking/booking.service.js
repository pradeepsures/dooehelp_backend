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

  async getBookings(userId, type = 'upcoming') {
    this.logger.info({ userId, type }, 'getBookings');

    let filter = { userId };
    if (type === 'upcoming') {
      filter.bookingStatus = { $in: ['pending', 'assigned', 'accepted', 'scheduled'] };
    } else {
      filter.bookingStatus = { $in: ['completed', 'cancelled', 'declined'] };
    }

    const BookingModel = this.repository.model;
    const list = await BookingModel.find(filter)
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
      .sort({ createdAt: -1 })
      .lean();

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
