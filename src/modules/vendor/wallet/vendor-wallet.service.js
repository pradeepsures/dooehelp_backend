const BaseService = require('../../../core/BaseService');
const vendorWalletRepository = require('./vendor-wallet.repository');
const VendorWalletHistory = require('../../../models/VendorWalletHistory.model');
const Vendor = require('../../../models/Vendor.model');
const Booking = require('../../../models/Booking.model');
const PlatformFee = require('../../../models/PlatformFee.model');
const AppError = require('../../../core/AppError');

class VendorWalletService extends BaseService {
  constructor() {
    super(vendorWalletRepository, 'vendor-wallet');
  }

  /**
   * Automatically credit vendor wallet upon booking completion.
   * Deducts dynamic platform fee and tracks previous & current balances.
   */
  async recordBookingCompletionEarnings(vendorId, booking) {
    this.logger.info({ vendorId, bookingId: booking._id }, 'recordBookingCompletionEarnings initiated');

    // 1. Check for existing history to avoid duplicate credits
    const existing = await VendorWalletHistory.findOne({ bookingId: booking._id });
    if (existing) {
      this.logger.info({ bookingId: booking._id }, 'Wallet earnings already recorded for this booking');
      return existing;
    }

    // 2. Fetch active dynamic Platform Fee from PlatformFee model
    const feeConfig = await PlatformFee.findOne({ status: 'active', isDeleted: false }).sort({ createdAt: -1 });
    const platformFeeRate = feeConfig && typeof feeConfig.platformFee === 'number' ? feeConfig.platformFee : 20;
    const gstRate = feeConfig && typeof feeConfig.gst === 'number' ? feeConfig.gst : 18;

    // 3. Service Total calculation (Actual Service Price, excluding user GST)
    const serviceTotal = Number(booking.serviceTotal) || (booking.grandTotal ? Number(booking.grandTotal) : 0);
    const userGstAmount = Number(booking.taxAndFees) || 0;
    const userPaidTotal = Number(booking.grandTotal) || (serviceTotal + userGstAmount);

    // Dynamic admin commission percentage on serviceTotal
    const commissionRate = platformFeeRate;
    const commissionAmount = Math.round(((serviceTotal * commissionRate) / 100) * 100) / 100;
    const platformFeeAmount = commissionAmount;
    const gstAmount = Math.round(((platformFeeAmount * gstRate) / 100) * 100) / 100;

    // Net earnings added to vendor wallet (Service Price - Admin Commission)
    const netCreditAmount = Math.round((serviceTotal - commissionAmount) * 100) / 100;

    // 4. Retrieve vendor current balance
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'NOT_FOUND');
    }

    const previousBalance = Number(vendor.walletBalance) || 0;
    const currentBalance = Math.round((previousBalance + netCreditAmount) * 100) / 100;

    // 5. Build service info
    const serviceName = booking.items && booking.items.length > 0
      ? booking.items.map(item => item.name).filter(Boolean).join(', ')
      : 'Service Completed';

    const itemsSummary = (booking.items || []).map(item => ({
      name: item.name,
      variantId: item.variantId,
      subcategoryId: item.subcategoryId,
      quantity: item.quantity || 1,
      price: item.price || 0
    }));

    // 6. Create VendorWalletHistory entry
    const historyEntry = await VendorWalletHistory.create({
      vendorId,
      bookingId: booking._id,
      bookingCustomId: booking.bookingId,
      serviceName,
      items: itemsSummary,
      serviceTotal,
      userGstAmount,
      userPaidTotal,
      commissionRate,
      commissionAmount,
      platformFeeRate,
      platformFeeAmount,
      gstRate,
      gstAmount,
      amount: netCreditAmount,
      previousBalance,
      currentBalance,
      transactionType: 'credit',
      description: `Payment credited for ${booking.bookingId} (${serviceName}) from service price ₹${serviceTotal} after deducting ${commissionRate}% commission (₹${commissionAmount})`,
      date: new Date()
    });

    // 7. Update Vendor's walletBalance
    await Vendor.findByIdAndUpdate(vendorId, { walletBalance: currentBalance });

    this.logger.info(
      { vendorId, previousBalance, netCreditAmount, currentBalance },
      'Vendor wallet credited successfully'
    );

    return historyEntry;
  }

  /**
   * Get vendor wallet summary with timeframe filter (today, week, month, all) and full breakdown.
   */
  async getWalletSummary(vendorId, query = {}) {
    const vendor = await Vendor.findById(vendorId).select('name phoneNumber walletBalance');
    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'NOT_FOUND');
    }

    const now = new Date();

    // 1. Start of Today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // 2. Start of This Week (last 7 days rolling)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    // 3. Start of This Month (first day of current calendar month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Determine query filter if provided: 'today', 'week', 'month', 'all'
    const filterType = (query.filter || query.period || 'all').toLowerCase().trim();
    let filterDateMatch = null;

    if (filterType === 'today' || filterType === 'daily') {
      filterDateMatch = { $gte: startOfToday, $lte: endOfToday };
    } else if (filterType === 'week' || filterType === 'weekly') {
      filterDateMatch = { $gte: startOfWeek };
    } else if (filterType === 'month' || filterType === 'monthly') {
      filterDateMatch = { $gte: startOfMonth };
    } else if (query.startDate || query.endDate) {
      filterDateMatch = {};
      if (query.startDate) {
        const s = new Date(query.startDate);
        s.setHours(0, 0, 0, 0);
        filterDateMatch.$gte = s;
      }
      if (query.endDate) {
        const e = new Date(query.endDate);
        e.setHours(23, 59, 59, 999);
        filterDateMatch.$lte = e;
      }
    }

    const [aggregationResult] = await VendorWalletHistory.aggregate([
      { $match: { vendorId: vendor._id } },
      {
        $facet: {
          allTime: [
            {
              $group: {
                _id: null,
                totalEarnings: { $sum: '$amount' },
                totalServiceAmount: { $sum: '$serviceTotal' },
                totalCommissionDeducted: { $sum: '$commissionAmount' },
                totalPlatformFeeDeducted: { $sum: '$platformFeeAmount' },
                totalOrdersCompleted: { $sum: 1 }
              }
            }
          ],
          today: [
            { $match: { date: { $gte: startOfToday, $lte: endOfToday } } },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$amount' },
                serviceAmount: { $sum: '$serviceTotal' },
                commissionDeducted: { $sum: '$commissionAmount' },
                ordersCompleted: { $sum: 1 }
              }
            }
          ],
          thisWeek: [
            { $match: { date: { $gte: startOfWeek } } },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$amount' },
                serviceAmount: { $sum: '$serviceTotal' },
                commissionDeducted: { $sum: '$commissionAmount' },
                ordersCompleted: { $sum: 1 }
              }
            }
          ],
          thisMonth: [
            { $match: { date: { $gte: startOfMonth } } },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$amount' },
                serviceAmount: { $sum: '$serviceTotal' },
                commissionDeducted: { $sum: '$commissionAmount' },
                ordersCompleted: { $sum: 1 }
              }
            }
          ],
          selectedFilter: filterDateMatch ? [
            { $match: { date: filterDateMatch } },
            {
              $group: {
                _id: null,
                earnings: { $sum: '$amount' },
                serviceAmount: { $sum: '$serviceTotal' },
                commissionDeducted: { $sum: '$commissionAmount' },
                ordersCompleted: { $sum: 1 }
              }
            }
          ] : []
        }
      }
    ]);

    const allTime = aggregationResult?.allTime?.[0] || {
      totalEarnings: 0,
      totalServiceAmount: 0,
      totalCommissionDeducted: 0,
      totalPlatformFeeDeducted: 0,
      totalOrdersCompleted: 0
    };

    const today = aggregationResult?.today?.[0] || {
      earnings: 0,
      serviceAmount: 0,
      commissionDeducted: 0,
      ordersCompleted: 0
    };

    const thisWeek = aggregationResult?.thisWeek?.[0] || {
      earnings: 0,
      serviceAmount: 0,
      commissionDeducted: 0,
      ordersCompleted: 0
    };

    const thisMonth = aggregationResult?.thisMonth?.[0] || {
      earnings: 0,
      serviceAmount: 0,
      commissionDeducted: 0,
      ordersCompleted: 0
    };

    const selectedFilterData = aggregationResult?.selectedFilter?.[0] || {
      earnings: 0,
      serviceAmount: 0,
      commissionDeducted: 0,
      ordersCompleted: 0
    };

    return {
      vendorId: vendor._id,
      vendorName: vendor.name,
      walletBalance: Number(vendor.walletBalance) || 0,
      activeFilter: filterType,
      filteredEarnings: Math.round((filterDateMatch ? selectedFilterData.earnings : allTime.totalEarnings) * 100) / 100,
      filteredServiceAmount: Math.round((filterDateMatch ? selectedFilterData.serviceAmount : allTime.totalServiceAmount) * 100) / 100,
      filteredCommissionDeducted: Math.round((filterDateMatch ? selectedFilterData.commissionDeducted : (allTime.totalCommissionDeducted || allTime.totalPlatformFeeDeducted)) * 100) / 100,
      filteredOrdersCompleted: filterDateMatch ? selectedFilterData.ordersCompleted : allTime.totalOrdersCompleted,
      allTime: {
        totalEarnings: Math.round(allTime.totalEarnings * 100) / 100,
        totalServiceAmount: Math.round(allTime.totalServiceAmount * 100) / 100,
        totalCommissionDeducted: Math.round((allTime.totalCommissionDeducted || allTime.totalPlatformFeeDeducted) * 100) / 100,
        totalOrdersCompleted: allTime.totalOrdersCompleted
      },
      today: {
        earnings: Math.round(today.earnings * 100) / 100,
        serviceAmount: Math.round(today.serviceAmount * 100) / 100,
        commissionDeducted: Math.round(today.commissionDeducted * 100) / 100,
        ordersCompleted: today.ordersCompleted
      },
      thisWeek: {
        earnings: Math.round(thisWeek.earnings * 100) / 100,
        serviceAmount: Math.round(thisWeek.serviceAmount * 100) / 100,
        commissionDeducted: Math.round(thisWeek.commissionDeducted * 100) / 100,
        ordersCompleted: thisWeek.ordersCompleted
      },
      thisMonth: {
        earnings: Math.round(thisMonth.earnings * 100) / 100,
        serviceAmount: Math.round(thisMonth.serviceAmount * 100) / 100,
        commissionDeducted: Math.round(thisMonth.commissionDeducted * 100) / 100,
        ordersCompleted: thisMonth.ordersCompleted
      }
    };
  }

  /**
   * Get all vendor wallet transactions with pagination and search
   */
  async getWalletHistory(vendorId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { vendorId };

    // Transaction Type filter ('credit', 'debit')
    if (query.transactionType) {
      filter.transactionType = query.transactionType;
    }

    // Search filter by bookingCustomId, serviceName, or description
    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      filter.$or = [
        { bookingCustomId: { $regex: s, $options: 'i' } },
        { serviceName: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } }
      ];
    }

    // Optional date filter if explicitly passed to history
    if (query.filter || query.period) {
      const p = (query.filter || query.period).toLowerCase().trim();
      const now = new Date();
      if (p === 'today' || p === 'daily') {
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        const end = new Date(now); end.setHours(23, 59, 59, 999);
        filter.date = { $gte: start, $lte: end };
      } else if (p === 'week' || p === 'weekly') {
        const start = new Date(now); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
        filter.date = { $gte: start };
      } else if (p === 'month' || p === 'monthly') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1); start.setHours(0, 0, 0, 0);
        filter.date = { $gte: start };
      }
    }

    const [total, transactions] = await Promise.all([
      VendorWalletHistory.countDocuments(filter),
      VendorWalletHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('bookingId', 'bookingId date timeSlot paymentMode paymentStatus')
        .lean()
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        totalItems: total
      }
    };
  }
}

module.exports = new VendorWalletService();
