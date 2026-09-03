const BaseService = require('../../core/BaseService');
const userRepository = require('../../modules/user/auth/user.repository');
const AppError = require('../../core/AppError');

class AdminUserService extends BaseService {
  constructor() {
    super(userRepository, 'admin-user');
  }

  async listAll(query = {}) {
    const filter = {};

    if (query.isDeleted !== undefined && query.isDeleted !== "") {
      filter.isDeleted = query.isDeleted === "true";
    } else {
      filter.isDeleted = { $ne: true };
    }

    if (query.status !== undefined && query.status !== "") {
      filter.status = query.status === "true";
    }
    
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phoneNumber: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 }
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const user = await this.repository.findById(id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const Booking = require('../../models/Booking.model');
    const bookings = await Booking.find({ userId: id })
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
        path: 'items.variantId',
        model: 'Variant',
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

    return {
      ...user,
      bookings
    };
  }

  async adjustWalletBalance(userId, { amount, type, description }, adminId) {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      throw new AppError('Amount must be a positive number greater than 0', 400, 'BAD_REQUEST');
    }

    if (type !== 'credit' && type !== 'debit') {
      throw new AppError('Transaction type must be either credit or debit', 400, 'BAD_REQUEST');
    }

    const User = require('../../models/User.model');
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const previousBalance = Number(user.walletBalance) || 0;
    if (type === 'debit' && previousBalance < numAmount) {
      throw new AppError(`Cannot debit ₹${numAmount}. User's current balance is only ₹${previousBalance}`, 400, 'INSUFFICIENT_BALANCE');
    }

    const currentBalance = type === 'credit'
      ? Math.round((previousBalance + numAmount) * 100) / 100
      : Math.round((previousBalance - numAmount) * 100) / 100;

    const UserWalletHistory = require('../../models/UserWalletHistory.model');
    const transaction = await UserWalletHistory.create({
      userId: user._id,
      transactionType: type,
      amount: numAmount,
      previousBalance,
      currentBalance,
      description: description || `Manual ${type} by admin`,
      performedBy: adminId || null,
      date: new Date()
    });

    user.walletBalance = currentBalance;
    await user.save();

    // Notify user about wallet update
    try {
      const notificationService = require('../../services/notification.service');
      const title = type === 'credit' ? 'Wallet Credited! 💰' : 'Wallet Debited! 💳';
      const body = type === 'credit'
        ? `₹${numAmount} has been credited to your DoorHelp wallet. Current balance: ₹${currentBalance}.`
        : `₹${numAmount} has been debited from your DoorHelp wallet. Current balance: ₹${currentBalance}.`;

      notificationService.sendToUser(user._id, {
        title,
        body,
        data: {
          transactionType: type,
          amount: String(numAmount),
          currentBalance: String(currentBalance),
          type: 'WALLET_UPDATE'
        }
      }).catch(err => console.error('Wallet notification error:', err.message));
    } catch (err) {
      console.error('Failed to trigger wallet notification:', err.message);
    }

    return {
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        walletBalance: user.walletBalance
      },
      transaction
    };
  }

  async getWalletHistory(userId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const UserWalletHistory = require('../../models/UserWalletHistory.model');
    const filter = { userId };

    const [total, transactions] = await Promise.all([
      UserWalletHistory.countDocuments(filter),
      UserWalletHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
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

module.exports = new AdminUserService();
