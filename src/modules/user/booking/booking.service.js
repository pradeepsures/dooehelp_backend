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

  async getAvailableSlots(userId, options = {}) {
    this.logger.info({ userId, options }, 'getAvailableSlots');

    const Variant = require('../../../models/Variant.model');
    const Subcategory = require('../../../models/Subcategory.model');
    const Vendor = require('../../../models/Vendor.model');
    const Booking = require('../../../models/Booking.model');

    let categoryId = options.categoryId;
    let variantId = options.variantId;
    let subcategoryId = options.subcategoryId;
    let duration = options.duration;
    let all = options.all;
    let filterUnavailable = options.filterUnavailable;

    let resolvedDuration = duration ? parseInt(duration, 10) : null;
    let resolvedCategoryId = categoryId || null;

    // 1. If variantId is provided, fetch variant to get duration and subcategory/category
    if (variantId) {
      const variant = await Variant.findById(variantId).populate('subCategoryId');
      if (variant) {
        if (!resolvedDuration && variant.duration) {
          resolvedDuration = variant.duration;
        }
        if (!resolvedCategoryId && variant.subCategoryId?.categoryId) {
          resolvedCategoryId = variant.subCategoryId.categoryId.toString();
        }
      }
    } else if (subcategoryId) {
      const variant = await Variant.findOne({ subCategoryId: subcategoryId, status: true, isDeleted: false });
      if (variant && !resolvedDuration && variant.duration) {
        resolvedDuration = variant.duration;
      }
      if (!resolvedCategoryId) {
        const subcat = await Subcategory.findById(subcategoryId);
        if (subcat?.categoryId) {
          resolvedCategoryId = subcat.categoryId.toString();
        }
      }
    } else if (!resolvedDuration || !resolvedCategoryId) {
      // Look up user's active cart to retrieve selected variant and category
      try {
        const cart = await cartService.getCart(userId);
        if (cart && cart.items && cart.items.length > 0) {
          for (const item of cart.items) {
            const v = item.variantId;
            const s = item.subcategoryId;
            if (v && v.duration && !resolvedDuration) {
              resolvedDuration = v.duration;
            }
            if (s && s.categoryId && !resolvedCategoryId) {
              resolvedCategoryId = (s.categoryId._id || s.categoryId).toString();
            }
          }
        }
      } catch (err) {
        this.logger.warn({ err: err.message }, 'Failed to read cart for slot details');
      }
    }

    // Default duration to 30 minutes if not specified or invalid
    if (!resolvedDuration || isNaN(resolvedDuration) || resolvedDuration <= 0) {
      resolvedDuration = 30;
    }

    // 2. Fetch eligible partners for the resolved category
    let totalEligiblePartners = 0;
    let eligiblePartnerIds = [];

    if (resolvedCategoryId) {
      const eligiblePartners = await Vendor.find({
        categories: { $in: [resolvedCategoryId] },
        status: 'active',
        isDeleted: false,
        isVerified: true,
        isProfileApproved: { $ne: false }
      }).select('_id').lean();

      totalEligiblePartners = eligiblePartners.length;
      eligiblePartnerIds = eligiblePartners.map(p => p._id);
    }

    // 3. Prepare date range for the next 7 days
    const days = [];
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const now = new Date();
    const formatLocalDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startOfRange = new Date();
    startOfRange.setHours(0, 0, 0, 0);
    const endOfRange = new Date();
    endOfRange.setDate(endOfRange.getDate() + 7);
    endOfRange.setHours(23, 59, 59, 999);

    // 4. Fetch active bookings in the 7-day range for eligible partners
    const busyPartnersMap = new Map();
    if (eligiblePartnerIds.length > 0) {
      const activeBookings = await Booking.find({
        vendorId: { $in: eligiblePartnerIds },
        date: { $gte: startOfRange, $lte: endOfRange },
        bookingStatus: { $in: ['assigned', 'accepted', 'scheduled', 'active'] }
      }).select('vendorId date timeSlot').lean();

      for (const b of activeBookings) {
        if (!b.date || !b.timeSlot) continue;
        const bDate = new Date(b.date);
        const dStr = formatLocalDate(bDate);
        const key = `${dStr}_${b.timeSlot.trim().toUpperCase()}`;
        if (!busyPartnersMap.has(key)) {
          busyPartnersMap.set(key, new Set());
        }
        busyPartnersMap.get(key).add(b.vendorId.toString());
      }
    }

    const formatMinutesTo12Hour = (minutes) => {
      const hours24 = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
      return `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
    };

    const getSlotType = (minutes) => {
      if (minutes < 720) return 'morning'; // 8:00 AM - 11:59 AM
      if (minutes < 1020) return 'afternoon'; // 12:00 PM - 4:59 PM (17:00 = 1020)
      return 'evening'; // 5:00 PM - 8:00 PM
    };

    const showAll = all === 'true' || all === true;
    const shouldFilterUnavailable = !showAll && filterUnavailable !== 'false' && filterUnavailable !== false;

    // 5. Generate slots for next 7 days (8:00 AM to 8:00 PM)
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const dayOfMonth = date.getDate();
      const dayName = weekdays[date.getDay()];
      const isToday = i === 0;
      const dateStr = formatLocalDate(date);

      const dailySlots = {
        morning: [],
        afternoon: [],
        evening: []
      };

      // 8:00 AM to 8:00 PM
      const startMinutes = 8 * 60; // 480
      const endMinutes = 20 * 60; // 1200

      for (let curMin = startMinutes; curMin + resolvedDuration <= endMinutes; curMin += resolvedDuration) {
        const timeStr = formatMinutesTo12Hour(curMin);
        const slotType = getSlotType(curMin);

        // Check if the slot is in the past for today
        let isPast = false;
        if (isToday) {
          const slotDateTime = new Date(date);
          const hours24 = Math.floor(curMin / 60);
          const mins = curMin % 60;
          slotDateTime.setHours(hours24, mins, 0, 0);
          if (slotDateTime <= now) {
            isPast = true;
          }
        }

        // Check partner availability
        let isPartnerAvailable = true;
        if (resolvedCategoryId) {
          if (totalEligiblePartners === 0) {
            isPartnerAvailable = false;
          } else {
            const key = `${dateStr}_${timeStr.trim().toUpperCase()}`;
            const busyCount = busyPartnersMap.get(key)?.size || 0;
            if (busyCount >= totalEligiblePartners) {
              isPartnerAvailable = false;
            }
          }
        }

        const isAvailable = !isPast && isPartnerAvailable;

        if (isAvailable || !shouldFilterUnavailable) {
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
        variantDuration: resolvedDuration,
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
      const variant = item.variantId; // populated
      if (!subcat || !variant) {
        throw new AppError('One of the services in cart is invalid or deleted', 400, 'INVALID_SERVICE');
      }

      const itemPrice = variant.price;
      const itemName = variant.name;
      const variantId = variant._id || variant;

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

    // 4. Calculate dynamic GST tax from PlatformFee model and Delivery (0)
    const PlatformFee = require('../../../models/PlatformFee.model');
    const feeConfig = await PlatformFee.findOne({ status: 'active', isDeleted: false }).sort({ createdAt: -1 });
    const gstRate = feeConfig && typeof feeConfig.gst === 'number' ? feeConfig.gst : 18;
    const taxAndFees = Math.round((serviceTotal * gstRate) / 100);
    const deliveryFee = 0; // FREE
    const grandTotal = serviceTotal + taxAndFees + deliveryFee;

    // 5. Verify slot partner availability
    const Vendor = require('../../../models/Vendor.model');
    const categoryIds = [...new Set(bookingItems.map(item => item.categoryId?.toString()).filter(Boolean))];
    if (categoryIds.length > 0) {
      const eligiblePartners = await Vendor.find({
        categories: { $in: categoryIds },
        status: 'active',
        isDeleted: false,
        isVerified: true,
        isProfileApproved: { $ne: false }
      }).select('_id').lean();

      if (eligiblePartners.length > 0) {
        const bookingDate = new Date(date);
        const startOfDay = new Date(bookingDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(bookingDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const busyPartnerIds = await this.repository.model.distinct('vendorId', {
          vendorId: { $in: eligiblePartners.map(p => p._id) },
          date: { $gte: startOfDay, $lte: endOfDay },
          timeSlot: timeSlot,
          bookingStatus: { $in: ['assigned', 'accepted', 'scheduled', 'active'] }
        });

        if (busyPartnerIds.length >= eligiblePartners.length) {
          throw new AppError('The selected time slot is no longer available. Please select another slot.', 400, 'SLOT_UNAVAILABLE');
        }
      }
    }

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
