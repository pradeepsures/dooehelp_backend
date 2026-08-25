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

  async getAvailableSlots(userId, categoryId) {
    this.logger.info({ userId, categoryId }, 'getAvailableSlots');

    const defaultSlots = {
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

      // Construct date string in local time to avoid UTC day shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dailySlots = {
        morning: [],
        afternoon: [],
        evening: []
      };

      for (const slotType of Object.keys(defaultSlots)) {
        for (const timeStr of defaultSlots[slotType]) {
          dailySlots[slotType].push({
            time: timeStr,
            isAvailable: true
          });
        }
      }

      days.push({
        date: dateStr,
        dayName: isToday ? `${dayName} Today` : dayName,
        dayOfMonth,
        isToday,
        slots: dailySlots
      });
    }

    return days;
  }

  async createBooking(userId, bookingData) {
    this.logger.info({ userId, bookingData }, 'createBooking');
    const { date, timeSlot, slotType, paymentMode, address, bookingType } = bookingData;

    // Fetch user profile location default
    const user = await User.findById(userId);
    let bookingLocation = user?.location || { lat: null, long: null };

    const Locality = require('../../../models/Locality.model');
    const Pincode = require('../../../models/Pincode.model');
    const UserAddress = require('../../../models/UserAddress.model');

    const savedAddress = await UserAddress.findOne({ _id: address, isDeleted: false });
    if (!savedAddress) {
      throw new AppError('Selected user address not found', 404, 'NOT_FOUND');
    }
    // if (savedAddress.status !== 'active') {
    //   throw new AppError('Selected address is inactive', 400, 'BAD_REQUEST');
    // }

    // Check if service is available in saved address locality or pincode
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedLocality = escapeRegExp(savedAddress.locality.trim());
    const escapedPin = escapeRegExp(savedAddress.pin.trim());

    const localityMatch = await Locality.findOne({
      name: { $regex: new RegExp("^" + escapedLocality + "$", "i") },
      status: 'active',
      isDeleted: false
    });
    const pincodeMatch = await Pincode.findOne({
      pincode: { $regex: new RegExp("^" + escapedPin + "$", "i") },
      status: 'active',
      isDeleted: false
    });

    if (!localityMatch && !pincodeMatch) {
      throw new AppError('Service is not available in your locality or pincode', 400, 'SERVICE_UNAVAILABLE');
    }

    // Override coordinates with address coordinates if set
    if (savedAddress.location && savedAddress.location.lat !== null && savedAddress.location.long !== null) {
      bookingLocation = {
        lat: savedAddress.location.lat,
        long: savedAddress.location.long
      };
    }
    // Formulate formatted address string: Name, Mobile, House/Flat, Locality, Landmark, Address, City, State, PIN, Country
    const addressParts = [
      savedAddress.name,
      savedAddress.mobile ? `Mobile: ${savedAddress.mobile}` : null,
      savedAddress.houseFlat,
      savedAddress.locality,
      savedAddress.landmark,
      savedAddress.address,
      savedAddress.city,
      savedAddress.state,
      `PIN: ${savedAddress.pin}`,
      savedAddress.country
    ].filter(part => part !== undefined && part !== null && String(part).trim() !== '');
    const finalAddress = addressParts.join(', ');

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

      let itemPrice = subcat.price;
      let itemName = subcat.name;
      let variantId = null;

      if (item.variantId) {
        itemPrice = item.variantId.price;
        itemName = item.variantId.name;
        variantId = item.variantId._id || item.variantId;
      }

      const quantity = item.quantity;
      const itemTotal = itemPrice * quantity;

      serviceTotal += itemTotal;

      bookingItems.push({
        subcategoryId: subcat._id,
        variantId,
        quantity,
        price: itemPrice,
        name: itemName,
        categoryId: subcat.categoryId
      });
    }

    // 4. Calculate Tax (e.g., 5%) and Delivery (0)
    const taxAndFees = Math.round(serviceTotal * 0.05);
    const deliveryFee = 0; // FREE
    const grandTotal = serviceTotal + taxAndFees + deliveryFee;

    // 5. Use resolved booking location coordinates
    const location = bookingLocation;

    // 6. Generate readable bookingId (e.g. Booking-123456)
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const bookingId = `Booking-${randomNum}`;

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
      bookingStatus: 'pending',
      bookingType: bookingType || 'indoor'
    });

    // 8. Clear cart
    await cartService.clearCart(userId);

    this.logger.info({ bookingId: newBooking.bookingId }, 'Booking created successfully');
    return newBooking;
  }

  async confirmPayment(userId, bookingId) {
    const mongoose = require('mongoose');
    const query = mongoose.isValidObjectId(bookingId)
      ? { _id: bookingId, userId }
      : { bookingId, userId };

    const booking = await this.repository.findOne(query);
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
        select: 'name email profileImage'
      })
      .populate({
        path: 'items.subcategoryId',
        model: 'Subcategory',
        select: 'image'
      })
      .sort({ createdAt: -1 });

    if (limit && !isNaN(limit)) {
      dbQuery = dbQuery.skip(skip).limit(limit);
    }

    const list = await dbQuery.lean();

    return list.map(booking => {
      const firstItem = booking.items && booking.items[0];
      const serviceImage = firstItem?.subcategoryId?.image || '';

      const response = {
        _id: booking._id,
        bookingId: booking.bookingId,
        date: booking.date,
        timeSlot: booking.timeSlot,
        bookingStatus: booking.bookingStatus,
        serviceName: firstItem?.name || '',
        serviceImage: serviceImage,
        image: serviceImage,
      };

      if (booking.vendorId) {
        response.vendor = {
          name: booking.vendorId.name || '',
          email: booking.vendorId.email || '',
          image: booking.vendorId.profileImage || '',
        };
      } else {
        response.vendor = null;
      }

      return response;
    });
  }

  async getBookingDetails(userId, bookingId) {
    const mongoose = require('mongoose');
    const query = mongoose.isValidObjectId(bookingId)
      ? { _id: bookingId, userId }
      : { bookingId, userId };

    const BookingModel = this.repository.model;
    const booking = await BookingModel.findOne(query)
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
      .populate({
        path: 'items.variantId',
        model: 'Variant',
        select: 'name price image originalPrice description'
      })
      .populate({
        path: 'address',
        model: 'UserAddress'
      })
      .lean();

    if (!booking) {
      throw new AppError('Booking not found', 404, 'NOT_FOUND');
    }

    return booking;
  }
}

module.exports = new BookingService();
