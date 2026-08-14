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

    let targetCategoryId = categoryId;

    // 1. If categoryId is not provided, fetch it from the user's current cart
    if (!targetCategoryId) {
      try {
        const cart = await cartService.getCart(userId);
        if (cart && cart.items && cart.items.length > 0) {
          const firstItem = cart.items[0];
          if (firstItem.subcategoryId && firstItem.subcategoryId.categoryId) {
            targetCategoryId = firstItem.subcategoryId.categoryId.toString();
          }
        }
      } catch (err) {
        this.logger.error(err, 'Error retrieving cart for slot category check');
      }
    }

    // 2. Count active vendors serving this category
    let activeVendorsCount = 0;
    if (targetCategoryId) {
      const Vendor = require('../../../models/Vendor.model');
      activeVendorsCount = await Vendor.countDocuments({
        categories: targetCategoryId,
        status: 'active',
        isDeleted: false
      });
    }

    // 3. Setup time ranges for query limits
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOf7Days = new Date();
    endOf7Days.setDate(endOf7Days.getDate() + 7);
    endOf7Days.setHours(23, 59, 59, 999);

    // 4. Fetch active bookings for this category in the next 7 days
    let activeBookings = [];
    if (targetCategoryId && activeVendorsCount > 0) {
      const BookingModel = this.repository.model;
      activeBookings = await BookingModel.find({
        'items.categoryId': targetCategoryId,
        bookingStatus: { $in: ['pending', 'assigned', 'accepted', 'scheduled'] },
        date: { $gte: startOfToday, $lte: endOf7Days }
      }).lean();
    }

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
      const dateStr = date.toISOString().split('T')[0];

      const dailySlots = {
        morning: [],
        afternoon: [],
        evening: []
      };

      for (const slotType of Object.keys(defaultSlots)) {
        for (const timeStr of defaultSlots[slotType]) {
          let isAvailable = true;

          if (targetCategoryId) {
            if (activeVendorsCount === 0) {
              isAvailable = false;
            } else {
              // Count bookings for this category at this day and time slot
              const bookingsCountAtSlot = activeBookings.filter(booking => {
                const bookingDayStr = booking.date.toISOString().split('T')[0];
                return bookingDayStr === dateStr && booking.timeSlot === timeStr;
              }).length;

              // If bookings meet or exceed active vendor capacity, the slot is busy
              if (bookingsCountAtSlot >= activeVendorsCount) {
                isAvailable = false;
              }
            }
          }

          dailySlots[slotType].push({
            time: timeStr,
            isAvailable
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
    const { date, timeSlot, slotType, paymentMode, address } = bookingData;

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
    if (savedAddress.status !== 'active') {
      throw new AppError('Selected address is inactive', 400, 'BAD_REQUEST');
    }

    // Check if service is available in saved address locality or pincode
    const localityMatch = await Locality.findOne({
      name: { $regex: new RegExp("^" + savedAddress.locality.trim() + "$", "i") },
      status: 'active',
      isDeleted: false
    });
    const pincodeMatch = await Pincode.findOne({
      pincode: { $regex: new RegExp("^" + savedAddress.pin.trim() + "$", "i") },
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
      address: finalAddress,
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
